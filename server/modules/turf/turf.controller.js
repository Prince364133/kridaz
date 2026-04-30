import mongoose from "mongoose";
import chalk from "chalk";
import Turf from "../../models/turf.model.js";
import TimeSlot from "../../models/timeSlot.model.js";
import Booking from "../../models/booking.model.js";
import Review from "../../models/review.model.js";
import cloudinary from "../../utils/cloudinary.js";
import { startOfDay } from "date-fns";
import { getTurfWithAvgRating } from "./turf.service.js";

// --- USER OPERATIONS ---

export const getAllTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({});
    const turfsWithRating = await Promise.all(turfs.map(getTurfWithAvgRating));
    return res.status(200).json({ turfs: turfsWithRating });
  } catch (err) {
    console.log(chalk.red("Error in getAllTurfs"), err);
    return res.status(500).json({ message: err.message });
  }
};

export const getTurfById = async (req, res) => {
  const { id } = req.params;
  try {
    const turf = await Turf.findById(id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }
    const turfWithRating = await getTurfWithAvgRating(turf);
    return res.status(200).json({ turf: turfWithRating });
  } catch (error) {
    console.log(chalk.red("Error in getTurfById"), error);
    return res.status(500).json({ message: error.message });
  }
};

export const getTimeSlotByTurfId = async (req, res) => {
  const { date, turfId } = req.query;
  if (!date || !turfId) {
    return res.status(400).json({ message: "Date and turfId are required" });
  }

  try {
    const selectedDate = new Date(date);
    const startOfSelectedDate = startOfDay(selectedDate);
    const endOfSelectedDate = new Date(startOfSelectedDate);
    endOfSelectedDate.setDate(endOfSelectedDate.getDate() + 1);

    const query = {
      turf: turfId,
      startTime: { $gte: startOfSelectedDate },
      endTime: { $lt: endOfSelectedDate },
    };

    const bookedTime = await TimeSlot.find(query);
    const turfDetails = await Turf.findById(turfId).select([
      "openTime",
      "closeTime",
      "pricePerHour",
    ]);
    return res.status(200).json({ timeSlots: turfDetails, bookedTime });
  } catch (error) {
    console.log(chalk.red("Error in getTimeSlotByTurfId"), error);
    return res.status(500).json({ message: error.message });
  }
};

// --- OWNER OPERATIONS ---

export const turfRegister = async (req, res) => {
  const owner = req.owner.id;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "At least one turf image is required" });
  }
  try {
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "BookMySportz/turfs" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    const turf = new Turf({
      image: imageUrls[0], 
      images: imageUrls,    
      owner,
      ...req.body,
    });
    await turf.save();
    return res.status(201).json({ success: true, message: "Turf created successfully" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTurfByOwner = async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const turfs = await Turf.find({ owner: ownerId });
    const turfsWithRating = await Promise.all(turfs.map(getTurfWithAvgRating));
    return res.status(200).json(turfsWithRating);
  } catch (err) {
    console.error("Error getting turfs by ownerId", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const editTurfById = async (req, res) => {
  const owner = req.owner.id;
  const { id } = req.params;
  const { sportTypes, groundTypes, facilities, sportsType, ...otherDetails } = req.body;
  
  const updatedTurfData = { ...otherDetails };

  if (sportTypes) {
    updatedTurfData.sportTypes = Array.isArray(sportTypes) ? sportTypes : [sportTypes];
    if (sportsType && !updatedTurfData.sportTypes.includes(sportsType)) {
      updatedTurfData.sportTypes.push(sportsType);
    }
  } else if (sportsType) {
    updatedTurfData.sportTypes = [sportsType];
  }

  if (groundTypes) {
    updatedTurfData.groundTypes = Array.isArray(groundTypes) ? groundTypes : [groundTypes];
  }

  if (facilities) {
    updatedTurfData.facilities = Array.isArray(facilities) ? facilities : [facilities];
  }

  try {
    const turf = await Turf.findOne({ owner, _id: id });
    if (!turf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }

    const updatedTurf = await Turf.findOneAndUpdate({ owner, _id: id }, updatedTurfData, { new: true });
    const allTurfs = await Turf.find({ owner });
    return res.status(200).json({ success: true, message: "Turf updated successfully", allTurfs });
  } catch (err) {
    console.error("Error updating turf:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTurfDetailsWithSlots = async (req, res) => {
  const ownerId = req.owner.id;
  const { id } = req.params;

  try {
    const turf = await Turf.findById(id);
    if (!turf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }

    const timeSlots = await TimeSlot.find({ turf: id }).sort({ startTime: 1 });
    const bookings = await Booking.find({ turf: id })
      .populate("user", "name email phoneNumber profileImage")
      .populate("timeSlot");

    const slotsWithBookings = timeSlots.map(slot => {
      const booking = bookings.find(b => b.timeSlot && b.timeSlot._id.toString() === slot._id.toString());
      return {
        ...slot.toObject(),
        isBooked: !!booking,
        bookingDetails: booking ? {
          user: booking.user,
          totalPrice: booking.totalPrice,
          bookedAt: booking.createdAt
        } : null
      };
    });

    return res.status(200).json({ success: true, turf, slots: slotsWithBookings });
  } catch (err) {
    console.error("Error getting turf details with slots:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- ADMIN OPERATIONS ---

export const adminGetAllTurfs = async (req, res) => {
  if (req.admin.role !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const turfs = await Turf.find().lean();
    const turfsWithRating = await Promise.all(turfs.map(getTurfWithAvgRating));
    return res.status(200).json({ turfs: turfsWithRating });
  } catch (error) {
    console.error("Error in adminGetAllTurfs: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
