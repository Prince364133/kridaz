import { validationResult } from "express-validator";
import cloudinary from "../../utils/cloudinary.js";
import Turf from "../../models/turf.model.js";
import chalk from "chalk";
import Review from "../../models/review.model.js"

export const turfRegister = async (req, res) => {
  const owner = req.owner.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array() });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Turf image is required" });
  }
  try {
    // Upload the turf image buffer directly to Cloudinary (no temp file on disk)
    const turfImage = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "BookMySportz/turfs" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });
    const turf = new Turf({
      image: turfImage.secure_url,
      owner,
      ...req.body,
    });
    await turf.save();
    return res
      .status(201)
      .json({ success: true, message: "Turf created successfully" });
  } catch (err) {
    console.error(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};

// get all turfs by owner id

export const getTurfByOwner = async (req, res) => {
  const ownerId = req.owner.id;

  try {
    const turfs = await Turf.find({ owner: ownerId });

    // get all reviews by turf id of owner
    const turfsWithAvgRating = await Promise.all(
      turfs.map(async (turf) => {
        const reviewCount = turf.reviews.length;
        const avgRating =
          reviewCount > 0
            ? await Review.aggregate([
                { $match: { turf: turf._id } },
                { $group: { _id: null, avgRating: { $avg: "$rating" } } },
              ])
            : 0;
        return {
          ...turf.toObject(),
          avgRating: avgRating[0] ? avgRating[0].avgRating : 0,
        };
      })
    );
 
    return res.status(200).json(turfsWithAvgRating);
  } catch (err) {
    console.error("Error getting turfs by ownerId", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  edit turf by id

export const editTurfById = async (req, res) => {
  const owner = req.owner.id;

  const { id } = req.params;
  const { sportTypes, sportsType, ...otherDetails } = req.body;
  const updatedSportTypes = Array.isArray(sportTypes) ? [...sportTypes] : [];
  if (sportsType) {
    updatedSportTypes.push(sportsType);
  }

  const updatedTurfData = {
    ...otherDetails,
    sportTypes: updatedSportTypes,
  };

  try {
    const updatedTurf = await Turf.findOne({ owner: owner, _id: id });
    if (!updatedTurf) {
      return res
        .status(404)
        .json({ success: false, message: "Turf not found" });
    }

    await Turf.findOneAndUpdate({ owner: owner, _id: id }, updatedTurfData, {
      new: true,
    });
    const allTurfs = await Turf.find({ owner: owner });
    return res
      .status(200)
      .json({ success: true, message: "Turf updated successfully", allTurfs });
  } catch (err) {
    console.error("Error updating turf:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
