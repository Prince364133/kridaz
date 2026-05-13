import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  role: { type: String, default: "user" },
  ownerDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
  phone: { type: String },
  gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"] },
  location: { type: String },
  city: { type: String },
  state: { type: String },
  locationData: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number] }, // [longitude, latitude]
  },
  sportTypes: [{ type: String }],
  profilePicture: { type: String },
  bannerImage: { type: String },
  bio: { type: String },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookingCount: { type: Number, default: 0 },
  interests: [{ type: String }],
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  walletBalance: { type: Number, default: 0 },
  reservedBalance: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "blocked"], default: "active" },
  stats: {
    cricket: {
      matches: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      bestBowling: {
        wickets: { type: Number, default: 0 },
        runs: { type: Number, default: 0 }
      },
      battingAverage: { type: Number, default: 0 },
      battingStrikeRate: { type: Number, default: 0 },
      bowlingAverage: { type: Number, default: 0 },
      bowlingEconomy: { type: Number, default: 0 },
      hundreds: { type: Number, default: 0 },
      fifties: { type: Number, default: 0 },
      catches: { type: Number, default: 0 },
      stumpings: { type: Number, default: 0 },
      ballsFaced: { type: Number, default: 0 },
      ballsBowled: { type: Number, default: 0 },
      runsConceded: { type: Number, default: 0 }
    },
    badges: [{
      name: { type: String }, // e.g., 'Century Maker'
      category: { type: String }, // 'batting', 'bowling', 'fielding', 'ranking'
      icon: { type: String },
      description: { type: String },
      earnedAt: { type: Date, default: Date.now }
    }],
    matchesOfficiated: { type: Number, default: 0 },
    matchesScored: { type: Number, default: 0 },
    streamsHosted: { type: Number, default: 0 }
  },
  youtubeAccessToken: { type: String, default: null },
  youtubeRefreshToken: { type: String, default: null },
  youtubeTokenExpiry: { type: Date, default: null },
  youtubeChannelId: { type: String, default: null },
  youtubeChannelName: { type: String, default: null },
  youtubeChannelThumb: { type: String, default: null },
  facebookAccessToken: { type: String, default: null },
  facebookPageId: { type: String, default: null },
  facebookPageName: { type: String, default: null },
  facebookPageThumb: { type: String, default: null },
  socialAccounts: [{
    platform: { type: String, enum: ['youtube', 'facebook'] },
    accountId: String,
    accountName: String,
    accessToken: String,
    refreshToken: String,
    expiry: Date,
    thumbnail: String,
    metadata: mongoose.Schema.Types.Mixed
  }]
}, { timestamps: true });

userSchema.index({ locationData: "2dsphere" }, { sparse: true });

const User = mongoose.model("User", userSchema);

export default User;