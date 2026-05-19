/**
 * @module BookingService
 * @description Pure business logic layer for the Booking domain.
 *
 * ARCHITECTURE RULE: This layer has NO knowledge of HTTP (req/res).
 * Functions here accept plain data and return plain data or throw errors.
 * This makes the logic reusable in:
 *   - Controllers (HTTP handlers)
 *   - Cron jobs (scheduled settlement)
 *   - Admin scripts (manual operations)
 *   - Tests (unit testing without HTTP stack)
 */

import { prisma } from "../../config/prisma.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import generateQRCode from "../../utils/generateQRCode.js";
import adjustTime from "../../utils/adjustTime.js";
import { generateHTMLContent } from "../../utils/generateEmail.js";
import { generateInvoice } from "../../utils/generateInvoice.js";
import NotificationService from "../../services/notification.service.js";
import { format, parseISO, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import logger from "../../utils/logger.js";
import { BOOKING_STATUS } from "@kridaz/shared-constants/bookingStatus";
import { bookingCreatedTotal, paymentTotal } from "../../utils/metrics.js";

/**
 * Checks if a time slot is available for a given turf and date range.
 * @param {string} turfId - The turf to check availability for.
 * @param {Date} startTime - The requested start time.
 * @param {Date} endTime - The requested end time.
 * @returns {Promise<boolean>} True if the slot is available.
 */
export const isSlotAvailable = async (turfId, startTime, endTime) => {
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      turfId,
      status: { notIn: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED] },
      timeSlot: {
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    },
  });
  return !conflictingBooking;
};

/**
 * Fetches full booking details by ID, including turf and user information.
 * @param {string} bookingId - The booking UUID.
 * @returns {Promise<import('@prisma/client').Booking | null>}
 */
export const findBookingById = async (bookingId) => {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      turf: {
        select: {
          id: true,
          name: true,
          location: true,
          city: true,
          state: true,
          owner: { select: { id: true, businessName: true } },
        },
      },
      timeSlot: true,
    },
  });
};

/**
 * Returns all bookings for a specific user, ordered newest first.
 * @param {string} userId - The user's UUID.
 * @returns {Promise<import('@prisma/client').Booking[]>}
 */
export const findBookingsByUser = async (userId) => {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      turf: { select: { id: true, name: true, city: true, image: true } },
      timeSlot: true,
    },
  });
};

/**
 * Returns all bookings for a given owner (all their turfs combined).
 * @param {string} ownerId - The OwnerProfile UUID.
 * @returns {Promise<import('@prisma/client').Booking[]>}
 */
