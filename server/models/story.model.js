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
  content: {
    type: String
  },
  mediaType: {
    type: String,
    enum: ['image', 'text'],
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
  }
}, { timestamps: true });

// TTL index removed to make stories permanent
// storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model('Story', storySchema);

export default Story;
