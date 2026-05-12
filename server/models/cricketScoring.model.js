import mongoose from "mongoose";

/**
 * Wicket dismissal type enum — enforced at schema level.
 */
export const WICKET_TYPES = [
  "BOWLED",
  "CAUGHT",
  "LBW",
  "RUN_OUT",
  "STUMPED",
  "HIT_WICKET",
  "OBSTRUCTING",
  "RETIRED_HURT",
  "RETIRED_OUT",
  "TIMED_OUT",
];

const cricketScoringSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "HostedGame", required: true },
    umpire: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["LIVE", "COMPLETED"], default: "LIVE" },
    result: { type: String },

    /** Toss result */
    toss: {
      winnerTeam: { type: String, enum: ["teamA", "teamB"] },  // "teamA" | "teamB"
      decision: { type: String, enum: ["BAT", "BOWL"] },
    },

    /** Per-innings data */
    innings: [
      {
        battingTeam: { type: String }, // "teamA" or "teamB"
        totalRuns: { type: Number, default: 0 },
        totalWickets: { type: Number, default: 0 },
        totalBalls: { type: Number, default: 0 }, // legal balls only
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

    // ── Active Player State (P1.2) ──────────────────────────────────────────
    /**
     * These three fields track who is currently at the crease and bowling.
     * They are updated after every ball (strike rotation) and after every over
     * (new bowler selection). Set via POST /api/scoring/set-players.
     */
    currentStriker: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    currentNonStriker: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    currentBowler: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    previousBowler: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // to prevent consecutive overs

    /** Ball-by-ball timeline */
    timeline: [
      {
        inningsIndex: { type: Number },
        over: { type: Number },
        ballInOver: { type: Number },
        batter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        bowler: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        runs: { type: Number, default: 0 },
        isExtra: { type: Boolean, default: false },
        extraType: {
          type: String,
          enum: ["WIDE", "NO_BALL", "BYE", "LEG_BYE", "NONE"],
          default: "NONE",
        },
        isBoundary: { type: Boolean, default: false }, // true = hit boundary (4/6); false = running
        isWicket: { type: Boolean, default: false },
        wicketType: {
          type: String,
          enum: [...WICKET_TYPES, null],
          default: null,
        },
        fielder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        commentary: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    /** Cumulative batting scorecard */
    battingStats: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        runs: { type: Number, default: 0 },
        balls: { type: Number, default: 0 },
        fours: { type: Number, default: 0 },
        sixes: { type: Number, default: 0 },
        strikeRate: { type: Number, default: 0 },
        outStatus: { type: String, default: "NOT_OUT" }, // NOT_OUT | dismissal description
        dismissedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // bowler
        caughtBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },    // fielder
        wicketType: { type: String, enum: [...WICKET_TYPES, null], default: null },
        inningsIndex: { type: Number, default: 0 },
      },
    ],

    /** Cumulative bowling scorecard */
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
        inningsIndex: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("CricketScoring", cricketScoringSchema);
