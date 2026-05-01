import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, expires: 300, default: Date.now } // Expires in 5 minutes (300 seconds)
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
