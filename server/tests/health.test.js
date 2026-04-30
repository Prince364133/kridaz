import request from "supertest";
import app from "../app.js";

describe("Health Check API", () => {
  it("should return 200 OK for /api/health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "OK");
  });

  it("should return 200 for root route /", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain("TurfSpot API is running");
  });
});
