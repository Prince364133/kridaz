import mongoose from "mongoose";
import Owner from "../../models/owner.model.js";
import User from "../../models/user.model.js";
import ProfessionalAvailability from "../../models/professionalAvailability.model.js";
import ProfessionalBooking from "../../models/professionalBooking.model.js";
import Review from "../../models/review.model.js";
import WalletTransaction from "../../models/walletTransaction.model.js";
import chalk from "chalk";

// --- USER OPERATIONS ---

// Get all professionals with filters
export const getAllProfessionals = async (req, res) => {
  const { role, sport, city, searchTerm } = req.query;
  try {
    let query = { 
      role: { $in: ["coach", "umpire"] }
    };

    if (role && role !== "All") query.role = role.toLowerCase();
    if (sport && sport !== "All") query.gameTypes = { $regex: sport, $options: "i" };
    if (city) query.city = { $regex: city, $options: "i" };
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { "businessDetails.specialization": { $regex: searchTerm, $options: "i" } }
      ];
    }

    const professionals = await Owner.find(query)
      .select("-password -googleId")
      .sort({ rating: -1 });

    return res.status(200).json({ professionals });
  } catch (error) {
    console.error(chalk.red("Error in getAllProfessionals:"), error);
    return res.status(500).json({ message: error.message });
  }
};

// Get professional by ID with availability and reviews
export const getProfessionalById = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query; // Optional date for availability
  try {
    const professional = await Owner.findById(id).select("-password -googleId");
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    // Fetch availability for the specific date
    let availability = null;
    if (date) {
      availability = await ProfessionalAvailability.findOne({ professionalId: id, date });
    }

    // Fetch reviews
    const reviews = await Review.find({ professional: id })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({ professional, availability, reviews });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Book a professional (Reserve Coins)
export const bookProfessional = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { professionalId, date, slots, totalAmount, bookingType, message } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const professional = await Owner.findById(professionalId);
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    if (user.walletBalance < totalAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // 1. Reserve balance in user model
        await User.findByIdAndUpdate(userId, {
          $inc: { reservedBalance: totalAmount }
        }, { session });

        // 2. Create a pending booking
        const booking = await ProfessionalBooking.create([{
          user: userId,
          professional: professionalId,
          date,
          slots,
          totalAmount,
          bookingType,
          message,
          status: "PENDING"
        }], { session });

        // 3. Mark slots as pending/unavailable in availability
        await ProfessionalAvailability.findOneAndUpdate(
          { professionalId, date },
          { 
            $set: { 
              "slots.$[elem].isAvailable": false,
              "slots.$[elem].bookedBy": userId,
              "slots.$[elem].bookingId": booking[0]._id
            } 
          },
          { 
            arrayFilters: [{ "elem.startTime": { $in: slots.map(s => s.startTime) } }],
            session 
          }
        );
      });
      return res.status(201).json({ message: "Booking request sent successfully. Coins reserved." });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error(chalk.red("Error in bookProfessional:"), error);
    return res.status(500).json({ message: error.message });
  }
};

// --- PROFESSIONAL OPERATIONS ---

// Update availability (Set slots)
export const updateAvailability = async (req, res) => {
  const professionalId = req.user.id || req.user.user;
  const { date, slots } = req.body;

  try {
    const availability = await ProfessionalAvailability.findOneAndUpdate(
      { professionalId, date },
      { slots },
      { upsert: true, new: true }
    );
    return res.status(200).json({ message: "Availability updated", availability });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get professional bookings (Requests)
export const getMyBookings = async (req, res) => {
  const professionalId = req.user.id || req.user.user;
  try {
    const bookings = await ProfessionalBooking.find({ professional: professionalId })
      .populate("user", "name phone email profilePicture")
      .sort({ createdAt: -1 });
    return res.status(200).json({ bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Handle booking request (Accept/Reject)
export const handleBookingRequest = async (req, res) => {
  const professionalId = req.user.id || req.user.user;
  const { bookingId, status, rejectionReason } = req.body;

  try {
    const booking = await ProfessionalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.professional.toString() !== professionalId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (status === "ACCEPTED") {
          // 1. Deduct coins from user
          await User.findByIdAndUpdate(booking.user, {
            $inc: { 
              walletBalance: -booking.totalAmount,
              reservedBalance: -booking.totalAmount
            }
          }, { session });

          // 2. Add coins to professional
          await Owner.findByIdAndUpdate(professionalId, {
            $inc: { walletBalance: booking.totalAmount }
          }, { session });

          // 3. Create wallet transactions
          await WalletTransaction.insertMany([
            {
              user: booking.user,
              amount: booking.totalAmount,
              type: "DEBIT",
              status: "SUCCESS",
              description: `Paid for ${booking.bookingType} session with professional`
            },
            {
              user: professionalId,
              amount: booking.totalAmount,
              type: "CREDIT",
              status: "SUCCESS",
              description: `Earnings from ${booking.bookingType} session`
            }
          ], { session });

          booking.status = "ACCEPTED";
        } else if (status === "REJECTED") {
          // 1. Release reserved balance for user
          await User.findByIdAndUpdate(booking.user, {
            $inc: { reservedBalance: -booking.totalAmount }
          }, { session });

          // 2. Make slots available again
          await ProfessionalAvailability.findOneAndUpdate(
            { professionalId: booking.professional, date: booking.date },
            { 
              $set: { 
                "slots.$[elem].isAvailable": true,
                "slots.$[elem].bookedBy": null,
                "slots.$[elem].bookingId": null
              } 
            },
            { 
              arrayFilters: [{ "elem.startTime": { $in: booking.slots.map(s => s.startTime) } }],
              session 
            }
          );

          booking.status = "REJECTED";
          booking.rejectionReason = rejectionReason;
        }

        await booking.save({ session });
      });
      return res.status(200).json({ message: `Booking ${status.toLowerCase()} successfully` });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error(chalk.red("Error in handleBookingRequest:"), error);
    return res.status(500).json({ message: error.message });
  }
};

// --- REVIEW OPERATIONS ---

export const addProfessionalReview = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { professionalId, rating, comment } = req.body;
  try {
    const review = await Review.create({
      user: userId,
      professional: professionalId,
      rating,
      comment
    });

    // Update professional rating
    const professional = await Owner.findById(professionalId);
    const totalRating = (professional.rating * professional.numReviews) + rating;
    professional.numReviews += 1;
    professional.rating = totalRating / professional.numReviews;
    await professional.save();

    return res.status(201).json({ message: "Review added", review });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const replyToReview = async (req, res) => {
  const professionalId = req.user.id || req.user.user;
  const { reviewId, reply } = req.body;
  try {
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.professional.toString() !== professionalId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    review.reply = reply;
    review.replyDate = new Date();
    await review.save();

    return res.status(200).json({ message: "Reply added", review });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfessionalProfile = async (req, res) => {
  const professionalId = req.user.id || req.user.user;
  const { 
    name, bio, hourlyPrice, gameTypes, city, state, 
    specialization, experience, certifications 
  } = req.body;

  try {
    const professional = await Owner.findByIdAndUpdate(
      professionalId,
      {
        name,
        price: hourlyPrice,
        gameTypes,
        city,
        state,
        "businessDetails.specialization": specialization,
        "businessDetails.experience": experience,
        certifications
      },
      { new: true }
    );

    if (!professional) return res.status(404).json({ message: "Professional not found" });

    return res.status(200).json({ message: "Profile updated successfully", professional });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

