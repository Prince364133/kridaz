import { Router } from "express";
import { handleRazorpayWebhook } from "./payment.webhook.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Razorpay Integration and Webhooks
 */

/**
 * @swagger
 * /payment/webhook:
 *   post:
 *     summary: Razorpay Webhook Endpoint
 *     description: Secure endpoint for Razorpay to notify Kridaz about payment success, failure, or refunds. Validates X-Razorpay-Signature.
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature or payload
 */
router.post("/webhook", handleRazorpayWebhook);

export default router;
