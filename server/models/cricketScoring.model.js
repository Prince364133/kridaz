import mongoose from "mongoose";

const cricketScoringSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "HostedGame", required: true },
    umpire: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["LIVE", "COMPLETED"], default: "LIVE" },
    toss: {
      winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      decision: { type: String, enum: ["BAT", "BOWL"] },
    },
    innings: [
      {
        battingTeam: { type: String }, // "teamA" or "teamB"
        totalRuns: { type: Number, default: 0 },
        totalWickets: { type: Number, default: 0 },
        totalBalls: { type: Number, default: 0 },
        isCompleted: { type: Boolean, default: false },
        extras: {
          wides: { type: Number, default: 0 },
          noBalls: { type: Number, default: 0 },
          byes: { type: Number, default: 0 },
          legByes: { type: Number, default: 0 },
          penalty: { type: Number, default: 0 },
        },
      },
    ],
    currentInningsIndex: { type: Number, default: 0 },
    timeline: [
      {
        inningsIndex: { type: Number },
        over: { type: Number },
        ballInOver: { type: Number },
        batter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        bowler: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        runs: { type: Number },
        isExtra: { type: Boolean, default: false },
        extraType: { type: String, enum: ["WIDE", "NO_BALL", "BYE", "LEG_BYE", "NONE"], default: "NONE" },
        isWicket: { type: Boolean, default: false },
        wicketType: { type: String },
        fielder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        commentary: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    battingStats: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        runs: { type: Number, default: 0 },
        balls: { type: Number, default: 0 },
        fours: { type: Number, default: 0 },
        sixes: { type: Number, default: 0 },
        strikeRate: { type: Number, default: 0 },
        outStatus: { type: String, default: "NOT_OUT" },
        bowler: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    bowlingStats: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        overs: { type: Number, default: 0 },
        balls: { type: Number, default: 0 },
        maidens: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        economy: { type: Number, default: 0 },
        wides: { type: Number, default: 0 },
        noBalls: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("CricketScoring", cricketScoringSchema);
