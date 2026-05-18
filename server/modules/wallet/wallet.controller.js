import { prisma } from "../../config/prisma.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import NotificationService from "../../services/notification.service.js";
import WalletService from "../../services/wallet.service.js";
import logger from "../../utils/logger.js";

export const createTopupOrder = async (req, res) => {
  const userId = req.user.id || req.user.user;
  try {
    const { amount } = req.body; // Amount in INR

    if (!amount) {
      return res.status(400).json({ message: "Top-up amount is required" });
    }

    const minTopup = Number(process.env.WALLET_MIN_TOPUP) || 500;
    const maxTopup = Number(process.env.WALLET_MAX_TOPUP) || 10000;

    if (amount < minTopup) {
      return res.status(400).json({ message: `Minimum top-up amount is Rs ${minTopup}` });
    }

    if (amount > maxTopup) {
      return res.status(400).json({ message: `Maximum top-up amount is Rs ${maxTopup.toLocaleString('en-IN')}` });
    }

    const options = {
      amount: amount * 100, // Razorpay takes amount in paise
      currency: "INR",
      receipt: `topup_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Create a pending transaction
    await prisma.walletTransaction.create({
      data: {
        userId: userId,
        amount: Number(amount),
        type: "TOPUP",
        status: "PENDING",
        description: "Wallet Top-up",
        razorpayOrderId: order.id,
      }
    });

    return res.status(200).json({ order });
  } catch (error) {
    logger.error("Error in createTopupOrder:", error);
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
      await prisma.walletTransaction.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: "FAILED", description: "Payment Verification Failed" }
      });
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Find the pending transaction
    const transaction = await prisma.walletTransaction.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        status: "PENDING",
      }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction record not found" });
    }

    const account = await WalletService.getAccountProfile(
      req.user.id,
      req.user.role,
      req.user.ownerId
    );
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Atomic wallet credit and status update inside Prisma transaction
    const newBalance = await prisma.$transaction(async (tx) => {
      const balance = await WalletService.credit(
        account.id,
        req.user.role,
        transaction.amount,
        tx
      );

      // Mark transaction as SUCCESS
      await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id
        }
      });

      return balance;
    });

    return res.status(200).json({
      success: true,
      message: "Wallet topped up successfully",
      balance: newBalance,
    });
  } catch (error) {
    logger.error("Error in verifyTopup:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWalletData = async (req, res) => {
  const userId = req.user.id;
  try {
    const wallet = await WalletService.getWallet(userId, req.user.role);
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return res.status(200).json({
      ...wallet,
      transactions: transactions,
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
      const transaction = await prisma.walletTransaction.findFirst({
        where: {
          razorpayOrderId: orderId,
          status: "PENDING",
        }
      });

      if (transaction) {
        const user = await prisma.user.findUnique({
          where: { id: transaction.userId },
          select: { role: true }
        });
        const role = user?.role || 'user';
        
        const newBalance = await prisma.$transaction(async (tx) => {
          const balance = await WalletService.credit(
            transaction.userId,
            role,
            transaction.amount,
            tx
          );

          await tx.walletTransaction.update({
            where: { id: transaction.id },
            data: {
              status: "SUCCESS",
              razorpayPaymentId: successfulPayment.id
            }
          });

          return balance;
        });

        if (newBalance !== undefined) {
          return res.status(200).json({ success: true, message: "Payment was successful. Wallet updated." });
        }
      }
    }

    return res.status(200).json({ success: false, message: "No successful payment found for this order." });
  } catch (error) {
    logger.error("Error in checkPaymentStatus:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const requestWithdrawal = async (req, res) => {
  const { amount, bankDetails } = req.body;

  try {
    if (req.user.role === "user") {
      return res.status(403).json({ message: "Only partners can request withdrawals" });
    }

    const owner = await WalletService.getAccountProfile(
      req.user.id,
      req.user.role,
      req.user.ownerId
    );

    if (!owner) {
      return res.status(404).json({ message: "Account not found" });
    }

    const usableBalance = Number(owner.walletBalance) - Number(owner.reservedBalance);
    if (usableBalance < amount) {
      return res.status(400).json({ message: "Insufficient usable balance" });
    }

    // 1. Create withdrawal request
    const request = await prisma.withdrawalRequest.create({
      data: {
        ownerId: owner.id,
        amount: Number(amount),
        bankDetails,
        status: "PENDING"
      }
    });

    // 2. Reserve the amount
    await prisma.ownerProfile.update({
      where: { id: owner.id },
      data: { reservedBalance: { increment: Number(amount) } }
    });

    // 3. Notify Admin
    NotificationService.notifyAdmins({
      title: "Withdrawal Requested",
      message: `Partner ${owner.name} requested a withdrawal of Rs ${amount}.`,
      type: "WITHDRAWAL",
      link: "/admin/withdrawals"
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      request: request
    });
  } catch (error) {
    logger.error("Error in requestWithdrawal:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getOwnerWithdrawals = async (req, res) => {
  try {
    const owner = await WalletService.getAccountProfile(
      req.user.id,
      req.user.role,
      req.user.ownerId
    );

    if (!owner) {
      return res.status(404).json({ success: false, message: "Partner account not found" });
    }

    const requests = await prisma.withdrawalRequest.findMany({
      where: { ownerId: owner.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ 
      success: true, 
      requests: requests 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
