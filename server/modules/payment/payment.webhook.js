import crypto from "crypto";
import WalletTransaction from "../../models/walletTransaction.model.js";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import Booking from "../../models/booking.model.js";

/**
 * Handle Razorpay Webhooks
 * This endpoint should be public and not require authentication.
 * It uses Razorpay Signature validation to ensure the request is genuine.
 */
export const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  try {
    // 1. Verify Signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(req.rawBody);
    const digest = shasum.digest("hex");

    if (digest !== signature) {
      console.error("[WEBHOOK] Invalid signature detected");
      return res.status(400).json({ status: "invalid_signature" });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[WEBHOOK] Received event: ${event}`);

    // 2. Handle Events
    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload.payment.entity);
        break;
      
      case "order.paid":
        // Usually order.paid is triggered when the full amount is captured
        break;

      default:
        console.log(`[WEBHOOK] Unhandled event: ${event}`);
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * Handle payment.captured event
 * Useful for Wallet Topups and Booking confirmations as a fallback
 */
async function handlePaymentCaptured(payment) {
  const { order_id, id: payment_id, status } = payment;

  // Check if it's a Wallet Topup
  const transaction = await WalletTransaction.findOne({ 
    razorpayOrderId: order_id,
    status: "PENDING" 
  });

  if (transaction) {
    console.log(`[WEBHOOK] Processing wallet topup for order: ${order_id}`);
    
    // Find the user/owner
    const user = await User.findById(transaction.user) || await Owner.findOne({ userId: transaction.user });
    
    if (user) {
      const Model = (user.role === "user") ? User : Owner;
      
      // Update balance if not already updated by frontend
      await Model.findByIdAndUpdate(user._id, { 
        $inc: { walletBalance: transaction.amount } 
      });

      transaction.status = "SUCCESS";
      transaction.razorpayPaymentId = payment_id;
      await transaction.save();
      
      console.log(`[WEBHOOK] Wallet topped up for ${user.name}`);
    }
    return;
  }

  // Check if it's a Booking
  const booking = await Booking.findOne({ 
    "payment.orderId": order_id,
    status: "PENDING" // Assuming there's a pending status for bookings
  });

  if (booking) {
    console.log(`[WEBHOOK] Processing booking confirmation for order: ${order_id}`);
    // Add booking confirmation logic here if needed
  }
}
