import mongoose from "mongoose";
import SystemSetting from "../../models/systemSetting.model.js";
import Booking from "../../models/booking.model.js";
import WalletTransaction from "../../models/walletTransaction.model.js";
import Turf from "../../models/turf.model.js";
import TimeSlot from "../../models/timeSlot.model.js";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import Coupon from "../../models/coupon.model.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import generateQRCode from "../../utils/generateQRCode.js";
import adjustTime from "../../utils/adjustTime.js";
import generateEmail, { generateHTMLContent } from "../../utils/generateEmail.js";
import { generateInvoice } from "../../utils/invoiceGenerator.js";
import { createNotification } from "../../utils/notificationHelper.js";
import { format, parseISO, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { runInTransaction } from "../../utils/transaction.js";

// --- USER OPERATIONS ---

export const createOrder = async (req, res) => {
  const userId = req.user.id || req.user.user;
  try {
    const { totalPrice } = req.body;
    
    // Check User collection first, then Owner collection
    let user = await User.findById(userId).select("name email");
    if (!user) {
      user = await Owner.findById(userId).select("name email");
    }

    if (!user) {
      return res.status(404).json({ message: "Account not found. Please ensure you are logged in correctly." });
    }

    const options = {
      amount: totalPrice * 100,
      currency: "INR",
      receipt: `receipt${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return res.status(200).json({ order, user });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  const userId = req.user.id || req.user.user;
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

    const [userResult, turf, settingsDoc] = await Promise.all([
      User.findById(userId).then(u => u || Owner.findById(userId)),
      Turf.findById(turfId).populate("owner", "email name"),
      SystemSetting.findOne({ key: "PAYOUT_CONFIG" })
    ]);

    const user = userResult;
    
    // Defensive check: If turf owner population failed (e.g. owner is in User collection instead of Owner collection)
    if (turf && !turf.owner) {
      const rawTurf = await Turf.findById(turfId).select("owner");
      if (rawTurf && rawTurf.owner) {
        turf.owner = await User.findById(rawTurf.owner).select("email name");
      }
    }

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

    // Check for overlapping bookings
    const overlappingSlot = await TimeSlot.findOne({
      turf: turfId,
      $or: [
        { startTime: { $lt: adjustedEndTime, $gte: adjustedStartTime } },
        { endTime: { $gt: adjustedStartTime, $lte: adjustedEndTime } },
        { startTime: { $lte: adjustedStartTime }, endTime: { $gte: adjustedEndTime } }
      ]
    });

    if (overlappingSlot) {
      return res.status(400).json({ success: false, message: "This time slot is already booked." });
    }

    const bookingId = new mongoose.Types.ObjectId();
    const frontendUrl = process.env.CLIENT_URLS?.split(",")[1] || "http://localhost:5174";
    const qrUrl = `${frontendUrl}/booking-pass/${bookingId}`;

    const QRcode = await generateQRCode(qrUrl);

    const timeSlot = await TimeSlot.create({
      turf: turfId,
      startTime: adjustedStartTime,
      endTime: adjustedEndTime,
    });

    const booking = await Booking.create({
      _id: bookingId,
      user: userId,
      turf: turfId,
      timeSlot: timeSlot._id,
      playStartTime: adjustedStartTime,
      playEndTime: adjustedEndTime,
      totalPrice,
      advanceAmount: advanceAmount || totalPrice,
      balanceAmount: balanceAmount || 0,
      paymentType: paymentType || "FULL",
      qrCode: QRcode,
      payment: { orderId, paymentId },
      paymentMethod: req.body.paymentMethod || "ONLINE",
      revenueStatus: "PENDING",
      platformFee,
      gstAmount: gstAmountCalc,
      ownerRevenue
    });

    // Update Owner's pending balance (only the amount PAID online goes to pending)
    const amountPaidOnline = advanceAmount || totalPrice;
    
    // Robust owner lookup for balance update
    const targetOwner = await Owner.findOne({ 
      $or: [{ _id: turf.owner._id }, { userId: turf.owner._id }] 
    });

    if (targetOwner) {
      await Owner.findByIdAndUpdate(targetOwner._id, { $inc: { pendingBalance: amountPaidOnline } });
    } else {
      console.warn(`WARNING: Could not find owner record to update balance for turf: ${turf._id}`);
    }

    // If it's a regular user, update their bookings array
    if (user.constructor.modelName === "User") {
      await User.findByIdAndUpdate(userId, { $push: { bookings: booking._id } });
    }

    const htmlContent = generateHTMLContent(
      turf.name,
      turf.location,
      formattedDate,
      formattedStartTime,
      formattedEndTime,
      totalPrice,
      QRcode
    );

    // Notify Owner
    await createNotification({
      recipientId: turf.owner._id,
      recipientModel: 'Owner',
      title: "New Booking Received",
      message: `A new booking has been confirmed for ${turf.name} on ${formattedDate}.`,
      type: "BOOKING",
      link: "/partner/bookings"
    });

    // Generate and Send Invoice (non-blocking)
    generateInvoice(booking, turf, user).then(pdfBuffer => {
      generateEmail(
        user.email, 
        "Booking Confirmation & Invoice - Kridaz", 
        htmlContent,
        [
          {
            filename: `Invoice-KRZ-${booking._id.toString().slice(-6).toUpperCase()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      ).catch((err) => {
        console.error("[EMAIL] Failed to send ticket with invoice:", err.message);
      });
    }).catch(err => {
      console.error("[INVOICE] Failed to generate invoice:", err.message);
      generateEmail(user.email, "Booking Confirmation", htmlContent).catch(err => {
        console.error("[EMAIL] Failed to send ticket fallback:", err.message);
      });
    });

    return res.status(200).json({
      success: true,
      message: "Booking successful, Check your email for the receipt",
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("Error in verifyPayment", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your booking: " + error.message,
    });
  }
};

export const bookWithWallet = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { id, turfId: bodyTurfId, startTime, endTime, selectedTurfDate, totalPrice: originalPrice, couponCode } = req.body;
  const turfId = bodyTurfId || id;

  try {
    const formattedStartTime = format(parseISO(startTime), "hh:mm a");
    const formattedEndTime = format(parseISO(endTime), "hh:mm a");
    const formattedDate = format(parseISO(selectedTurfDate), "d MMM yyyy");

    const adjustedStartTime = adjustTime(startTime, selectedTurfDate);
    const adjustedEndTime = adjustTime(endTime, selectedTurfDate);

    const result = await runInTransaction(async ({ session }) => {
      // 1. Check user and balance
      let user = await User.findById(userId).session(session);
      if (!user) {
        user = await Owner.findById(userId).session(session);
      }
      if (!user) {
        throw new Error("User not found");
      }

      let finalPrice = originalPrice;
      let appliedCoupon = null;

      if (couponCode) {
        appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }).session(session);
        if (appliedCoupon) {
          if (new Date() > new Date(appliedCoupon.validUntil)) {
            throw new Error("Coupon has expired");
          }
          if (appliedCoupon.turfId && appliedCoupon.turfId.toString() !== turfId.toString()) {
            throw new Error("Coupon is not valid for this ground");
          }
          if (appliedCoupon.usageLimit > 0 && appliedCoupon.timesUsed >= appliedCoupon.usageLimit) {
            throw new Error("Coupon usage limit reached");
          }

          let discount = 0;
          if (appliedCoupon.discountType === "PERCENTAGE") {
            discount = originalPrice * (appliedCoupon.discountValue / 100);
          } else {
            discount = appliedCoupon.discountValue;
          }
          finalPrice = Math.max(0, originalPrice - discount);
        }
      }

      const { advanceAmount, balanceAmount, paymentType } = req.body;
      const amountToDeduct = advanceAmount || finalPrice;

      if (user.walletBalance < amountToDeduct) {
        throw new Error("Insufficient wallet balance. Please top up your wallet.");
      }

      const [turf, settingsDoc] = await Promise.all([
        Turf.findById(turfId).populate("owner", "email name").session(session),
        SystemSetting.findOne({ key: "PAYOUT_CONFIG" }).session(session)
      ]);

      if (turf && !turf.owner) {
        const rawTurf = await Turf.findById(turfId).select("owner").session(session);
        if (rawTurf && rawTurf.owner) {
          turf.owner = await User.findById(rawTurf.owner).select("email name").session(session);
        }
      }

      if (!turf || !turf.owner) {
        throw new Error(!turf ? "Turf not found" : "Turf owner not found. Please contact support.");
      }

      const settings = settingsDoc?.value || {};
      const gstPercentage = typeof settings.gstPercentage !== 'undefined' ? Number(settings.gstPercentage) : 0;
      const platformFeePercentage = typeof settings.platformFeePercentage !== 'undefined' ? Number(settings.platformFeePercentage) : 5;

      // Check if the SELECTED DATE is beyond the configuration expiry
      const startOfSelectedDate = new Date(selectedTurfDate);
      startOfSelectedDate.setHours(0, 0, 0, 0);

      if (turf.slotsConfigDuration === "Fixed Weeks" && turf.slotsConfigExpiry && startOfSelectedDate > turf.slotsConfigExpiry) {
        throw new Error("This slot is no longer available as the venue configuration has expired.");
      }

      const gstAmountCalc = Math.round(finalPrice * (gstPercentage / (100 + gstPercentage)));
      const baseAmount = finalPrice - gstAmountCalc;
      const platformFee = Math.round(baseAmount * (platformFeePercentage / 100));
      const ownerRevenue = baseAmount - platformFee;

      // 2. Check for overlapping bookings
      const overlappingSlot = await TimeSlot.findOne({
        turf: turfId,
        $or: [
          { startTime: { $lt: adjustedEndTime, $gte: adjustedStartTime } },
          { endTime: { $gt: adjustedStartTime, $lte: adjustedEndTime } },
          { startTime: { $lte: adjustedStartTime }, endTime: { $gte: adjustedEndTime } }
        ]
      }).session(session);

      if (overlappingSlot) {
        throw new Error("This time slot is already booked. Please select another time.");
      }

      // 3. Deduct balance
      user.walletBalance -= amountToDeduct;
      await user.save({ session });

      // 3. Create objects
      const bookingId = new mongoose.Types.ObjectId();
      const frontendUrl = process.env.CLIENT_URLS?.split(",")[1] || "http://localhost:5174";
      const qrUrl = `${frontendUrl}/booking-pass/${bookingId}`;

      const QRcode = await generateQRCode(qrUrl);

      const timeSlot = await TimeSlot.create(
        [
          {
            turf: turfId,
            startTime: adjustedStartTime,
            endTime: adjustedEndTime,
          },
        ],
        { session }
      );

      const booking = await Booking.create(
        [
          {
            _id: bookingId,
            user: userId,
            turf: turfId,
            timeSlot: timeSlot[0]._id,
            playStartTime: adjustedStartTime,
            playEndTime: adjustedEndTime,
            totalPrice: finalPrice,
            advanceAmount: amountToDeduct,
            balanceAmount: balanceAmount || (finalPrice - amountToDeduct),
            paymentType: paymentType || (amountToDeduct < finalPrice ? "PARTIAL" : "FULL"),
            qrCode: QRcode,
            payment: {
              orderId: "WALLET",
              paymentId: `WAL_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            },
            paymentMethod: "WALLET",
            revenueStatus: "PENDING",
            platformFee,
            gstAmount: gstAmountCalc,
            ownerRevenue
          },
        ],
        { session }
      );

      // Update Owner's pending balance (only the amount PAID online goes to pending)
      await Owner.findByIdAndUpdate(turf.owner._id, { $inc: { pendingBalance: amountToDeduct } }).session(session);

      // 4. Update user bookings array
      user.bookings.push(booking[0]._id);
      await user.save({ session });

      // 5. Calculate Dynamic Cashback
      const cashbackPercentage = settings.cashbackPercentage || 5;
      const cashbackAmount = Math.round(finalPrice * (cashbackPercentage / 100));
      if (cashbackAmount > 0) {
        user.walletBalance += cashbackAmount;
        await user.save({ session });
        
        // Create cashback transaction
        await WalletTransaction.create(
          [
            {
              user: userId,
              amount: cashbackAmount,
              type: "OFFER",
              status: "SUCCESS",
              description: `${cashbackPercentage}% Cashback for booking #${booking[0]._id.toString().slice(-6).toUpperCase()}`,
              bookingId: booking[0]._id,
            },
          ],
          { session }
        );
        
        // Update booking with cashback info
        booking[0].cashback = cashbackAmount;
        await booking[0].save({ session });
      }

      // 6. Create wallet transaction record for the debit
      await WalletTransaction.create(
        [
          {
            user: userId,
            amount: amountToDeduct,
            type: "DEBIT",
            status: "SUCCESS",
            description: `Booking at ${turf.name}`,
            bookingId: booking[0]._id,
          },
        ],
        { session }
      );

      if (appliedCoupon) {
        appliedCoupon.timesUsed += 1;
        await appliedCoupon.save({ session });
      }

      return { booking: booking[0], turf, user, finalPrice, QRcode, formattedDate, formattedStartTime, formattedEndTime };
    });

    const { booking, turf, user, finalPrice, QRcode } = result;

    // 6. Send email with Invoice (non-blocking)
    const htmlContent = generateHTMLContent(
      turf.name,
      turf.location,
      formattedDate,
      formattedStartTime,
      formattedEndTime,
      finalPrice,
      QRcode
    );

    // Notify Owner
    await createNotification({
      recipientId: turf.owner._id,
      recipientModel: 'Owner',
      title: "New Wallet Booking",
      message: `A new booking (Wallet) has been confirmed for ${turf.name} on ${formattedDate}.`,
      type: "BOOKING",
      link: "/partner/bookings"
    });

    // Generate Invoice PDF
    generateInvoice(booking, turf, user).then(pdfBuffer => {
      generateEmail(
        user.email, 
        "Booking Confirmation & Invoice - Kridaz", 
        htmlContent,
        [
          {
            filename: `Invoice-KRZ-${booking._id.toString().slice(-6).toUpperCase()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      ).catch((err) => {
        console.error("[EMAIL] Failed to send ticket with invoice:", err.message);
      });
    }).catch(err => {
      console.error("[INVOICE] Failed to generate invoice:", err.message);
      // Fallback: send email without invoice
      generateEmail(user.email, "Booking Confirmation", htmlContent).catch((err) => {
        console.error("[EMAIL] Failed to send ticket fallback:", err.message);
      });
    });

    return res.status(200).json({
      success: true,
      message: "Booking successful! Invoice sent to your email.",
      bookingId: booking._id,
      newBalance: user.walletBalance
    });
  } catch (error) {
    console.error("Error in bookWithWallet:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "An error occurred during wallet booking",
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("timeSlot", "startTime endTime")
      .populate({
        path: "turf",
        select: "name location images managerContacts mapUrl owner",
        populate: {
          path: "owner",
          select: "email name"
        }
      })
      .populate("user", "name email");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    return res.status(200).json(booking);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  const userId = req.user.id || req.user.user;
  try {
    const bookings = await Booking.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("qrCode totalPrice")
      .populate("timeSlot", "startTime endTime")
      .populate("turf", "name location");
    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// --- OWNER OPERATIONS ---

export const getOwnerBookings = async (req, res) => {
  try {
    // req.owner.ownerId = Owner document _id (from JWT), req.owner.id = User _id
    const ownerId = req.owner.ownerId || req.owner.id;
    const userId = req.owner.id;

    // Unified owner lookup: match by Owner._id or Owner.userId
    const ownerRecord = await Owner.findOne({
      $or: [{ _id: ownerId }, { userId: userId }]
    });

    if (!ownerRecord) {
      return res.status(200).json([]);
    }

    // Dual ownership lookup for turfs
    const ownedTurfs = await Turf.find({
      $or: [
        { owner: ownerRecord._id },
        { owner: ownerRecord.userId }
      ]
    }).select("_id");

    if (ownedTurfs.length === 0) {
      return res.status(200).json([]);
    }

    const turfIds = ownedTurfs.map((turf) => turf._id);

    const bookings = await Booking.aggregate([
      { $match: { turf: { $in: turfIds } } },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
      { $lookup: { from: "turves", localField: "turf", foreignField: "_id", as: "turf" } },
      { $lookup: { from: "timeslots", localField: "timeSlot", foreignField: "_id", as: "timeSlot" } },
      // preserveNullAndEmptyArrays: true so bookings with missing docs still appear
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$turf", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$timeSlot", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: "$_id",
          turfName: "$turf.name",
          // Prefer registered user name, then guest name, then fallback label
          userName: {
            $ifNull: [
              "$user.name",
              { $ifNull: ["$guestDetails.name", "Partner/Other"] }
            ]
          },
          bookingSource: 1,
          totalPrice: 1,
          bookingDate: "$createdAt",
          duration: {
            $cond: {
              if: { $and: ["$timeSlot.startTime", "$timeSlot.endTime"] },
              then: {
                $divide: [
                  { $subtract: ["$timeSlot.endTime", "$timeSlot.startTime"] },
                  1000 * 60 * 60
                ]
              },
              else: 1 // fallback 1-hour duration when timeslot is missing
            }
          },
          startTime: "$timeSlot.startTime",
          endTime: "$timeSlot.endTime",
        },
      },
      { $sort: { bookingDate: -1 } },
    ]);

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error in getOwnerBookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, turfId, amount } = req.body;
    if (!code || !turfId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!coupon) {
      return res.status(404).json({ message: "Invalid or inactive coupon code" });
    }

    if (new Date() > new Date(coupon.validUntil)) {
      return res.status(400).json({ message: "This coupon has expired" });
    }

    if (coupon.turfId && coupon.turfId.toString() !== turfId.toString()) {
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
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createManualBooking = async (req, res) => {
  const ownerId = req.owner.id;
  const userId = req.owner.id; // Fallback for integrated accounts
  const {
    turfId,
    startTime,
    endTime,
    selectedTurfDate,
    totalPrice,
    paymentMethod, // CASH or ONLINE
    customerName,
    customerEmail,
    customerPhone
  } = req.body;

  try {
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
    
    // Helper to parse time whether it's ISO or "hh:mm a"
    const parseTime = (timeStr) => {
      if (!timeStr) return new Date();
      if (timeStr.includes("T")) return parseISO(timeStr);
      // For "06:00 AM" format
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

    // Unified owner lookup
    const ownerRecord = await Owner.findOne({ 
      $or: [{ _id: ownerId }, { userId: userId }] 
    });

    if (!ownerRecord) {
      return res.status(403).json({ success: false, message: "Owner profile not found." });
    }

    const turf = await Turf.findById(turfId).populate("owner", "email name");
    
    // Defensive check: If turf owner population failed (e.g. owner is in User collection instead of Owner collection)
    if (turf && !turf.owner) {
      const rawTurf = await Turf.findById(turfId).select("owner");
      if (rawTurf && rawTurf.owner) {
        turf.owner = await User.findById(rawTurf.owner).select("email name");
      }
    }

    if (!turf || !turf.owner) {
      return res.status(404).json({ 
        success: false, 
        message: !turf ? "Turf not found" : "Turf owner not found. Please contact support." 
      });
    }

    // Security check: ensure owner owns this turf
    if (turf.owner._id.toString() !== ownerRecord._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: You do not own this ground" });
    }

    // Check for overlapping bookings
    const overlappingSlot = await TimeSlot.findOne({
      turf: turfId,
      $or: [
        { startTime: { $lt: adjustedEndTime, $gte: adjustedStartTime } },
        { endTime: { $gt: adjustedStartTime, $lte: adjustedEndTime } },
        { startTime: { $lte: adjustedStartTime }, endTime: { $gte: adjustedEndTime } }
      ]
    });

    if (overlappingSlot) {
      return res.status(400).json({ success: false, message: "This time slot is already booked." });
    }

    const bookingId = new mongoose.Types.ObjectId();
    const frontendUrl = process.env.CLIENT_URLS?.split(",")[1] || "http://localhost:5174";
    const qrUrl = `${frontendUrl}/booking-pass/${bookingId}`;
    const QRcode = await generateQRCode(qrUrl);

    const timeSlot = await TimeSlot.create({
      turf: turfId,
      startTime: adjustedStartTime,
      endTime: adjustedEndTime,
    });

    const booking = await Booking.create({
      _id: bookingId,
      turf: turfId,
      timeSlot: timeSlot._id,
      playStartTime: adjustedStartTime,
      playEndTime: adjustedEndTime,
      totalPrice,
      qrCode: QRcode,
      payment: { 
        orderId: paymentMethod === "CASH" ? "CASH_OFFLINE" : `MANUAL_${Date.now()}`, 
        paymentId: paymentMethod === "CASH" ? "CASH" : "PENDING_MANUAL" 
      },
      bookingSource: "PARTNER_MANUAL",
      paymentMethod: paymentMethod || "CASH",
      guestDetails: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      }
    });

    // Send confirmation email to guest
    const htmlContent = generateHTMLContent(
      turf.name,
      turf.location,
      formattedDate,
      formattedStartTime,
      formattedEndTime,
      totalPrice,
      QRcode
    );

    // Notify Owner (Self) - Good for record
    await createNotification({
      recipientId: turf.owner._id,
      recipientModel: 'Owner',
      title: "Manual Booking Created",
      message: `You manually added a booking for ${turf.name} on ${formattedDate}.`,
      type: "BOOKING",
      link: "/partner/bookings"
    });

    const guestUser = { name: customerName, email: customerEmail };

    generateInvoice(booking, turf, guestUser).then(pdfBuffer => {
      generateEmail(
        customerEmail, 
        "Booking Confirmation & Invoice - Kridaz", 
        htmlContent,
        [
          {
            filename: `Invoice-KRZ-${booking._id.toString().slice(-6).toUpperCase()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      ).catch((err) => console.error("[MANUAL_EMAIL] Failed to send invoice:", err.message));
    }).catch(err => {
      console.error("[MANUAL_INVOICE] Failed:", err.message);
      generateEmail(customerEmail, "Booking Confirmation", htmlContent).catch(err => {
        console.error("[MANUAL_EMAIL] Fallback failed:", err.message);
      });
    });

    return res.status(200).json({
      success: true,
      message: "Manual booking created successfully. Invoice sent to customer.",
      bookingId: booking._id,
    });

  } catch (error) {
    console.error("Error in createManualBooking", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};
export const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("user").populate("timeSlot");
    
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const turf = await Turf.findById(booking.turf).populate("owner");
    
    // Determine the customer info
    const customerInfo = booking.user || {
      name: booking.guestDetails?.name || "Guest Customer",
      email: booking.guestDetails?.email || "N/A",
      phone: booking.guestDetails?.phone || "N/A"
    };
    if (!turf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }

    // Pass necessary fields for the invoice generator if they are missing in the simple find
    const invoiceBooking = {
      ...booking._doc,
      selectedTurfDate: format(new Date(booking.timeSlot?.startTime || booking.createdAt), "d MMM yyyy"),
      startTime: format(new Date(booking.timeSlot?.startTime || booking.createdAt), "hh:mm a"),
      endTime: format(new Date(booking.timeSlot?.endTime || booking.createdAt), "hh:mm a"),
      duration: booking.timeSlot ? Math.ceil((new Date(booking.timeSlot.endTime) - new Date(booking.timeSlot.startTime)) / (1000 * 60 * 60)) : 1
    };

    const pdfBuffer = await generateInvoice(invoiceBooking, turf, customerInfo);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice-${id.slice(-6).toUpperCase()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ success: false, message: "Error generating invoice: " + error.message });
  }
};