export const findBookingsByOwner = async (ownerId) => {
  return prisma.booking.findMany({
    where: {
      turf: { ownerId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      turf: { select: { id: true, name: true } },
      timeSlot: true,
    },
  });
};

/**
 * Computes the refund amount for a cancellation based on the 30% policy.
 * Only applies when the booking was paid and is in CONFIRMED status.
 * @param {object} booking - The full booking record from Prisma.
 * @returns {number} Refund amount in INR.
 */
export const calculateCancellationRefund = (booking) => {
  if (
    booking.status !== BOOKING_STATUS.CONFIRMED ||
    booking.paymentStatus !== "SUCCESS"
  ) {
    return 0;
  }
  return parseFloat((booking.paidAmount * 0.3).toFixed(2));
};

// --- ENTERPRISE-GRADE SERVICE METHODS EXTRACTED ---

/**
 * Initializes a Razorpay booking order for a customer.
 * @param {string} userId - ID of the booking user.
 * @param {number} totalPrice - Total price for the booking in INR.
 * @returns {Promise<{ order: any, user: any }>}
 */
export const createRazorpayOrder = async (userId, totalPrice) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true }
  });

  if (!user) {
    const error = new Error("Account not found. Please ensure you are logged in correctly.");
    error.statusCode = 404;
    throw error;
  }

  const options = {
    amount: Math.round(totalPrice * 100),
    currency: "INR",
    receipt: `receipt${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);
  return { order, user };
};

/**
 * Verifies Razorpay payment signature and completes booking process.
 * @param {string} userId - The user ID.
 * @param {object} paymentData - Body parameters from payment verification.
 * @returns {Promise<object>} The confirmed booking record.
 */
export const verifyBookingPayment = async (userId, paymentData) => {
  const {
    turfId: bodyTurfId,
    id,
    startTime,
    endTime,
    selectedTurfDate,
    totalPrice,
    advanceAmount,
    balanceAmount,
    paymentType,
    paymentId,
    orderId,
    razorpay_signature,
    paymentMethod = "ONLINE"
  } = paymentData;

  const turfId = bodyTurfId || id;
  const formattedStartTime = format(parseISO(startTime), "hh:mm a");
  const formattedEndTime = format(parseISO(endTime), "hh:mm a");
  const formattedDate = format(parseISO(selectedTurfDate), "d MMM yyyy");

  // Verify Signature
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${orderId}|${paymentId}`);
  const generatedSignature = hmac.digest("hex");
  if (generatedSignature !== razorpay_signature) {
    const error = new Error("Payment Verification Failed");
    error.statusCode = 400;
    throw error;
  }

  const adjustedStartTime = adjustTime(startTime, selectedTurfDate);
  const adjustedEndTime = adjustTime(endTime, selectedTurfDate);

  const [user, turf, settingsDoc] = await Promise.all([
    prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, walletBalance: true }
    }),
    prisma.turf.findUnique({ 
      where: { id: turfId },
      include: { 
        owner: { 
          include: { user: { select: { email: true, name: true } } } 
        } 
      }
    }),
    prisma.systemSetting.findUnique({ where: { key: "PAYOUT_CONFIG" } })
  ]);

  if (!user || !turf || !turf.owner) {
    const error = new Error(!turf ? "Turf not found" : !turf.owner ? "Turf owner not found. Please contact support." : "Account not found");
    error.statusCode = 404;
    throw error;
  }

  const settings = settingsDoc?.value || {};
  const gstPercentage = typeof settings.gstPercentage !== 'undefined' ? Number(settings.gstPercentage) : 0;
  const platformFeePercentage = typeof settings.platformFeePercentage !== 'undefined' ? Number(settings.platformFeePercentage) : 5;

  // Configuration Expiry Guard
  const startOfSelectedDate = new Date(selectedTurfDate);
  startOfSelectedDate.setHours(0, 0, 0, 0);

  if (turf.slotsConfigDuration === "Fixed Weeks" && turf.slotsConfigExpiry && startOfSelectedDate > turf.slotsConfigExpiry) {
    const error = new Error("This slot is no longer available as the venue configuration has expired.");
    error.statusCode = 400;
    throw error;
  }

  const gstAmountCalc = Math.round(totalPrice * (gstPercentage / (100 + gstPercentage)));
  const baseAmount = totalPrice - gstAmountCalc;
  const platformFee = Math.round(baseAmount * (platformFeePercentage / 100));
  const ownerRevenue = baseAmount - platformFee;

  // Overlap Guard
  const overlappingSlot = await prisma.timeSlot.findFirst({
    where: {
      turfId: turfId,
      OR: [
        { startTime: { lt: adjustedEndTime, gte: adjustedStartTime } },
        { endTime: { gt: adjustedStartTime, lte: adjustedEndTime } },
        { startTime: { lte: adjustedStartTime }, endTime: { gte: adjustedEndTime } }
      ]
    }
  });

  if (overlappingSlot) {
    const error = new Error("This time slot is already booked.");
    error.statusCode = 400;
    throw error;
  }

  // Create booking transaction
  const booking = await prisma.$transaction(async (tx) => {
    const timeSlot = await tx.timeSlot.create({
      data: {
        turfId: turfId,
        startTime: adjustedStartTime,
        endTime: adjustedEndTime,
        price: totalPrice
      }
    });

    const newBooking = await tx.booking.create({
      data: {
        userId,
        turfId,
        timeSlotId: timeSlot.id,
        playStartTime: adjustedStartTime,
        playEndTime: adjustedEndTime,
        totalPrice,
        paidAmount: advanceAmount || totalPrice,
        balanceAmount: balanceAmount || 0,
        advanceAmount: advanceAmount || 0,
        paymentType: paymentType || "FULL",
        paymentMethod,
        orderId,
        paymentId,
        paymentSignature: razorpay_signature,
        paymentStatus: 'SUCCESS',
        status: BOOKING_STATUS.CONFIRMED,
        revenueStatus: "PENDING",
        platformFee,
        gstAmount: gstAmountCalc,
        ownerRevenue
      }
    });

    const amountPaidOnline = advanceAmount || totalPrice;
    await tx.ownerProfile.update({
      where: { id: turf.owner.id },
      data: { pendingBalance: { increment: amountPaidOnline } }
    });

    return newBooking;
  });

  // Track Metrics
  bookingCreatedTotal.inc();
  paymentTotal.inc({ status: "success" });

  const QRcode = await generateQRCode(`${process.env.USER_URL || 'https://kridaz.com'}/booking-pass/${booking.id}`);
  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { qrCode: QRcode }
  });

  // Notify Owner
  NotificationService.sendInApp({
    recipientId: turf.owner.userId,
    recipientModel: 'User',
    title: "New Booking Received",
    message: `A new booking has been confirmed for ${turf.name} on ${formattedDate}.`,
    type: "BOOKING",
    link: "/venue-owner/bookings"
  });

  // Generate & send invoice
  generateInvoice(updatedBooking, turf, user).then(pdfBuffer => {
    const htmlContent = generateHTMLContent(
      turf.name,
      turf.city + ", " + turf.state,
      formattedDate,
      formattedStartTime,
      formattedEndTime,
      totalPrice,
      QRcode
    );

    NotificationService.sendEmail({
      to: user.email,
      subject: "Booking Confirmation & Invoice - Kridaz",
      html: htmlContent,
      attachments: [
        {
          filename: `Invoice-KRZ-${booking.id.slice(-6).toUpperCase()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
  }).catch(err => {
    logger.error("[INVOICE] Failed to generate/queue invoice:", err.message);
  });

  return updatedBooking;
};

/**
 * Handles slot booking using customer's wallet balance.
 * @param {string} userId - The user ID.
 * @param {object} bookingData - Wallet booking body params.
 * @returns {Promise<object>} The confirmed booking details.
 */
export const processWalletBooking = async (userId, bookingData) => {
  const {
    turfId: bodyTurfId,
    id,
    startTime,
    endTime,
    selectedTurfDate,
    totalPrice: originalPrice,
    couponCode,
    balanceAmount: bodyBalanceAmount,
    paymentType: bodyPaymentType,
  } = bookingData;

  const turfId = bodyTurfId || id;
  const formattedStartTime = format(parseISO(startTime), "hh:mm a");
  const formattedEndTime = format(parseISO(endTime), "hh:mm a");
  const formattedDate = format(parseISO(selectedTurfDate), "d MMM yyyy");

  const adjustedStartTime = adjustTime(startTime, selectedTurfDate);
  const adjustedEndTime = adjustTime(endTime, selectedTurfDate);

  const [user, turf, settingsDoc] = await Promise.all([
    prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, walletBalance: true }
    }),
    prisma.turf.findUnique({ 
      where: { id: turfId },
      include: { 
        owner: { 
          include: { user: { select: { email: true, name: true } } } 
        } 
      }
    }),
    prisma.systemSetting.findUnique({ where: { key: "PAYOUT_CONFIG" } })
  ]);

  if (!user || !turf || !turf.owner) {
    const error = new Error(!turf ? "Turf not found" : !turf.owner ? "Turf owner not found" : "Account not found");
    error.statusCode = 404;
    throw error;
  }

  const settings = settingsDoc?.value || {};
  const gstPercentage = Number(settings.gstPercentage || 0);
  const platformFeePercentage = Number(settings.platformFeePercentage || 5);
  
  const finalPrice = originalPrice;
  const gstAmountCalc = Math.round(finalPrice * (gstPercentage / (100 + gstPercentage)));
  const baseAmount = finalPrice - gstAmountCalc;
  const platformFee = Math.round(baseAmount * (platformFeePercentage / 100));
  const ownerRevenue = baseAmount - platformFee;
  const amountToDeduct = finalPrice;

  if (user.walletBalance < amountToDeduct) {
    const error = new Error("Insufficient wallet balance");
    error.statusCode = 400;
    throw error;
  }

  // Overlap Guard
  const overlappingSlot = await prisma.timeSlot.findFirst({
    where: {
      turfId: turfId,
      OR: [
        { startTime: { lt: adjustedEndTime, gte: adjustedStartTime } },
        { endTime: { gt: adjustedStartTime, lte: adjustedEndTime } },
        { startTime: { lte: adjustedStartTime }, endTime: { gte: adjustedEndTime } }
      ]
    }
  });

  if (overlappingSlot) {
    const error = new Error("This time slot is already booked.");
    error.statusCode = 400;
    throw error;
  }

  const booking = await prisma.$transaction(async (tx) => {
    // Deduct from wallet
    await tx.user.update({
      where: { id: userId },
      data: { 
        walletBalance: { decrement: amountToDeduct },
        bookingCount: { increment: 1 }
      }
    });

    // Create TimeSlot
    const timeSlot = await tx.timeSlot.create({
      data: {
        turfId: turfId,
        startTime: adjustedStartTime,
        endTime: adjustedEndTime,
        price: finalPrice
      }
    });

    // Create Booking
    const newBooking = await tx.booking.create({
      data: {
        userId,
        turfId,
        timeSlotId: timeSlot.id,
        playStartTime: adjustedStartTime,
        playEndTime: adjustedEndTime,
        totalPrice: finalPrice,
        paidAmount: amountToDeduct,
        balanceAmount: bodyBalanceAmount ?? (finalPrice - amountToDeduct),
        advanceAmount: amountToDeduct,
        paymentType: bodyPaymentType ?? (amountToDeduct < finalPrice ? "PARTIAL" : "FULL"),
        paymentMethod: "WALLET",
        orderId: "WALLET",
        paymentId: `WAL_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        paymentStatus: 'SUCCESS',
        status: BOOKING_STATUS.CONFIRMED,
        revenueStatus: "PENDING",
        platformFee,
        gstAmount: gstAmountCalc,
        ownerRevenue
      }
    });

    // Update Owner pending balance
    await tx.ownerProfile.update({
      where: { id: turf.owner.id },
      data: { pendingBalance: { increment: amountToDeduct } }
    });

    // Update Coupon usage
    if (couponCode) {
      const appliedCoupon = await tx.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), isActive: true }
      });
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { timesUsed: { increment: 1 } }
        });
      }
    }

    // Create Wallet transaction
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: amountToDeduct,
        type: "DEBIT",
        status: "SUCCESS",
        description: `Booking at ${turf.name}`,
        bookingId: newBooking.id
      }
    });

    // Handle Cashback logic
    const cashbackPercentage = settings.cashbackPercentage || 5;
    const cashbackAmount = Math.round(finalPrice * (cashbackPercentage / 100));
    if (cashbackAmount > 0) {
      if (user) {
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: cashbackAmount } }
        });
      } else {
        await tx.ownerProfile.update({
          where: { userId: userId },
          data: { walletBalance: { increment: cashbackAmount } }
        });
      }

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: cashbackAmount,
          type: "OFFER",
          status: "SUCCESS",
          description: `${cashbackPercentage}% Cashback for booking #${newBooking.id.slice(-6).toUpperCase()}`,
          bookingId: newBooking.id
        }
      });
    }

    return newBooking;
  });

  // Track Metrics
  bookingCreatedTotal.inc();
  paymentTotal.inc({ status: "success" });

  const QRcode = await generateQRCode(`${process.env.USER_URL || 'https://kridaz.com'}/booking-pass/${booking.id}`);
  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { qrCode: QRcode }
  });

  // Notify Owner
  NotificationService.sendInApp({
    recipientId: turf.owner.userId,
    recipientModel: 'User',
    title: "New Wallet Booking",
    message: `A new booking has been confirmed for ${turf.name} via Wallet on ${formattedDate}.`,
    type: "BOOKING",
    link: "/venue-owner/bookings"
  });

  return updatedBooking;
};

