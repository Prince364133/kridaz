import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
    turf:{ type:mongoose.Schema.Types.ObjectId, ref:'Turf'},
    startTime: {type:Date, required:true},
    endTime: {type:Date, required:true},
    price: { type: Number }, // Individual slot pricing
 }, { timestamps: true });

// ── Performance indexes ───────────────────────────────────────────────────────
// NOTE: schema has no 'date' or 'isBooked' fields; indexing actual query fields instead
timeSlotSchema.index({ turf: 1, startTime: 1, endTime: 1 });

export default mongoose.model("TimeSlot", timeSlotSchema);