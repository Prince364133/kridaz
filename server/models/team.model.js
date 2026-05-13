import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    sportType: { type: String, required: true },
    captainName: { type: String },
    captainPhone: { type: String },
    teamCode: { type: String, unique: true, sparse: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The user who created the team
    opponents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    opponentRequests: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
        status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["CAPTAIN", "PLAYER", "VICE_CAPTAIN"], default: "PLAYER" },
        status: { type: String, enum: ["PENDING", "JOINED", "REJECTED"], default: "JOINED" },
      }
    ],
    customMembers: [
      {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String },
        inviteToken: { type: String },
        status: { type: String, enum: ["PENDING", "JOINED", "EXPIRED"], default: "PENDING" },
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
