import mongoose from "mongoose";

const hostedGameSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gameType: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    ground: { type: mongoose.Schema.Types.ObjectId, ref: "Turf" },
    umpire: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    scorer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    streamer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    perPlayerCharge: { type: Number, default: 0 },
    perSeatCharge: { type: Number, default: 0 }, // Alias for Quick Game mode consistency
    groundCost: { type: Number, default: 0 },
    umpireCost: { type: Number, default: 0 },
    streamerCost: { type: Number, default: 0 },
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
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["NONE", "PENDING", "APPROVED", "REJECTED"], default: "NONE" },
    },
    scorerRequest: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["NONE", "PENDING", "APPROVED", "REJECTED"], default: "NONE" },
    },
    streamerRequest: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["NONE", "PENDING", "APPROVED", "REJECTED"], default: "NONE" },
    },
    streamConfig: {
      platform: { type: String, enum: ["YouTube", "Facebook", "Twitch", "Custom"], default: "YouTube" },
      streamKey: { type: String, default: "" },
      rtmpUrl: { type: String, default: "rtmp://a.rtmp.youtube.com/live2" },
      publicUrl: { type: String, default: "" },
      status: { type: String, enum: ["OFFLINE", "LIVE"], default: "OFFLINE" },
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

    // ── Phase 1: Game Mode ────────────────────────────────────────────────────
    /**
     * gameMode distinguishes:
     *   QUICK        — Casual single-pool slots; host-assignable; friends & custom invites
     *   PROFESSIONAL — Structured Team A vs B (existing flow, unchanged)
     */
    gameMode: {
      type: String,
      enum: ["QUICK", "PROFESSIONAL"],
      default: "PROFESSIONAL",
    },

    /**
     * quickSlots[] — flat slot array for QUICK game mode only.
     *
     * Slot lifecycle:
     *   OPEN    → any public user can request to join
     *   HELD    → host pre-assigned to a specific user or custom player invite
     *   PENDING → user has requested join; awaiting host confirm (public join path)
     *   JOINED  → confirmed & paid (if applicable)
     *
     * addedBy      → host userId who made the assignment
     * customPlayerRef → references the _id of a document inside customPlayers[]
     */
    quickSlots: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        customPlayerRef: { type: mongoose.Schema.Types.ObjectId, default: null },
        role: { type: String, default: "Player" },
        status: {
          type: String,
          enum: ["OPEN", "HELD", "PENDING", "JOINED"],
          default: "OPEN",
        },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      },
    ],

    /**
     * customPlayers[] — off-platform guests invited by the host.
     *
     * Invite flow:
     *  1. Host fills name + email (+ phone optional) in the slot picker popup.
     *  2. Server generates inviteToken (UUID) → emails magic link.
     *     Link: ${CLIENT_URL}/auth/signup?invite=<token>
     *  3. Guest signs up → token saved to localStorage.
     *  4. After profile completion → /join-games?openGame=<gameId>&slotIndex=<n>
     *  5. inviteStatus: PENDING → ACCEPTED (on successful join) | EXPIRED (token invalid)
     *
     * mustPay: when true, guest must pay perPlayerCharge before slot is JOINED.
     *          when false, slot auto-confirmed after signup (free reservation).
     */
    customPlayers: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, default: "" },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        slotIndex: { type: Number, required: true },
        mustPay: { type: Boolean, default: false },
        inviteToken: { type: String },
        inviteStatus: {
          type: String,
          enum: ["PENDING", "ACCEPTED", "EXPIRED"],
          default: "PENDING",
        },
        invitedAt: { type: Date, default: Date.now },
      },
    ],

    /**
     * customUmpire — off-platform umpire invited by the host.
     */
    customUmpire: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      inviteToken: { type: String },
      inviteStatus: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "EXPIRED"],
        default: "PENDING",
      },
      invitedAt: { type: Date },
    },
    isLive: { type: Boolean, default: false },
    streamStatus: { type: String, default: 'offline' },
    overlayConfig: { type: Object, default: { showScoreboard: true, showCommentary: true } },
    liveStartedAt: { type: Date },
    broadcasts: [
      {
        platform: { type: String, enum: ["youtube", "facebook"] },
        accountId: { type: String },
        accountName: { type: String },
        videoId: { type: String },
        broadcastId: { type: String },
        streamId: { type: String },
        streamKey: { type: String },
        rtmpUrl: { type: String },
        watchUrl: { type: String },
        status: { type: String, default: 'offline' }
      }
    ],
    overlayToken:       { type: String },
    lastCommentary: { type: String },
    lastCommentaryAt: { type: Date },
    liveScoreSnapshot: { type: Object },
    oversPerInnings: { type: Number, default: 20 },
    tickerTheme: { type: String, default: "classic" }
  },
  { timestamps: true }
);

// ── Performance indexes ───────────────────────────────────────────────────────
hostedGameSchema.index({ status: 1, date: 1, city: 1 });
hostedGameSchema.index({ host: 1, createdAt: -1 });

export default mongoose.model("HostedGame", hostedGameSchema);
