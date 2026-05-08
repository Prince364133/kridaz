import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
    turf:{type:mongoose.Schema.Types.ObjectId, ref:'Turf'},
    professional:{type:mongoose.Schema.Types.ObjectId, ref:'Owner'},
    rating:{type:Number, required:true},
    comment:{type:String, required:true},
    reply: { type: String },
    replyDate: { type: Date },
}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);