/**
 * Gets detailed booking by ID with full includes.
 * @param {string} id - Booking ID.
 * @returns {Promise<object|null>}
 */
export const findBookingDetailsById = async (id) => {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      timeSlot: true,
      turf: {
        include: {
          owner: {
            include: { user: true }
          }
        }
      },
      user: { select: { id: true, name: true, profilePicture: true, email: true, phone: true } }
    }
  });
};

/**
 * Gets all bookings made by a user (detailed view).
 * @param {string} userId - User ID.
 * @returns {Promise<Array>}
 */
export const findBookingsByUserDetailed = async (userId) => {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      timeSlot: true,
      turf: true
    }
  });
};

/**
 * Fetches all bookings belonging to turfs of a specific owner, shaped for the client dashboard.
 * @param {string} ownerUserId - Owner's user ID.
 * @returns {Promise<Array>}
 */
export const findBookingsByOwnerDetailed = async (ownerUserId) => {
  const ownedTurfs = await prisma.turf.findMany({
    where: {
      owner: {
        userId: ownerUserId
      }
    },
    select: { id: true }
  });

  if (ownedTurfs.length === 0) {
    return [];
  }

  const turfIds = ownedTurfs.map((turf) => turf.id);

  const bookings = await prisma.booking.findMany({
    where: {
      turfId: { in: turfIds }
    },
    include: {
      user: { select: { id: true, name: true, profilePicture: true, email: true, phone: true } },
      turf: true,
      timeSlot: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return bookings.map(b => ({
    id: b.id,
    turfName: b.turf?.name,
    userName: b.user?.name || b.guestName || "Partner/Other",
    bookingSource: b.bookingSource,
    totalPrice: b.totalPrice,
    bookingDate: b.createdAt,
    startTime: b.timeSlot?.startTime,
    endTime: b.timeSlot?.endTime,
    duration: b.timeSlot ? (new Date(b.timeSlot.endTime) - new Date(b.timeSlot.startTime)) / (1000 * 60 * 60) : 1
  }));
};

/**
 * Validates a discount coupon and determines eligible discounts.
 * @param {string} code - The coupon code string.
 * @param {string} turfId - Turf ID code is applied to.
 * @param {number} amount - Ground cost value.
 * @returns {Promise<object>} Computed values.
 */
export const verifyCoupon = async (code, turfId, amount) => {
  const coupon = await prisma.coupon.findFirst({
    where: { 
      code: code.toUpperCase(), 
      isActive: true 
    }
  });
  
  if (!coupon) {
    const error = new Error("Invalid or inactive coupon code");
    error.statusCode = 404;
    throw error;
  }

  if (new Date() > new Date(coupon.validUntil)) {
    const error = new Error("This coupon has expired");
    error.statusCode = 400;
    throw error;
  }

  if (coupon.turfId && coupon.turfId !== turfId) {
    const error = new Error("This coupon is not valid for this ground");
    error.statusCode = 400;
    throw error;
  }

  if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
    const error = new Error("This coupon's usage limit has been reached");
    error.statusCode = 400;
    throw error;
  }

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = amount * (coupon.discountValue / 100);
  } else {
    discount = coupon.discountValue;
  }

  const finalAmount = Math.max(0, amount - discount);

  return {
    discount,
    finalAmount,
  };
};

/**
 * Inserts a manual, off-platform booking record created by the turf owner.
 * @param {string} ownerId - Turf owner's user ID.
 * @param {object} manualData - Manual booking form parameters.
 * @returns {Promise<object>} Confirmed manual booking record.
 */
export const processManualBooking = async (ownerId, manualData) => {
  const {
    turfId,
    startTime,
    endTime,
    selectedTurfDate,
    totalPrice,
    paymentMethod,
    customerName,
    customerEmail,
    customerPhone
  } = manualData;

  const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
  const parseTime = (timeStr) => {
    if (!timeStr) return new Date();
    if (timeStr.includes("T")) return parseISO(timeStr);
    return parse(timeStr, "hh:mm a", new Date());
  };

  const turfDate = parseISO(selectedTurfDate);
  const startTimeDate = parseTime(startTime);
  const endTimeDate = parseTime(endTime);

  const combineDateAndTime = (dateObj, timeObj) => {
    return new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      timeObj.getHours(),
      timeObj.getMinutes()
    );
  };

  const adjustedStartTime = fromZonedTime(combineDateAndTime(turfDate, startTimeDate), timeZone);
  const adjustedEndTime = fromZonedTime(combineDateAndTime(turfDate, endTimeDate), timeZone);

  const turf = await prisma.turf.findUnique({
    where: { id: turfId },
    include: { owner: true }
  });

  if (!turf || turf.owner.userId !== ownerId) {
    const error = new Error("Unauthorized or Turf not found");
    error.statusCode = 403;
    throw error;
  }

  // Overlap Guard
  const overlapping = await prisma.timeSlot.findFirst({
    where: {
      turfId,
      OR: [
        { startTime: { lt: adjustedEndTime, gte: adjustedStartTime } },
        { endTime: { gt: adjustedStartTime, lte: adjustedEndTime } },
        { startTime: { lte: adjustedStartTime }, endTime: { gte: adjustedEndTime } }
      ]
    }
  });

  if (overlapping) {
    const error = new Error("Slot already booked");
    error.statusCode = 400;
    throw error;
  }

  const booking = await prisma.$transaction(async (tx) => {
    const timeSlot = await tx.timeSlot.create({
      data: {
        turfId,
        startTime: adjustedStartTime,
        endTime: adjustedEndTime,
      }
    });

    return await tx.booking.create({
      data: {
        userId: ownerId,
        turfId,
        timeSlotId: timeSlot.id,
        playStartTime: adjustedStartTime,
        playEndTime: adjustedEndTime,
        totalPrice,
        paidAmount: totalPrice,
        balanceAmount: 0,
        paymentMethod: paymentMethod || "CASH",
        status: "CONFIRMED",
        bookingSource: "PARTNER_MANUAL",
        guestName: customerName,
        guestEmail: customerEmail,
        guestPhone: customerPhone
      }
    });
  });

  const qrUrl = `${process.env.USER_URL || "https://kridaz.com"}/booking-pass/${booking.id}`;
  const QRcode = await generateQRCode(qrUrl);
  
  return await prisma.booking.update({
    where: { id: booking.id },
    data: { qrCode: QRcode }
  });
};

