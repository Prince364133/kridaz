import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    locationData: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" }, // [longitude, latitude]
    },
    image: { type: String, required: true },
    images: [{ type: String }],
    sportTypes: [{ type: String, required: true }],
    groundTypes: [{ type: String }],
    facilities: [{ type: String }],
    youtubeUrl: { type: String },
    pricePerHour: { type: Number, required: true },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    slotDuration: {
      type: Number,
      default: 60, // in minutes
    },
    breakTime: {
      type: Number,
      default: 0, // in minutes
    },
    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    offDays: {
      type: [String],
      default: [],
    },
    generatedSlots: [
      {
        startTime: String,
        endTime: String,
        isActive: { type: Boolean, default: true },
      }
    ],
  },
  { timestamps: true }
);

// The index is already defined on the coordinates field above.

const Turf = mongoose.model("Turf", turfSchema, "turves");

export default Turf;
