import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: { type: String },
    phone: { type: String },
    emailOtp: { type: String },
    phoneOtp: { type: String },
    createdAt: { type: Date, expires: 600, default: Date.now } // Increased to 10 minutes
});

// Index to find by email OR phone
otpSchema.index({ email: 1 });
otpSchema.index({ phone: 1 });

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
