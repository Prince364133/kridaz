import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const ts = Date.now();
const emailOwner = `owner_test_${ts}@kridaz.test`;
const phoneOwner = `88888${String(ts).slice(-5)}`;
let ownerToken = "";
let ownerUserId = "";
let ownerProfileId = "";
let turfId = "";

const seedOtp = async (email, phone) => {
  await prisma.oTP.deleteMany({ where: { email } });
  await prisma.oTP.create({
    data: {
      email,
      phone,
      emailOtp: "123456",
      phoneOtp: "123456",
      expiresAt: new Date(Date.now() + 600000)
    },
  });
};

describe("Owner Module API Integration Tests", () => {
  beforeAll(async () => {
    // Clean up
    const existingOwner = await prisma.user.findFirst({ where: { email: emailOwner } });
    if (existingOwner) {
      await prisma.turf.deleteMany({ where: { owner: { userId: existingOwner.id } } }).catch(() => {});
      await prisma.ownerProfile.deleteMany({ where: { userId: existingOwner.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: existingOwner.id } }).catch(() => {});
    }
    await prisma.oTP.deleteMany({ where: { email: emailOwner } }).catch(() => {});

    // Seed OTP
    await seedOtp(emailOwner, phoneOwner);

    // Register OWNER
    const regOwner = await request(app)
      .post("/api/owner/auth/register")
      .send({
        name: "Test Owner",
        email: emailOwner,
        phone: phoneOwner,
        password: "Owner@Pass123",
        role: "OWNER",
        gender: "Male",
        location: "Delhi",
        otp: "123456",
        phoneOtp: "123456"
      });

    if (regOwner.statusCode === 201) {
      ownerUserId = regOwner.body.user?.id || "";
      ownerToken = regOwner.body.token;

      const profile = await prisma.ownerProfile.findFirst({
        where: { userId: ownerUserId }
      });
      ownerProfileId = profile?.id || "";

      // Create a turf for the owner
      if (ownerProfileId) {
        const turf = await prisma.turf.create({
          data: {
            ownerId: ownerProfileId,
            name: "Test Owner Turf",
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
        turfId = turf.id;
      }
    }
  }, 30000);

  afterAll(async () => {
    const owner = await prisma.user.findFirst({ where: { email: emailOwner } });
    if (owner) {
      await prisma.turf.deleteMany({ where: { owner: { userId: owner.id } } }).catch(() => {});
      await prisma.ownerProfile.deleteMany({ where: { userId: owner.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: owner.id } }).catch(() => {});
    }
  });

  describe("GET /api/owner/dashboard/overview - Owner Dashboard Overview", () => {
    it("should retrieve dashboard overview data for authenticated owner", async () => {
      const res = await request(app)
        .get("/api/owner/dashboard/overview")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("totalRevenue");
      expect(res.body.data).toHaveProperty("totalBookings");
    });
  });

  describe("GET /api/owner/banking - Fetch Banking Details", () => {
    it("should fetch banking details (empty initially)", async () => {
      const res = await request(app)
        .get("/api/owner/banking")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bankingDetails).toBeNull();
    });
  });

  describe("PUT /api/owner/banking - Update Banking Details", () => {
    it("should update banking details", async () => {
      const res = await request(app)
        .put("/api/owner/banking")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          accountHolderName: "Test Owner",
          accountNumber: "1234567890",
          ifscCode: "HDFC0001234",
          bankName: "HDFC Bank",
          branchName: "Test Branch"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      const resGet = await request(app)
        .get("/api/owner/banking")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(resGet.body.bankingDetails.accountNumber).toBe("1234567890");
    });
  });

  describe("GET /api/owner/revenue/summary - Revenue Summary", () => {
    it("should fetch revenue summary", async () => {
      const res = await request(app)
        .get("/api/owner/revenue/summary?timeframe=all_time")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("revenue");
    });
  });
});
