import mongoose from 'mongoose';

const reelCommentSchema = new mongoose.Schema({
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
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReelComment',
    default: null
  }
}, { timestamps: true });

const ReelComment = mongoose.model('ReelComment', reelCommentSchema);

export default ReelComment;
