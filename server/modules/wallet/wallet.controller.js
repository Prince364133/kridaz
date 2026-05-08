import WalletTransaction from "../../models/walletTransaction.model.js";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";

const getModelByRole = (role) => {
  return (role === "user") ? User : Owner;
};

export const createTopupOrder = async (req, res) => {
  const userId = req.user.id || req.user.user;
  try {
    const { amount } = req.body; // Amount in INR

    if (!amount) {
      return res.status(400).json({ message: "Top-up amount is required" });
    }

    if (amount < 500) {
      return res.status(400).json({ message: "Minimum top-up amount is ₹500" });
    }

    if (amount > 10000) {
      return res.status(400).json({ message: "Maximum top-up amount is ₹10,000" });
    }

    const options = {
      amount: amount * 100, // Razorpay takes amount in paise
      currency: "INR",
      receipt: `topup_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Create a pending transaction
    await WalletTransaction.create({
      user: userId,
      amount: amount,
      type: "TOPUP",
      status: "PENDING",
      description: "Wallet Top-up",
      razorpayOrderId: order.id,
    });

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error in createTopupOrder:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const verifyTopup = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Update transaction status to FAILED
      await WalletTransaction.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "FAILED", description: "Payment Verification Failed" }
      );
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Find the pending transaction
    const transaction = await WalletTransaction.findOne({
      razorpayOrderId: razorpay_order_id,
      status: "PENDING",
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction record not found" });
    }

    // Atomic update using session
    const Model = getModelByRole(req.user.role);
    const session = await Model.startSession();
    let updatedBalance;
    try {
      await session.withTransaction(async () => {
        const account = await Model.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: transaction.amount } },
          { new: true, session }
        );

        if (!account) throw new Error("Account not found");
        updatedBalance = account.walletBalance;

        transaction.status = "SUCCESS";
        transaction.razorpayPaymentId = razorpay_payment_id;
        await transaction.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      success: true,
      message: "Wallet topped up successfully",
      balance: updatedBalance,
    });
  } catch (error) {
    console.error("Error in verifyTopup:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWalletData = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const Model = getModelByRole(req.user.role);
  try {
    const account = await Model.findById(userId).select("walletBalance reservedBalance");
    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      balance: account?.walletBalance || 0,
      reservedBalance: account?.reservedBalance || 0,
      usableBalance: (account?.walletBalance || 0) - (account?.reservedBalance || 0),
      transactions,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
export const checkPaymentStatus = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await razorpay.orders.fetchPayments(orderId);
    const successfulPayment = order.items.find(p => p.status === "captured");

    if (successfulPayment) {
      // Find the pending transaction
      const transaction = await WalletTransaction.findOne({
        razorpayOrderId: orderId,
        status: "PENDING",
      });

      if (transaction) {
        // Since we don't store the role in the transaction, we'll try User then Owner
        let account = await User.findByIdAndUpdate(
          transaction.user,
          { $inc: { walletBalance: transaction.amount } },
          { new: true }
        );

        if (!account) {
          account = await Owner.findByIdAndUpdate(
            transaction.user,
            { $inc: { walletBalance: transaction.amount } },
            { new: true }
          );
        }

        if (account) {
          transaction.status = "SUCCESS";
          transaction.razorpayPaymentId = successfulPayment.id;
          await transaction.save();
          return res.status(200).json({ success: true, message: "Payment was successful. Wallet updated." });
        }
      }
    }

    return res.status(200).json({ success: false, message: "No successful payment found for this order." });
  } catch (error) {
    console.error("Error in checkPaymentStatus:", error);
    return res.status(500).json({ message: error.message });
  }
};
