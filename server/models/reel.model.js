import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 2200
  },
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  rawVideoUrl: {
    type: String
  },
  hlsUrl: {
    type: String // Master playlist .m3u8
  },
  thumbnailUrl: {
    type: String
  },
  aspectRatio: {
    type: Number,
    default: 0.5625 // 9:16
  },
  duration: {
    type: Number // in seconds
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'failed'],
    default: 'pending',
    index: true
  },
  processingError: {
    type: String
  },
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    avgWatchTime: { type: Number, default: 0 },
    completionCount: { type: Number, default: 0 }
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Performance indexes
reelSchema.index({ createdAt: -1 });
reelSchema.index({ status: 1, createdAt: -1 });

const Reel = mongoose.model('Reel', reelSchema);

export default Reel;
