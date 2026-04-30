import request from "supertest";
import app from "../app.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import connectDB from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

describe("Auth Module API", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: "test@example.com" });
    await mongoose.connection.close();
  });

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/user/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123"
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("token");
  });

  it("should login the user", async () => {
    const res = await request(app)
      .post("/api/user/auth/login")
      .send({
        email: "test@example.com",
        password: "password123"
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("role", "user");
  });
});
