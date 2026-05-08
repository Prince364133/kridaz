import { z } from "zod";

export const createTopupSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be greater than 0"),
  }),
});

export const verifyTopupSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1, "Order ID is required"),
    razorpay_payment_id: z.string().min(1, "Payment ID is required"),
    razorpay_signature: z.string().min(1, "Signature is required"),
  }),
});
