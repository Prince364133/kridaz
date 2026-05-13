import request from "supertest";
import app from "../app.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import connectDB from "../config/database.js";
import OTP from "../models/otp.model.js";
import dotenv from "dotenv";

dotenv.config();

const testEmail = `test_${Date.now()}@example.com`;
const testPhone = `999${Math.floor(Math.random() * 10000000)}`;
const testUsername = `testuser_${Date.now()}`;

describe("Auth Module API", () => {
  beforeAll(async () => {
    await connectDB();
    await OTP.deleteMany({ email: testEmail });
    await User.deleteMany({ email: testEmail });
    await OTP.create({ email: testEmail, phone: testPhone, emailOtp: "123456", phoneOtp: "123456" });
  });

  afterAll(async () => {
    await User.deleteMany({ email: testEmail });
    await OTP.deleteMany({ email: testEmail });
    await mongoose.connection.close();
  });

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/user/auth/register")
      .send({
        name: "Test User",
        email: testEmail,
        username: testUsername,
        phone: testPhone,
        gender: "Male",
        location: "Test City",
        password: "password123",
        confirmPassword: "password123",
        otp: "123456",
        phoneOtp: "123456"
      });
    if (res.statusCode !== 201) {
      console.log("Register Error:", res.body);
    }
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("token");
  });

  it("should login the user", async () => {
    // Recreate OTP because register deletes it
    await OTP.create({ email: testEmail, phone: testPhone, emailOtp: "123456", phoneOtp: "123456" });

    const res = await request(app)
      .post("/api/user/auth/login")
      .send({
        email: testEmail,
        password: "password123",
        otp: "123456"
      });
    if (res.statusCode !== 200) {
      console.log("Login Error:", res.body);
    }
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("role", "user");
  });
});
