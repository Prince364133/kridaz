import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    venue: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    umpire: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
    status: { type: String, enum: ["upcoming", "completed", "cancelled"], default: "upcoming" },
    type: { type: String, default: "Tournament" },
    teams: [{ type: String }],
    result: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
