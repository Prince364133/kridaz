import WalletTransaction from "../../models/walletTransaction.model.js";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import WithdrawalRequest from "../../models/withdrawalRequest.model.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import { notifyAdmins } from "../../utils/notificationHelper.js";

const getAccount = async (req) => {
  const { id, role, ownerId } = req.user;

  // Regular users → User model
  if (role === "user") {
    return await User.findById(id);
  }

  // Owner / umpire / coach / admin → Owner model
  // Try ownerId shortcut first, fall back to userId lookup
  if (ownerId) {
    return await Owner.findById(ownerId);
  }
  return await Owner.findOne({ userId: id });
};

export const createTopupOrder = async (req, res) => {
  const userId = req.user.id || req.user.user;
  try {
    const { amount } = req.body; // Amount in INR

    if (!amount) {
      return res.status(400).json({ message: "Top-up amount is required" });
    }

    if (amount < 500) {
      return res.status(400).json({ message: "Minimum top-up amount is Rs 500" });
    }

    if (amount > 10000) {
      return res.status(400).json({ message: "Maximum top-up amount is Rs 10,000" });
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
    const account = await getAccount(req);
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const Model = (req.user.role === "user") ? User : Owner;

    // Atomic wallet credit — $inc is atomic at document level, no replica set needed
    const updatedAccount = await Model.findByIdAndUpdate(
      account._id,
      { $inc: { walletBalance: transaction.amount } },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(500).json({ success: false, message: "Failed to update wallet balance" });
    }

    // Mark transaction as SUCCESS
    transaction.status = "SUCCESS";
    transaction.razorpayPaymentId = razorpay_payment_id;
    await transaction.save();

    return res.status(200).json({
      success: true,
      message: "Wallet topped up successfully",
      balance: updatedAccount.walletBalance,
    });
  } catch (error) {
    console.error("Error in verifyTopup:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWalletData = async (req, res) => {
  const userId = req.user.id;
  try {
    const account = await getAccount(req);
    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      balance: account?.walletBalance || 0,
      reservedBalance: account?.reservedBalance || 0,
      pendingBalance: account?.pendingBalance || 0,
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
        // Find the user to check their role
        const userDoc = await User.findById(transaction.user);
        const isPartner = userDoc && ["owner", "coach", "umpire", "admin", "streamer"].includes(userDoc.role?.toLowerCase());

        let account;
        if (isPartner) {
          // Update Owner collection for partners
          account = await Owner.findOneAndUpdate(
            { userId: transaction.user },
            { $inc: { walletBalance: transaction.amount } },
            { new: true }
          );
          // Fallback to User if no Owner record exists yet (should not happen for active partners)
          if (!account) {
            account = await User.findByIdAndUpdate(
              transaction.user,
              { $inc: { walletBalance: transaction.amount } },
              { new: true }
            );
          }
        } else {
          // Update User collection for regular players
          account = await User.findByIdAndUpdate(
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

export const requestWithdrawal = async (req, res) => {
  const ownerId = req.user.id || req.user.user;
  const { amount, bankDetails } = req.body;

  try {
    if (req.user.role === "user") {
      return res.status(403).json({ message: "Only partners can request withdrawals" });
    }

    if (!amount || amount < 500) {
      return res.status(400).json({ message: "Minimum withdrawal amount is Rs 500" });
    }

    if (amount > 100000) {
      return res.status(400).json({ message: "Maximum withdrawal amount is Rs 1,00,000" });
    }

    const owner = req.user.ownerId 
      ? await Owner.findById(req.user.ownerId) 
      : await Owner.findOne({ userId: req.user.id });

    if (!owner) {
      return res.status(404).json({ message: "Account not found" });
    }

    const usableBalance = owner.walletBalance - owner.reservedBalance;
    if (usableBalance < amount) {
      return res.status(400).json({ message: "Insufficient usable balance" });
    }

    // 1. Create withdrawal request
    const request = await WithdrawalRequest.create({
      owner: owner._id,
      amount,
      bankDetails,
      status: "PENDING"
    });

    // 2. Reserve the amount
    owner.reservedBalance += amount;
    await owner.save();

    // 3. Notify Admin
    await notifyAdmins({
      title: "Withdrawal Requested",
      message: `Partner ${owner.name} requested a withdrawal of Rs ${amount}.`,
      type: "WITHDRAWAL",
      link: "/admin/withdrawals"
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      request
    });
  } catch (error) {
    console.error("Error in requestWithdrawal:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getOwnerWithdrawals = async (req, res) => {
  try {
    const owner = req.user.ownerId 
      ? await Owner.findById(req.user.ownerId) 
      : await Owner.findOne({ userId: req.user.id });

    if (!owner) {
      return res.status(404).json({ success: false, message: "Partner account not found" });
    }
    const requests = await WithdrawalRequest.find({ owner: owner._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
