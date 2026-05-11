import mongoose from "mongoose";

const hostedGameSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gameType: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    ground: { type: mongoose.Schema.Types.ObjectId, ref: "Turf" },
    umpire: { type: mongoose.Schema.Types.ObjectId, ref: "Owner" },
    perPlayerCharge: { type: Number, default: 0 },
    groundCost: { type: Number, default: 0 },
    umpireCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
    },
    shortId: { type: String, unique: true, sparse: true },
    scoringStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },
    umpireRequest: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Owner" },
      status: { type: String, enum: ["NONE", "PENDING", "APPROVED", "REJECTED"], default: "NONE" },
    },
    teams: {
      teamA: {
        name: { type: String, default: "Team A" },
        image: { type: String },
        slots: [
          {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            role: { type: String },
            status: { type: String, enum: ["OPEN", "PENDING", "JOINED"], default: "OPEN" },
          },
        ],
      },
      teamB: {
        name: { type: String, default: "Team B" },
        image: { type: String },
        slots: [
          {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            role: { type: String },
            status: { type: String, enum: ["OPEN", "PENDING", "JOINED"], default: "OPEN" },
          },
        ],
      },
    },
    city: { type: String },
    state: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("HostedGame", hostedGameSchema);
