import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    locationData: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }, // [longitude, latitude]
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
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    managerContacts: [
      {
        name: { type: String },
        phone: { type: String },
      }
    ],
    mapUrl: { type: String },
  },
  { timestamps: true }
);

turfSchema.index({ locationData: "2dsphere" }, { sparse: true });

// The index is already defined on the coordinates field above.

// Slugify helper
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
};

// Pre-save hook to generate slug
turfSchema.pre("save", async function (next) {
  if (this.isModified("name") || !this.slug) {
    let baseSlug = slugify(this.name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure uniqueness
    while (await mongoose.models.Turf.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
  next();
});

const Turf = mongoose.model("Turf", turfSchema, "turves");

export default Turf;