export const cancelBooking = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { id } = req.params;
  const now = new Date();

  try {
    const result = await runInTransaction(async ({ session }) => {
      const booking = await Booking.findById(id).populate("turf").session(session);

      if (!booking) {
        throw { status: 404, message: "Booking not found" };
      }

      // Security check: ensure user owns this booking
      if (booking.user.toString() !== userId.toString()) {
        throw { status: 403, message: "Unauthorized" };
      }

      // Check if booking is in a cancellable status
      if (booking.status !== "CONFIRMED" && booking.status !== "PLAYING") {
        throw { status: 400, message: "This booking cannot be cancelled at this stage." };
      }

      // Check if play is more than 72 hours away
      const playStartTime = new Date(booking.playStartTime);
      const hoursRemaining = (playStartTime - now) / (1000 * 60 * 60);

      if (hoursRemaining < 72) {
        throw { status: 400, message: "Cancellations are only allowed at least 72 hours before the slot time." };
      }

      // Since it's > 72h, it's always eligible for 30% refund
      const amountPaid = booking.totalPrice; // Total price is refunded 30%
      const refundAmount = Math.round(amountPaid * 0.3);

      // 1. Update Booking Status
      booking.status = "CANCELLED";
      if (refundAmount > 0) {
        booking.revenueStatus = "REFUNDED"; // Partially refunded in this case
      }
      await booking.save({ session });

      // 2. Refund to Wallet if eligible
      if (refundAmount > 0) {
        const user = await User.findById(userId).session(session);
        if (user) {
          user.walletBalance = (user.walletBalance || 0) + refundAmount;
          await user.save({ session });

          await WalletTransaction.create([
            {
              user: userId,
              amount: refundAmount,
              type: "REFUND",
              status: "SUCCESS",
              description: `30% refund for cancelled booking #${booking._id.toString().slice(-6).toUpperCase()}`,
              bookingId: booking._id,
            }
          ], { session });
        }
      }

      // 3. Deduct from Owner's pending balance (they get 0 for cancelled bookings)
      const amountToDeductFromOwner = booking.advanceAmount || booking.totalPrice;
      const turf = booking.turf;
      if (turf && turf.owner) {
        // Find owner record
        const ownerRecord = await Owner.findOne({ 
          $or: [{ _id: turf.owner }, { userId: turf.owner }] 
        }).session(session);

        if (ownerRecord) {
          ownerRecord.pendingBalance = Math.max(0, (ownerRecord.pendingBalance || 0) - amountToDeductFromOwner);
          await ownerRecord.save({ session });
        }
      }

      // 4. Release TimeSlot (Delete it so it's available for others)
      if (booking.timeSlot) {
        await TimeSlot.findByIdAndDelete(booking.timeSlot).session(session);
      }

      return { booking, refundAmount };
    });

    const { booking, refundAmount } = result;
    const message = `Booking cancelled successfully. 30% refund (₹${refundAmount}) has been credited to your wallet.`;

    // 5. Notify User
    await createNotification({
      recipientId: booking.user,
      recipientModel: 'User',
      title: "Booking Cancelled",
      message: refundAmount > 0 
        ? `Your booking has been cancelled. 30% refund (₹${refundAmount}) credited to wallet.` 
        : `Your booking has been cancelled. No refund issued as per policy.`,
      type: "BOOKING",
      link: "/profile/bookings"
    });

    return res.status(200).json({ success: true, message, refundAmount });
  } catch (error) {
    console.error("Error in cancelBooking:", error);
    return res.status(error.status || 500).json({ 
      success: false, 
      message: error.message || "Internal server error" 
    });
  }
};
