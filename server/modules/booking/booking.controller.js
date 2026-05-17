import * as bookingService from "./booking.service.js";
import { generateInvoice } from "../../utils/generateInvoice.js";
import { format } from "date-fns";
import logger from "../../utils/logger.js";

// --- USER OPERATIONS ---

/**
 * Creates a Razorpay order for booking.
 */
export const createOrder = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { totalPrice } = req.body;

  try {
    const { order, user } = await bookingService.createRazorpayOrder(userId, totalPrice);
    return res.status(200).json({ order, user });
  } catch (error) {
    logger.error("Error in createOrder:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Verifies Razorpay payment signature and completes booking.
 */
export const verifyPayment = async (req, res) => {
  const userId = req.user.id;

  try {
    const booking = await bookingService.verifyBookingPayment(userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Booking successful, Check your email for the receipt",
      bookingId: booking.id,
    });
  } catch (error) {
    logger.error("Error in verifyPayment:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: "An error occurred while processing your booking: " + error.message,
    });
  }
};

/**
 * Instantly confirms booking by deducting amount from customer wallet.
 */
export const bookWithWallet = async (req, res) => {
  const userId = req.user.id;

  try {
    const booking = await bookingService.processWalletBooking(userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Booking successful with Wallet",
      bookingId: booking.id
    });
  } catch (error) {
    logger.error("Error in bookWithWallet:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: "An error occurred: " + error.message,
    });
  }
};

/**
 * Retrieves a detailed booking by ID.
 */
export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await bookingService.findBookingDetailsById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.status(200).json(booking);
  } catch (error) {
    logger.error("Error in getBookingById:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Returns all bookings made by the logged-in user.
 */
export const getUserBookings = async (req, res) => {
  const userId = req.query.userId || req.user.id;
  try {
    const bookings = await bookingService.findBookingsByUserDetailed(userId);
    return res.status(200).json(bookings);
  } catch (error) {
    logger.error("Error in getUserBookings:", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- OWNER OPERATIONS ---

/**
 * Returns all bookings belonging to the turfs owned by this owner.
 */
export const getOwnerBookings = async (req, res) => {
  const ownerUserId = req.owner.id;
  try {
    const formattedBookings = await bookingService.findBookingsByOwnerDetailed(ownerUserId);
    return res.status(200).json(formattedBookings);
  } catch (error) {
    logger.error("Error in getOwnerBookings:", error);
    return res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

/**
 * Validates a coupon's active, expiration, and turf limits.
 */
export const validateCoupon = async (req, res) => {
  const { code, turfId, amount } = req.body;
  if (!code || !turfId || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const { discount, finalAmount } = await bookingService.verifyCoupon(code, turfId, amount);
    return res.status(200).json({
      success: true,
      discount,
      finalAmount,
      message: "Coupon applied successfully"
    });
  } catch (error) {
    logger.error("Error validating coupon:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Inserts a manual booking directly from owner control panel.
 */
export const createManualBooking = async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const booking = await bookingService.processManualBooking(ownerId, req.body);
    return res.status(200).json({
      success: true,
      message: "Manual booking created successfully",
      bookingId: booking.id
    });
  } catch (error) {
    logger.error("Error in createManualBooking:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Generates and streams PDF invoice for checking booking check-ins.
 */
export const downloadInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await bookingService.findBookingDetailsById(id);
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
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error("Error generating invoice:", error);
    return res.status(500).json({ success: false, message: "Error generating invoice: " + error.message });
  }
};

/**
 * Cancels booking, removes slot, and executes refund (within 72 hour limit).
 */
export const cancelBooking = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { id } = req.params;

  try {
    const { refundAmount } = await bookingService.processBookingCancellation(userId, id);
    return res.status(200).json({ 
      success: true, 
      message: `Booking cancelled. Refund of ₹${refundAmount} issued.`, 
      refundAmount 
    });
  } catch (error) {
    logger.error("Error in cancelBooking:", error);
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

// --- ADMIN OPERATIONS ---

/**
 * Fetches platform-wide paginated list of bookings.
 */
export const getAdminAllBookings = async (req, res) => {
  try {
    const { bookings, total } = await bookingService.findAdminBookings(req.query);
    const { page = 1, limit = 20 } = req.query;

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
