import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
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
  },
  { timestamps: true }
);

const Turf = mongoose.model("Turf", turfSchema, "turves");

export default Turf;
