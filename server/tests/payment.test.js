import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const RAZORPAY_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "razorpay_webhook_secret_for_tests";
// Use a test secret for tests if not set
process.env.RAZORPAY_WEBHOOK_SECRET = RAZORPAY_SECRET;

const generateSignature = (payload, secret) => {
  return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
};

describe("Payment Webhook Integration Tests", () => {
  const ts = Date.now();
  const emailUser = `payment_u_${ts}@kridaz.test`;
  let userId;
  let walletId;
  let testBookingId;

  beforeAll(async () => {
    // Clean up
    const existingUser = await prisma.user.findFirst({ where: { email: emailUser } });
    if (existingUser) {
      await prisma.walletTransaction.deleteMany({ where: { userId: existingUser.id } }).catch(() => {});
      await prisma.wallet.deleteMany({ where: { userId: existingUser.id } }).catch(() => {});
      await prisma.timeSlot.deleteMany({ where: { turf: { owner: { userId: existingUser.id } } } }).catch(() => {});
      await prisma.booking.deleteMany({ where: { userId: existingUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: existingUser.id } }).catch(() => {});
    }

    // Create user and wallet
    const user = await prisma.user.create({
      data: {
        name: "Payment Test User",
        email: emailUser,
        phone: `99999${String(ts).slice(-5)}`,
        password: "Password123",
      }
    });
    userId = user.id;

    const wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        usableBalance: 0,
        userType: "user"
      }
    });
    walletId = wallet.id;

    // Create a dummy turf
    const ownerUser = await prisma.user.create({
      data: {
        name: "Test Turf Owner",
        email: `owner_${ts}@kridaz.test`,
        phone: `88888${String(ts).slice(-5)}`,
        password: "Password123"
      }
    });
    const ownerProfile = await prisma.ownerProfile.create({
      data: { userId: ownerUser.id }
    });
    const turf = await prisma.turf.create({
      data: {
        ownerId: ownerProfile.id,
        name: "Payment Test Turf",
        location: "Test Location",
        city: "Test City",
        googleLocation: "https://maps.google.com/test",
        price: 1000,
        contact: "1234567890",
        state: "Delhi",
        zip: "110001",
        landmark: "Test Landmark"
      }
    });

    // Create a pending booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        turfId: turf.id,
        turfDate: new Date(),
        totalPrice: 1000,
        status: "PENDING_PAYMENT",
        paymentType: "FULL",
        razorpayOrderId: `order_booking_${ts}`
      }
    });
    testBookingId = booking.id;
  }, 30000);

  afterAll(async () => {
    // Final cleanup
    const user = await prisma.user.findFirst({ where: { email: emailUser } });
    if (user) {
      await prisma.walletTransaction.deleteMany({ where: { userId: user.id } }).catch(() => {});
      await prisma.wallet.deleteMany({ where: { userId: user.id } }).catch(() => {});
      await prisma.booking.deleteMany({ where: { userId: user.id } }).catch(() => {});
      
      const turfOwner = await prisma.user.findFirst({ where: { email: `owner_${ts}@kridaz.test` } });
      if (turfOwner) {
        await prisma.turf.deleteMany({ where: { owner: { userId: turfOwner.id } } }).catch(() => {});
        await prisma.ownerProfile.deleteMany({ where: { userId: turfOwner.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: turfOwner.id } }).catch(() => {});
      }
      
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }
  });

  describe("POST /api/payment/webhook", () => {
    it("should reject requests with missing signature header", async () => {
      const payload = { event: "payment.captured", payload: {} };
      
      const res = await request(app)
        .post("/api/payment/webhook")
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Webhook signature is missing");
    });

    it("should reject requests with invalid signature", async () => {
      const payload = { event: "payment.captured", payload: {} };
      
      const res = await request(app)
        .post("/api/payment/webhook")
        .set("X-Razorpay-Signature", "invalid_signature")
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Invalid webhook signature");
    });

    it("should successfully process a top-up payment.captured event and credit wallet idempotently", async () => {
      const razorpayOrderId = \`order_topup_${ts}\`;
      const razorpayPaymentId = \`pay_topup_${ts}\`;
      
      // Create pending wallet transaction
      await prisma.walletTransaction.create({
        data: {
          userId,
          amount: 500,
          type: "TOPUP",
          status: "PENDING",
          description: "Wallet Top-up Test",
          razorpayOrderId
        }
      });

      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: razorpayPaymentId,
              order_id: razorpayOrderId,
              status: "captured",
              amount: 50000 // in paise
            }
          }
        }
      };
      
      const signature = generateSignature(payload, RAZORPAY_SECRET);

      // First webhook call
      const res1 = await request(app)
        .post("/api/payment/webhook")
        .set("X-Razorpay-Signature", signature)
        .send(payload);

      expect(res1.statusCode).toBe(200);

      const walletAfterFirst = await prisma.wallet.findUnique({ where: { userId } });
      expect(walletAfterFirst.balance).toBe(500);

      const txnAfterFirst = await prisma.walletTransaction.findFirst({ where: { razorpayOrderId } });
      expect(txnAfterFirst.status).toBe("SUCCESS");

      // Second webhook call (Idempotency test)
      const res2 = await request(app)
        .post("/api/payment/webhook")
        .set("X-Razorpay-Signature", signature)
        .send(payload);

      expect(res2.statusCode).toBe(200); // Should return 200 immediately
      
      const walletAfterSecond = await prisma.wallet.findUnique({ where: { userId } });
      expect(walletAfterSecond.balance).toBe(500); // Balance should NOT increment again
    });

    it("should successfully process a booking payment.captured event idempotently", async () => {
      const razorpayOrderId = \`order_booking_${ts}\`;
      const razorpayPaymentId = \`pay_booking_${ts}\`;

      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: razorpayPaymentId,
              order_id: razorpayOrderId,
              status: "captured",
              amount: 100000 // in paise
            }
          }
        }
      };
      
      const signature = generateSignature(payload, RAZORPAY_SECRET);

      // First webhook call
      const res1 = await request(app)
        .post("/api/payment/webhook")
        .set("X-Razorpay-Signature", signature)
        .send(payload);

      expect(res1.statusCode).toBe(200);

      // Booking status should change to CONFIRMED
      const bookingAfterFirst = await prisma.booking.findUnique({ where: { id: testBookingId } });
      expect(bookingAfterFirst.status).toBe("CONFIRMED");

      // Wallet transaction for booking should be created
      const txn = await prisma.walletTransaction.findFirst({ where: { razorpayPaymentId } });
      expect(txn).toBeDefined();
      expect(txn.type).toBe("BOOKING_PAYMENT");

      // Second webhook call (Idempotency test)
      const res2 = await request(app)
        .post("/api/payment/webhook")
        .set("X-Razorpay-Signature", signature)
        .send(payload);

      expect(res2.statusCode).toBe(200); // Should return 200 immediately
      
      // Still only one transaction should exist
      const txnCount = await prisma.walletTransaction.count({ where: { razorpayPaymentId } });
      expect(txnCount).toBe(1);
    });
  });
});
