import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["Private", "Group", "Masterclass"], default: "Group" },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    coach: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["upcoming", "completed", "cancelled"], default: "upcoming" },
    duration: { type: String, default: "60 mins" }
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
