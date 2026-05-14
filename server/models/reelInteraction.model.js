import mongoose from 'mongoose';

const reelInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['view', 'like', 'share', 'complete', 'replay'],
    required: true
  },
  watchTime: {
    type: Number, // in seconds
    default: 0
  },
  completionRate: {
    type: Number, // percentage 0-100
    default: 0
  }
}, { timestamps: true });

// Prevent duplicate likes
reelInteractionSchema.index({ userId: 1, reelId: 1, type: 1 }, { 
  unique: true, 
  partialFilterExpression: { type: 'like' } 
});

const ReelInteraction = mongoose.model('ReelInteraction', reelInteractionSchema);

export default ReelInteraction;
