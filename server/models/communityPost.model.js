import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'authorModel'
  },
  authorModel: {
    type: String,
    required: true,
    enum: ['User', 'Owner'],
    default: 'User'
  },
  title: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'text'],
    default: 'image'
  },
  mediaUrl: {
    type: String
  },
  hlsUrl: {
    type: String
  },
  placeholder: {
    type: String // Base64 tiny thumbnail
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userImage: String,
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['pending', 'ready', 'failed'],
    default: 'ready'
  }
}, { timestamps: true });

// ── Performance indexes ───────────────────────────────────────────────────────
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ adminId: 1, createdAt: -1 });

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);

export default CommunityPost;
