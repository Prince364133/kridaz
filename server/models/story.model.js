import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Owner'],
    default: 'User'
  },
  mediaUrl: {
    type: String,
  },
  hlsUrl: {
    type: String,
  },
  placeholder: {
    type: String, // Base64 tiny thumbnail for instant feed
  },
  rawMediaUrl: {
    type: String, // Temporary raw file link
  },
  content: {
    type: String
  },
  mediaType: {
    type: String,
    enum: ['image', 'text', 'video'],
    default: 'image'
  },
  durationDays: {
    type: Number,
    default: 1,
    min: 1,
    max: 7
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'ready', 'failed'],
    default: 'ready'
  }
}, { timestamps: true });

// ── Performance indexes ───────────────────────────────────────────────────────
// TTL: auto-delete stories when expiresAt is reached (no cleanup job needed)
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model('Story', storySchema);

export default Story;
