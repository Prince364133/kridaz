import Turf from "../../models/turf.model.js";
import Review from "../../models/review.model.js";

export const calculateAvgRating = async (turfId) => {
  const reviews = await Review.find({ turf: turfId });
  if (reviews.length === 0) return 0;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Number((totalRating / reviews.length).toFixed(1));
};

export const getTurfWithAvgRating = async (turf) => {
  const avgRating = await calculateAvgRating(turf._id);
  return {
    ...turf.toObject ? turf.toObject() : turf,
    avgRating,
  };
};
