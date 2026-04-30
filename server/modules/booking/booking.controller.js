import Booking from "../../models/booking.model.js";
import Turf from "../../models/turf.model.js";
import TimeSlot from "../../models/timeSlot.model.js";
import User from "../../models/user.model.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import generateQRCode from "../../utils/generateQRCode.js";
import adjustTime from "../../utils/adjustTime.js";
import generateEmail, { generateHTMLContent } from "../../utils/generateEmail.js";
import { format, parseISO } from "date-fns";

// --- USER OPERATIONS ---

export const createOrder = async (req, res) => {
  const userId = req.user.user;
  try {
    const { totalPrice } = req.body;
    const user = await User.findById(userId).select("name email");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
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
  const userId = req.user.user;
  const {
    id: turfId,
    duration,
    startTime,
    endTime,
    selectedTurfDate,
    totalPrice,
    paymentId,
    orderId,
    razorpay_signature,
  } = req.body;

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

    const [user, turf] = await Promise.all([
      User.findById(userId),
      Turf.findById(turfId),
    ]);
    
    if (!user || !turf) {
      return res.status(404).json({ success: false, message: "User or Turf not found" });
    }

    const QRcode = await generateQRCode(
      totalPrice,
      formattedStartTime,
      formattedEndTime,
      formattedDate,
      turf.name,
      turf.location
    );

    const timeSlot = await TimeSlot.create({
      turf: turfId,
      startTime: adjustedStartTime,
      endTime: adjustedEndTime,
    });

    const booking = await Booking.create({
      user: userId,
      turf: turfId,
      timeSlot: timeSlot._id,
      totalPrice,
      qrCode: QRcode,
      payment: { orderId, paymentId },
    });

    await User.findByIdAndUpdate(userId, { $push: { bookings: booking._id } });

    const htmlContent = generateHTMLContent(
      turf.name,
      turf.location,
      formattedDate,
      formattedStartTime,
      formattedEndTime,
      totalPrice,
      QRcode
    );

    generateEmail(user.email, "Booking Confirmation", htmlContent).catch(err => {
      console.error("[EMAIL] Failed to send ticket:", err.message);
    });

    return res.status(200).json({
      success: true,
      message: "Booking successful, Check your email for the receipt",
    });
  } catch (error) {
    console.error("Error in verifyPayment", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your booking: " + error.message,
    });
  }
};

export const getUserBookings = async (req, res) => {
  const userId = req.user.user;
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
    const ownerId = req.owner.id;
    const ownedTurfs = await Turf.find({ owner: ownerId }).select("_id");
    
    if (ownedTurfs.length === 0) {
      return res.status(404).json({ message: "No turfs found for this owner" });
    }

    const turfIds = ownedTurfs.map((turf) => turf._id);

    const bookings = await Booking.aggregate([
      { $match: { turf: { $in: turfIds } } },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
      { $lookup: { from: "turves", localField: "turf", foreignField: "_id", as: "turf" } },
      { $lookup: { from: "timeslots", localField: "timeSlot", foreignField: "_id", as: "timeSlot" } },
      { $unwind: "$user" },
      { $unwind: "$turf" },
      { $unwind: "$timeSlot" },
      {
        $project: {
          id: "$_id",
          turfName: "$turf.name",
          userName: "$user.name",
          totalPrice: 1,
          bookingDate: "$createdAt",
          duration: {
            $divide: [
              { $subtract: ["$timeSlot.endTime", "$timeSlot.startTime"] },
              1000 * 60 * 60,
            ],
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
