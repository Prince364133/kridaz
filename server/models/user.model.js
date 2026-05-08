import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    username: { type: String, unique: true, sparse: true },
    email:{type:String, required:true, unique: true},
    password:{type:String},
    googleId:{type:String},
    phone:{type:String},
    gender:{type:String, enum:["Male", "Female", "Other", "Prefer not to say"]},
    location:{type:String},
    city: { type: String },
    state: { type: String },
    locationData: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }, // [longitude, latitude]
    },
    sportTypes: [{ type: String }],
    profilePicture:{type:String},
    bio: { type: String },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookingCount: { type: Number, default: 0 },
    interests: [{ type: String }],
    bookings:[{type:mongoose.Schema.Types.ObjectId, ref:'Booking'}],
    walletBalance: { type: Number, default: 0 },
    reservedBalance: { type: Number, default: 0 },
 }, {timestamps: true});

userSchema.index({ locationData: "2dsphere" }, { sparse: true });

const User = mongoose.model("User", userSchema);

export default User;