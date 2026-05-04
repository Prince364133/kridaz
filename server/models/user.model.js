import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique: true},
    password:{type:String},
    googleId:{type:String},
    phone:{type:String},
    gender:{type:String, enum:["Male", "Female", "Other", "Prefer not to say"]},
    location:{type:String},
    city: { type: String },
    state: { type: String },
    locationData: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" }, // [longitude, latitude]
    },
    sportTypes: [{ type: String }],
    profilePicture:{type:String},
    bookings:[{type:mongoose.Schema.Types.ObjectId, ref:'Booking'}],
 }, {timestamps: true});

userSchema.index({ locationData: "2dsphere" });

const User = mongoose.model("User", userSchema);

export default User;