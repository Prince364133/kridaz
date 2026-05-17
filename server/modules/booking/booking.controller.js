import { prisma } from "../../config/prisma.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import generateQRCode from "../../utils/generateQRCode.js";
import adjustTime from "../../utils/adjustTime.js";
import { generateHTMLContent } from "../../utils/generateEmail.js";
import { generateInvoice } from "../../utils/generateInvoice.js";
import NotificationService from "../../services/notification.service.js";
import { format, parseISO } from "date-fns";
import logger from "../../utils/logger.js";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@kridaz/shared-constants/bookingStatus";
import { bookingCreatedTotal, paymentTotal } from "../../utils/metrics.js";


// --- USER OPERATIONS ---

export const createOrder = async (req, res) => {
  const userId = req.user.id || req.user.user;
  try {
    const { totalPrice } = req.body;
    
    // Check User model in Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true }
    });

    if (!user) {
      return res.status(404).json({ message: "Account not found. Please ensure you are logged in correctly." });
    }

    const options = {
      amount: Math.round(totalPrice * 100),
      currency: "INR",
      receipt: `receipt${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return res.status(200).json({ order, user });
  } catch (error) {
    logger.error("Error in createOrder:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  const userId = req.user.id;
  const {
    id,
    turfId: bodyTurfId,
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
  } = req.body;
  const turfId = bodyTurfId || id;

  try {
    const formattedStartTime = format(parseISO(startTime), "hh:mm a");
    const formattedEndTime = format(parseISO(endTime), "hh:mm a");
    const formattedDate = format(parseISO(selectedTurfDate), "d MMM yyyy");

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest("hex");
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment Verification Failed" });
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
      return res.status(404).json({ 
        success: false, 
        message: !turf ? "Turf not found" : !turf.owner ? "Turf owner not found. Please contact support." : "Account not found" 
      });
    }

    const settings = settingsDoc?.value || {};
    const gstPercentage = typeof settings.gstPercentage !== 'undefined' ? Number(settings.gstPercentage) : 0;
    const platformFeePercentage = typeof settings.platformFeePercentage !== 'undefined' ? Number(settings.platformFeePercentage) : 5;

    // Check if the SELECTED DATE is beyond the configuration expiry
    const startOfSelectedDate = new Date(selectedTurfDate);
    startOfSelectedDate.setHours(0, 0, 0, 0);

    if (turf.slotsConfigDuration === "Fixed Weeks" && turf.slotsConfigExpiry && startOfSelectedDate > turf.slotsConfigExpiry) {
      return res.status(400).json({ success: false, message: "This slot is no longer available as the venue configuration has expired." });
    }

    const gstAmountCalc = Math.round(totalPrice * (gstPercentage / (100 + gstPercentage)));
    const baseAmount = totalPrice - gstAmountCalc;
    const platformFee = Math.round(baseAmount * (platformFeePercentage / 100));
    const ownerRevenue = baseAmount - platformFee;

    // Check for overlapping bookings in Prisma
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
      return res.status(400).json({ success: false, message: "This time slot is already booked." });
    }

    // Execute booking creation and balance update in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create TimeSlot
      const timeSlot = await tx.timeSlot.create({
        data: {
          turfId: turfId,
          startTime: adjustedStartTime,
          endTime: adjustedEndTime,
          price: totalPrice
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

      // Update Owner's pending balance
      const amountPaidOnline = advanceAmount || totalPrice;
      await tx.ownerProfile.update({
        where: { id: turf.owner.id },
        data: { pendingBalance: { increment: amountPaidOnline } }
      });

      return newBooking;
    });

    // Metric: Booking created
    bookingCreatedTotal.inc();
    paymentTotal.inc({ status: "success" });

    const QRcode = await generateQRCode(`${process.env.USER_URL || 'https://kridaz.com'}/booking-pass/${booking.id}`);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { qrCode: QRcode }
    });

    // Notify Owner (Queued)
    NotificationService.sendInApp({
      recipientId: turf.owner.userId,
      recipientModel: 'User',
      title: "New Booking Received",
      message: `A new booking has been confirmed for ${turf.name} on ${formattedDate}.`,
      type: "BOOKING",
      link: "/partner/bookings"
    });

    // Generate and Send Invoice (Queued via NotificationService)
    generateInvoice(booking, turf, user).then(pdfBuffer => {
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

    return res.status(200).json({
      success: true,
      message: "Booking successful, Check your email for the receipt",
      bookingId: booking.id,
    });
  } catch (error) {
    logger.error("Error in verifyPayment", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your booking: " + error.message,
    });
  }
};

export const bookWithWallet = async (req, res) => {
  const userId = req.user.id;
  const { id, turfId: bodyTurfId, startTime, endTime, selectedTurfDate, totalPrice: originalPrice, couponCode } = req.body;
  const turfId = bodyTurfId || id;

  try {
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
      return res.status(404).json({ 
        success: false, 
        message: !turf ? "Turf not found" : !turf.owner ? "Turf owner not found" : "Account not found" 
      });
    }

    const settings = settingsDoc?.value || {};
    const gstPercentage = Number(settings.gstPercentage || 0);
    const platformFeePercentage = Number(settings.platformFeePercentage || 5);
    
    // Simple price calculation for now (matching verifyPayment logic)
    const finalPrice = originalPrice;
    const gstAmountCalc = Math.round(finalPrice * (gstPercentage / (100 + gstPercentage)));
    const baseAmount = finalPrice - gstAmountCalc;
    const platformFee = Math.round(baseAmount * (platformFeePercentage / 100));
    const ownerRevenue = baseAmount - platformFee;
    const amountToDeduct = finalPrice;

    if (user.walletBalance < amountToDeduct) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // Check for overlapping bookings
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
      return res.status(400).json({ success: false, message: "This time slot is already booked." });
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
          balanceAmount: balanceAmount || (finalPrice - amountToDeduct),
          advanceAmount: amountToDeduct,
          paymentType: paymentType || (amountToDeduct < finalPrice ? "PARTIAL" : "FULL"),
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

      // Update Owner's pending balance
      await tx.ownerProfile.update({
        where: { id: turf.owner.id },
        data: { pendingBalance: { increment: amountToDeduct } }
      });

      // Update Coupon Usage
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { timesUsed: { increment: 1 } }
        });
      }

      // Create Wallet Transaction
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

      // Handle Cashback
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

    // Metric: Booking created
    bookingCreatedTotal.inc();
    paymentTotal.inc({ status: "success" });

    const QRcode = await generateQRCode(`${process.env.USER_URL || 'https://kridaz.com'}/booking-pass/${booking.id}`);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { qrCode: QRcode }
    });

    // Notify Owner (Queued)
    NotificationService.sendInApp({
      recipientId: turf.owner.userId,
      recipientModel: 'User',
      title: "New Wallet Booking",
      message: `A new booking has been confirmed for ${turf.name} via Wallet on ${formattedDate}.`,
      type: "BOOKING",
      link: "/partner/bookings"
    });

    return res.status(200).json({
      success: true,
      message: "Booking successful with Wallet",
      bookingId: booking.id
    });
  } catch (error) {
    logger.error("Error in bookWithWallet", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred: " + error.message,
    });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({
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

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json(booking);
  } catch (error) {
    logger.error("Error in getBookingById:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  const userId = req.user.id;
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        timeSlot: true,
        turf: true
      }
    });
    return res.status(200).json(bookings);
  } catch (error) {
    logger.error("Error in getUserBookings:", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- OWNER OPERATIONS ---

export const getOwnerBookings = async (req, res) => {
  try {
    const userId = req.owner.id;

    // Find all turfs owned by this user (who is an owner)
    const ownedTurfs = await prisma.turf.findMany({
      where: {
        owner: {
          userId: userId
        }
      },
      select: { id: true }
    });

    if (ownedTurfs.length === 0) {
      return res.status(200).json([]);
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

    // Map to the shape expected by the frontend if needed
    const formattedBookings = bookings.map(b => ({
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

    return res.status(200).json(formattedBookings);
  } catch (error) {
    logger.error("Error in getOwnerBookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, turfId, amount } = req.body;
    if (!code || !turfId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const coupon = await prisma.coupon.findFirst({
      where: { 
        code: code.toUpperCase(), 
        isActive: true 
      }
    });
    
    if (!coupon) {
      return res.status(404).json({ message: "Invalid or inactive coupon code" });
    }

    if (new Date() > new Date(coupon.validUntil)) {
      return res.status(400).json({ message: "This coupon has expired" });
    }

    if (coupon.turfId && coupon.turfId !== turfId) {
      return res.status(400).json({ message: "This coupon is not valid for this ground" });
    }

    if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({ message: "This coupon's usage limit has been reached" });
    }

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = amount * (coupon.discountValue / 100);
    } else {
      discount = coupon.discountValue;
    }

    const finalAmount = Math.max(0, amount - discount);

    res.status(200).json({
      success: true,
      discount,
      finalAmount,
      message: "Coupon applied successfully"
    });
  } catch (error) {
    logger.error("Error validating coupon:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createManualBooking = async (req, res) => {
  const ownerId = req.owner.id;
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
  } = req.body;

  try {
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
    const parseTime = (timeStr) => {
      if (!timeStr) return new Date();
      if (timeStr.includes("T")) return parseISO(timeStr);
      return parse(timeStr, "hh:mm a", new Date());
    };

    const turfDate = parseISO(selectedTurfDate);
    const startTimeDate = parseTime(startTime);
    const endTimeDate = parseTime(endTime);

    const formattedStartTime = format(startTimeDate, "hh:mm a");
    const formattedEndTime = format(endTimeDate, "hh:mm a");
    const formattedDate = format(turfDate, "d MMM yyyy");

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
      return res.status(403).json({ success: false, message: "Unauthorized or Turf not found" });
    }

    // Check overlaps
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
      return res.status(400).json({ success: false, message: "Slot already booked" });
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
          turfId,
          timeSlotId: timeSlot.id,
          startTime: adjustedStartTime,
          endTime: adjustedEndTime,
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
    
    await prisma.booking.update({
      where: { id: booking.id },
      data: { qrCode: QRcode }
    });

    return res.status(200).json({
      success: true,
      message: "Manual booking created successfully",
      bookingId: booking.id
    });

  } catch (error) {
    logger.error("Error in createManualBooking", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        timeSlot: true,
        turf: { include: { owner: true } }
      }
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const customerInfo = booking.user || {
      name: booking.guestName || "Guest Customer",
      email: booking.guestEmail || "N/A",
      phone: booking.guestPhone || "N/A"
    };

    const invoiceBooking = {
      ...booking,
      selectedTurfDate: format(new Date(booking.timeSlot?.startTime || booking.createdAt), "d MMM yyyy"),
      startTime: format(new Date(booking.timeSlot?.startTime || booking.createdAt), "hh:mm a"),
      endTime: format(new Date(booking.timeSlot?.endTime || booking.createdAt), "hh:mm a"),
      duration: booking.timeSlot ? Math.ceil((new Date(booking.timeSlot.endTime) - new Date(booking.timeSlot.startTime)) / (1000 * 60 * 60)) : 1
    };

    const pdfBuffer = await generateInvoice(invoiceBooking, booking.turf, customerInfo);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice-${id.slice(-6).toUpperCase()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error("Error generating invoice:", error);
    res.status(500).json({ success: false, message: "Error generating invoice: " + error.message });
  }
};

export const cancelBooking = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { id } = req.params;
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { turf: { include: { owner: true } }, timeSlot: true }
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.userId !== userId) {
        throw new Error("Unauthorized");
      }

      if (booking.status !== "CONFIRMED" && booking.status !== "PLAYING") {
        throw new Error("This booking cannot be cancelled at this stage.");
      }

      const playStartTime = new Date(booking.startTime);
      const hoursRemaining = (playStartTime - now) / (1000 * 60 * 60);

      if (hoursRemaining < 72) {
        throw new Error("Cancellations are only allowed at least 72 hours before the slot time.");
      }

      const refundAmount = Math.round(booking.totalPrice * 0.3);

      // 1. Update Booking
      const updatedBooking = await tx.booking.update({
        where: { id },
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
            description: `30% refund for cancelled booking #${id.slice(-6).toUpperCase()}`,
            bookingId: id
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

      return { booking: updatedBooking, refundAmount };
    });

    const { booking, refundAmount } = result;
    
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

    return res.status(200).json({ 
      success: true, 
      message: `Booking cancelled. Refund of ₹${refundAmount} issued.`, 
      refundAmount 
    });

  } catch (error) {
    logger.error("Error in cancelBooking:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// --- ADMIN OPERATIONS ---

/**
 * Platform-wide booking view for admin oversight and reporting.
 * Supports filtering by status, turfId, userId, and date range.
 */
export const getAdminAllBookings = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      turfId,
      userId,
      startDate,
      endDate,
    } = req.query;

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

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("Error in getAdminAllBookings:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

