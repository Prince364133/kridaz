import mongoose from "mongoose";
import chalk from "chalk";
import Turf from "../../models/turf.model.js";
import TimeSlot from "../../models/timeSlot.model.js";
import Booking from "../../models/booking.model.js";
import Review from "../../models/review.model.js";
import cloudinary from "../../utils/cloudinary.js";
import { startOfDay, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { getTurfWithAvgRating } from "./turf.service.js";

// --- HELPERS ---
const checkTurfExpiry = async (turf) => {
  if (turf.slotsConfigDuration === "Fixed Weeks" && turf.slotsConfigExpiry && new Date() > turf.slotsConfigExpiry) {
    if (!turf.slotsNeedsUpdate) {
      turf.slotsNeedsUpdate = true;
      await turf.save();
    }
  }
  return turf;
};

// --- USER OPERATIONS ---

export const getAllTurfs = async (req, res) => {
  const { searchTerm, city, state, lat, lng, radius } = req.query;
  try {
    let pipeline = [];
    const isVal = (v) => v && v !== "" && v !== "null" && v !== "undefined" && v !== "Select";

    // 1. Proximity Search (Must be first if using $geoNear)
    if (lat && lng) {
      const geoNearStage = {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          spherical: true,
          query: { status: "approved", isActive: true }
        }
      };

      // Add city/state filters into the geoNear query if present and valid
      if (isVal(city)) geoNearStage.$geoNear.query.city = { $regex: new RegExp(`^${city}$`, "i") };
      if (isVal(state)) geoNearStage.$geoNear.query.state = { $regex: new RegExp(`^${state}$`, "i") };
      if (isVal(searchTerm) && searchTerm !== "All") {
        geoNearStage.$geoNear.query.$or = [
          { name: { $regex: searchTerm, $options: "i" } },
          { sportTypes: { $regex: searchTerm, $options: "i" } }
        ];
      }

      pipeline.push(geoNearStage);
    } else {
      // No location provided - normal filtering
      let matchQuery = { status: "approved", isActive: true };
      if (isVal(city)) matchQuery.city = { $regex: new RegExp(`^${city}$`, "i") };
      if (isVal(state)) matchQuery.state = { $regex: new RegExp(`^${state}$`, "i") };
      if (isVal(searchTerm) && searchTerm !== "All") {
        matchQuery.$or = [
          { name: { $regex: searchTerm, $options: "i" } },
          { sportTypes: { $regex: searchTerm, $options: "i" } }
        ];
      }
      pipeline.push({ $match: matchQuery });
    }

    // 4. Rating Calculation
    pipeline.push({
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "turf",
        as: "reviews"
      }
    }, {
      $addFields: {
        avgRating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] }
      }
    }, {
      $project: { reviews: 0 }
    });

    const turfs = await Turf.aggregate(pipeline);
    
    // Check for expiry on each turf
    const processedTurfs = await Promise.all(turfs.map(async (t) => {
      const turfDoc = await Turf.findById(t._id);
      if (turfDoc) await checkTurfExpiry(turfDoc);
      return { ...t, slotsNeedsUpdate: turfDoc ? turfDoc.slotsNeedsUpdate : t.slotsNeedsUpdate };
    }));

    return res.status(200).json({ turfs: processedTurfs });
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
    
    await checkTurfExpiry(turf);
    
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
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
    // Parse date and set to start/end of day in the target timezone
    const selectedDate = parseISO(date);
    const startOfSelectedDate = fromZonedTime(startOfDay(selectedDate), timeZone);
    const endOfSelectedDate = new Date(startOfSelectedDate);
    endOfSelectedDate.setDate(endOfSelectedDate.getDate() + 1);

    const query = {
      turf: turfId,
      startTime: { $gte: startOfSelectedDate },
      endTime: { $lte: endOfSelectedDate },
    };

    const bookedTime = await TimeSlot.find(query);
    const turfDetails = await Turf.findById(turfId).select([
      "openTime",
      "closeTime",
      "pricePerHour",
      "generatedSlots",
      "availableDays",
      "offDays",
      "slotsNeedsUpdate",
      "slotsConfigDuration",
      "slotsConfigExpiry"
    ]);

    if (!turfDetails) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Run expiry check just in case
    await checkTurfExpiry(turfDetails);

    // If configuration needs update (current date > expiry), block all slots
    if (turfDetails.slotsNeedsUpdate) {
      return res.status(200).json({ 
        timeSlots: { ...turfDetails.toObject(), generatedSlots: [] }, 
        bookedTime: [],
        message: "This venue's configuration has expired and needs a review by the owner."
      });
    }

    // NEW: Check if the SELECTED DATE is beyond the configuration expiry
    if (turfDetails.slotsConfigDuration === "Fixed Weeks" && turfDetails.slotsConfigExpiry && startOfSelectedDate > turfDetails.slotsConfigExpiry) {
      return res.status(200).json({ 
        timeSlots: { ...turfDetails.toObject(), generatedSlots: [] }, 
        bookedTime: [],
        message: "Reservations for this date are not yet open. The venue configuration only covers the upcoming weeks."
      });
    }

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

    const { 
      availableDays, 
      offDays, 
      generatedSlots, 
      slotDuration, 
      breakTime, 
      city, 
      state, 
      latitude, 
      longitude,
      managerContacts,
      slotsConfigDuration,
      slotsConfigWeeks,
      ...otherData 
    } = req.body;

    let configExpiry = null;
    if (slotsConfigDuration === "Fixed Weeks" && slotsConfigWeeks) {
      configExpiry = new Date();
      configExpiry.setDate(configExpiry.getDate() + (Number(slotsConfigWeeks) * 7));
    }

    const turf = new Turf({
      image: imageUrls[0], 
      images: imageUrls,    
      owner,
      status: "pending",
      ...otherData,
      city,
      state,
      locationData: latitude && longitude ? {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      } : undefined,
      slotDuration: Number(slotDuration) || 60,
      breakTime: Number(breakTime) || 0,
      availableDays: Array.isArray(availableDays) ? availableDays : (availableDays ? [availableDays] : []),
      offDays: Array.isArray(offDays) ? offDays : (offDays ? [offDays] : []),
      generatedSlots: generatedSlots ? JSON.parse(generatedSlots) : [],
      managerContacts: managerContacts ? JSON.parse(managerContacts) : [],
      slotsConfigDuration: slotsConfigDuration || "Until Changed",
      slotsConfigWeeks: Number(slotsConfigWeeks) || 1,
      slotsConfigExpiry: configExpiry,
      slotsNeedsUpdate: false
    });
    await turf.save();
    return res.status(201).json({ success: true, message: "Turf registered and sent for admin approval" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTurfByOwner = async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const turfs = await Turf.find({ owner: ownerId });
    
    // Check for expiry on each turf
    await Promise.all(turfs.map(t => checkTurfExpiry(t)));
    
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

  if (req.body.availableDays) {
    updatedTurfData.availableDays = Array.isArray(req.body.availableDays) ? req.body.availableDays : [req.body.availableDays];
  }

  if (req.body.offDays) {
    updatedTurfData.offDays = Array.isArray(req.body.offDays) ? req.body.offDays : [req.body.offDays];
  }

  if (req.body.generatedSlots) {
    updatedTurfData.generatedSlots = JSON.parse(req.body.generatedSlots);
  }

  if (req.body.managerContacts) {
    updatedTurfData.managerContacts = JSON.parse(req.body.managerContacts);
  }

  if (req.body.slotDuration) updatedTurfData.slotDuration = Number(req.body.slotDuration);
  if (req.body.breakTime !== undefined) updatedTurfData.breakTime = Number(req.body.breakTime);

  if (req.body.city) updatedTurfData.city = req.body.city;
  if (req.body.state) updatedTurfData.state = req.body.state;
  if (req.body.latitude && req.body.longitude) {
    updatedTurfData.locationData = {
      type: "Point",
      coordinates: [Number(req.body.longitude), Number(req.body.latitude)]
    };
  }

  if (req.body.slotsConfigDuration) updatedTurfData.slotsConfigDuration = req.body.slotsConfigDuration;
  if (req.body.slotsConfigWeeks) updatedTurfData.slotsConfigWeeks = Number(req.body.slotsConfigWeeks);
  
  if (req.body.slotsConfigDuration === "Fixed Weeks" && req.body.slotsConfigWeeks) {
    const configExpiry = new Date();
    configExpiry.setDate(configExpiry.getDate() + (Number(req.body.slotsConfigWeeks) * 7));
    updatedTurfData.slotsConfigExpiry = configExpiry;
  } else if (req.body.slotsConfigDuration === "Until Changed") {
    updatedTurfData.slotsConfigExpiry = null;
  }
  
  // Reset the update flag since the owner is explicitly updating now
  updatedTurfData.slotsNeedsUpdate = false;

  try {
    const turf = await Turf.findOne({ owner, _id: id });
    if (!turf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }

    // Handle Image Uploads if provided
    if (req.files && req.files.length > 0) {
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
      updatedTurfData.image = imageUrls[0];
      updatedTurfData.images = imageUrls;
    }

    // Instead of overwriting live data immediately, store changes in pendingUpdates
    // if the turf is already approved. If it's still pending/rejected, we can overwrite.
    if (turf.status === "approved") {
      turf.pendingUpdates = updatedTurfData;
      turf.status = "pending"; // Set back to pending for review
      await turf.save();
    } else {
      // Overwrite main fields if not yet approved
      Object.assign(turf, updatedTurfData);
      turf.status = "pending";
      await turf.save();
    }

    const allTurfs = await Turf.find({ owner });
    return res.status(200).json({ success: true, message: "Changes saved and sent for admin review", allTurfs });
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
      
      let userDetails = null;
      if (booking) {
        if (booking.user) {
          userDetails = booking.user;
        } else if (booking.guestDetails) {
          userDetails = {
            name: booking.guestDetails.name,
            email: booking.guestDetails.email,
            phoneNumber: booking.guestDetails.phone,
            profileImage: null,
            isGuest: true
          };
        }
      }

      return {
        ...slot.toObject(),
        isBooked: !!booking,
        bookingDetails: booking ? {
          user: userDetails,
          totalPrice: booking.totalPrice,
          bookedAt: booking.createdAt,
          bookingSource: booking.bookingSource
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

export const adminApproveTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation } = req.body;
  try {
    const turf = await Turf.findById(id);
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });

    // Record verification metadata
    turf.verificationData = {
      adminName: name,
      adminDesignation: designation,
      verifiedAt: new Date(),
      action: "approved"
    };

    // Merge pending updates if any (from sunny branch logic)
    if (turf.pendingUpdates && turf.pendingUpdates.size > 0) {
      const updates = Object.fromEntries(turf.pendingUpdates);
      Object.assign(turf, updates);
      turf.pendingUpdates = {}; // Clear pending updates
    }

    turf.status = "approved";
    await turf.save();

    return res.status(200).json({ success: true, message: "Turf approved and changes merged", turf });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminRejectTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation } = req.body;
  try {
    const turf = await Turf.findByIdAndUpdate(id, { 
      status: "rejected",
      verificationData: {
        adminName: name,
        adminDesignation: designation,
        verifiedAt: new Date(),
        action: "rejected"
      }
    }, { new: true });
    return res.status(200).json({ success: true, message: "Turf rejected", turf });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleTurfVisibility = async (req, res) => {
  const owner = req.owner.id;
  const { id } = req.params;
  try {
    const turf = await Turf.findOne({ owner, _id: id });
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });
    
    turf.isActive = !turf.isActive;
    await turf.save();
    
    return res.status(200).json({ 
      success: true, 
      message: `Turf listing ${turf.isActive ? 'enabled' : 'disabled'}`,
      isActive: turf.isActive 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTurf = async (req, res) => {
  const owner = req.owner.id;
  const { id } = req.params;
  try {
    const turf = await Turf.findOneAndDelete({ owner, _id: id });
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found or unauthorized" });
    
    // Also delete all associated data
    await TimeSlot.deleteMany({ turf: id });
    await Booking.deleteMany({ turf: id });
    await Review.deleteMany({ turf: id });
    
    return res.status(200).json({ success: true, message: "Arena decommissioned successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