/**
 * Processes cancellation rules and executes refund transaction.
 * @param {string} userId - ID of the user requesting cancellation.
 * @param {string} bookingId - Booking ID to cancel.
 * @returns {Promise<{ booking: object, refundAmount: number }>}
 */
export const processBookingCancellation = async (userId, bookingId) => {
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { turf: { include: { owner: true } }, timeSlot: true }
    });

    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    if (booking.userId !== userId) {
      const error = new Error("Unauthorized");
      error.statusCode = 403;
      throw error;
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "PLAYING") {
      const error = new Error("This booking cannot be cancelled at this stage.");
      error.statusCode = 400;
      throw error;
    }

    const playStartTime = new Date(booking.playStartTime);
    const hoursRemaining = (playStartTime - now) / (1000 * 60 * 60);

    if (hoursRemaining < 72) {
      const error = new Error("Cancellations are only allowed at least 72 hours before the slot time.");
      error.statusCode = 400;
      throw error;
    }

    const refundAmount = Math.round(booking.paidAmount * 0.3);

    // 1. Update Booking
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        revenueStatus: refundAmount > 0 ? "REFUNDED" : undefined
      }
    });

    // 2. Refund to User Wallet
    if (refundAmount > 0) {
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: refundAmount } }
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: refundAmount,
          type: "REFUND",
          status: "SUCCESS",
          description: `30% refund for cancelled booking #${bookingId.slice(-6).toUpperCase()}`,
          bookingId: bookingId
        }
      });
    }

    // 3. Update Owner Balance
    const amountToDeduct = booking.paidAmount || booking.totalPrice;
    if (booking.turf?.owner) {
      await tx.ownerProfile.update({
        where: { id: booking.turf.owner.id },
        data: { pendingBalance: { decrement: amountToDeduct } }
      });
    }

    // 4. Delete TimeSlot
    if (booking.timeSlotId) {
      await tx.timeSlot.delete({ where: { id: booking.timeSlotId } });
    }

    // Trigger Notification
    NotificationService.sendInApp({
      recipientId: userId,
      recipientModel: 'User',
      title: "Booking Cancelled",
      message: refundAmount > 0 
        ? `Your booking has been cancelled. 30% refund (₹${refundAmount}) credited to wallet.` 
        : `Your booking has been cancelled. No refund issued as per policy.`,
      type: "BOOKING",
      link: "/profile/bookings"
    });

    return { booking: updatedBooking, refundAmount };
  });
};

/**
 * Returns a paginated list of bookings based on optional filters for Admin.
 * @param {object} filters - Paginated filter parameters.
 * @returns {Promise<object>} List of bookings and total matches.
 */
export const findAdminBookings = async (filters) => {
  const {
    status,
    page = 1,
    limit = 20,
    turfId,
    userId,
    startDate,
    endDate,
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (turfId) where.turfId = turfId;
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        turf: { select: { id: true, name: true, city: true, state: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total };
};

