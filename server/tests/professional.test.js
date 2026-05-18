import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const emailUser = `prof_u_${ts}@kridaz.test`;
const phoneUser = `91111${String(ts).slice(-5)}`;
const userNameUser = `prof_u_${ts}`;

const emailOwner = `prof_o_${ts}@kridaz.test`;
const phoneOwner = `92222${String(ts).slice(-5)}`;
const userNameOwner = `prof_o_${ts}`;

let userToken = "";
let ownerToken = "";
let userId = "";
let ownerUserId = "";
let ownerProfileId = "";

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

describe("Professional Module API", () => {
  beforeAll(async () => {
    // Clean up
    for (const email of [emailUser, emailOwner]) {
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        await prisma.wallet.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.review.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.professionalBooking.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.ownerProfile.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      }
      await prisma.oTP.deleteMany({ where: { email } }).catch(() => {});
    }

    // Seed OTP
    await seedOtp(emailUser, phoneUser);
    await seedOtp(emailOwner, phoneOwner);

    // Register User
    const regUser = await request(app)
      .post("/api/user/auth/register")
      .send({
        name: "User Book",
        email: emailUser,
        username: userNameUser,
        phone: phoneUser,
        gender: "Male",
        location: "Mumbai",
        password: "User@Pass123",
        confirmPassword: "User@Pass123",
        otp: "123456",
        phoneOtp: "123456",
      });

    if (regUser.statusCode === 201) {
      userToken = regUser.body.token;
      userId = regUser.body.user?.id || "";
    }

    // Register Owner
    const regOwner = await request(app)
      .post("/api/user/auth/register")
      .send({
        name: "Coach Professional",
        email: emailOwner,
        username: userNameOwner,
        phone: phoneOwner,
        gender: "Male",
        location: "Mumbai",
        password: "Owner@Pass123",
        confirmPassword: "Owner@Pass123",
        otp: "123456",
        phoneOtp: "123456",
      });

    if (regOwner.statusCode === 201) {
      ownerUserId = regOwner.body.user?.id || "";
    }

    // Direct ID discovery from tokens if needed
    if (!userId && userToken) {
      const decoded = jwt.decode(userToken);
      userId = decoded.id;
    }

    // Update Owner role to COACH and location in DB
    await prisma.user.update({
      where: { id: ownerUserId },
      data: { 
        role: "COACH",
        city: "Mumbai",
        state: "Maharashtra"
      }
    });

    // Create OwnerProfile
    const ownerProfile = await prisma.ownerProfile.create({
      data: {
        userId: ownerUserId,
        businessName: "Mumbai Cricket Academy",
        verified: true,
        price: 150,
        bio: "Veteran cricket coach with 10 years experience",
        experience: "10 years",
        specialization: "Spin Bowling",
        rating: 5,
        numReviews: 1
      }
    });
    ownerProfileId = ownerProfile.id;

    // Generate authenticated JWT with ownerId for owner
    ownerToken = jwt.sign(
      {
        id: ownerUserId,
        role: "COACH",
        ownerId: ownerProfileId
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Initialize user's wallet with enough balance (coins)
    await prisma.wallet.upsert({
      where: { userId },
      update: { balance: 1000 },
      create: { userId, balance: 1000, reservedBalance: 0 }
    });
  }, 30000);

  afterAll(async () => {
    // Cleanup
    if (ownerProfileId) {
      await prisma.professionalAvailability.deleteMany({ where: { professionalId: ownerProfileId } }).catch(() => {});
      await prisma.professionalBooking.deleteMany({ where: { professionalId: ownerProfileId } }).catch(() => {});
      await prisma.review.deleteMany({ where: { professionalId: ownerProfileId } }).catch(() => {});
      await prisma.ownerProfile.delete({ where: { id: ownerProfileId } }).catch(() => {});
    }
    for (const id of [userId, ownerUserId]) {
      if (id) {
        await prisma.wallet.deleteMany({ where: { userId: id } }).catch(() => {});
        await prisma.user.delete({ where: { id } }).catch(() => {});
      }
    }
    await prisma.$disconnect();
  });

  describe("GET /api/professional/list", () => {
    it("should retrieve a list of professionals", async () => {
      const res = await request(app)
        .get("/api/professional/list")
        .query({ city: "Mumbai" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("professionals");
      expect(Array.isArray(res.body.professionals)).toBe(true);
    });
  });

  describe("GET /api/professional/filters", () => {
    it("should retrieve filter options for states and cities", async () => {
      const res = await request(app)
        .get("/api/professional/filters");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("states");
      expect(res.body).toHaveProperty("cities");
    });
  });

  describe("GET /api/professional/details/:id", () => {
    it("should retrieve a professional by ID", async () => {
      const res = await request(app)
        .get(`/api/professional/details/${ownerProfileId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("professional");
      expect(res.body.professional.id).toBe(ownerProfileId);
    });
  });

  describe("PUT /api/professional/availability", () => {
    it("should update availability slots for the professional", async () => {
      const slots = [
        { startTime: "10:00", endTime: "11:00", isAvailable: true },
        { startTime: "11:00", endTime: "12:00", isAvailable: true }
      ];

      const res = await request(app)
        .put("/api/professional/availability")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          date: "2026-05-20",
          slots
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Availability updated");
      expect(res.body.availability.slots).toHaveLength(2);
    });
  });

  describe("POST /api/professional/book", () => {
    it("should book a professional and reserve coins", async () => {
      const slotsToBook = [{ startTime: "10:00", endTime: "11:00" }];

      const res = await request(app)
        .post("/api/professional/book")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          professionalId: ownerProfileId,
          date: "2026-05-20",
          slots: slotsToBook,
          totalAmount: 150,
          bookingType: "COACHING",
          message: "Looking forward to coaching!"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toContain("Coins reserved");
    });
  });

  describe("GET /api/professional/my-bookings", () => {
    it("should retrieve the professional's bookings list", async () => {
      const res = await request(app)
        .get("/api/professional/my-bookings")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("bookings");
      expect(res.body.bookings.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/professional/handle-request", () => {
    it("should accept a booking request and transfer coins", async () => {
      // First get the booking ID
      const bookingsRes = await request(app)
        .get("/api/professional/my-bookings")
        .set("Authorization", `Bearer ${ownerToken}`);
      
      const bookingId = bookingsRes.body.bookings[0].id;

      const res = await request(app)
        .post("/api/professional/handle-request")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          bookingId,
          status: "ACCEPTED"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("accepted successfully");
    });
  });

  describe("POST /api/professional/review", () => {
    it("should add a review for the professional", async () => {
      const res = await request(app)
        .post("/api/professional/review")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          professionalId: ownerProfileId,
          rating: 4,
          comment: "Excellent coaching!"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Review added");
    });
  });

  describe("PUT /api/professional/update-profile", () => {
    it("should update the professional's profile details", async () => {
      const res = await request(app)
        .put("/api/professional/update-profile")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          name: "Coach Professional Updated",
          bio: "Updated veteran coach biography",
          hourlyPrice: 175,
          city: "Navi Mumbai",
          state: "Maharashtra",
          specialization: "Fast Bowling"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Profile updated successfully");
      expect(res.body.professional.user.name).toBe("Coach Professional Updated");
    });
  });
});
