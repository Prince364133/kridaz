import Review from "../../models/review.model.js";
import Turf from "../../models/turf.model.js";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";

export const addReview = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { id } = req.params;
  const { rating, review: comment } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({ message: "Please provide all the required fields" });
  }

  try {
    const [user, turf] = await Promise.all([
      User.findById(userId).then(u => u || Owner.findById(userId)),
      Turf.findById(id),
    ]);

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    const review = new Review({
      user: userId,
      turf: id,
      rating,
      comment,
    });

    turf.reviews.push(review._id);
    
    await Promise.all([turf.save(), review.save()]);
    return res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error in addReview", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const viewReviewsByTurf = async (req, res) => {
  const { id } = req.params; // turf id
  try {
    const reviews = await Review.find({ turf: id })
      .sort({ createdAt: -1 })
      .populate("user", "name profilePicture _id");
      
    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

    return res.status(200).json({
      message: "Reviews retrieved successfully",
      reviews,
      averageRating,
    });
  } catch (error) {
    console.error("Error in viewReviewsByTurf", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOwnerTurfReviews = async (req, res) => {
  const ownerId = req.owner.id;

  try {
    const turfs = await Turf.find({ 
      $or: [
        { owner: req.owner.ownerId },
        { owner: req.owner.id }
      ]
    })
      .select("name reviews")
      .lean();

    const turfIds = turfs.map((turf) => turf._id);
    const reviews = await Review.find({ turf: { $in: turfIds } })
      .populate("user", "name profilePicture _id")
      .lean();

    const turfsWithReviews = turfs.map((turf) => {
      const turfReviews = reviews.filter((review) =>
        review.turf.equals(turf._id)
      );
      const avgRating =
        turfReviews.reduce((sum, review) => sum + review.rating, 0) /
        (turfReviews.length || 1);

      return {
        id: turf._id,
        name: turf.name,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviews: turfReviews.map((review) => ({
          id: review._id,
          user: review.user,
          userName: review.user ? review.user.name : "Anonymous Player",
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        })),
      };
    });

    return res.status(200).json(turfsWithReviews);
  } catch (error) {
    console.error("Error in getOwnerTurfReviews", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
