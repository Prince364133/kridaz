import { Router } from "express";
import { handleRazorpayWebhook } from "./payment.webhook.js";

const router = Router();

/**
 * @route POST /api/v1/payment/webhook
 * @desc Razorpay Webhook Endpoint
 * @access Public (Securely validated via signature)
 */
router.post("/webhook", handleRazorpayWebhook);

export default router;
