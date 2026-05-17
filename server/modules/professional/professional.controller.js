import { prisma } from "../../config/prisma.js";

import WalletService from "../../services/wallet.service.js";
import logger from "../../utils/logger.js";

// --- USER OPERATIONS ---

// Get all professionals with filters
export const getAllProfessionals = async (req, res) => {
  const { role, sport, city, state, searchTerm } = req.query;
  try {
    let where = {
      role: { in: ["coach", "umpire", "scorer", "streamer"] }
    };

    if (role && role !== "All") where.role = role.toLowerCase();
    
    if (city && city !== "All") {
      where.city = { contains: city, mode: "insensitive" };
    }
    
    if (state && state !== "All") {
      where.state = { contains: state, mode: "insensitive" };
    }
    
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { specialization: { contains: searchTerm, mode: "insensitive" } }
      ];
    }

    if (sport && sport !== "All") {
      where.gameTypes = { contains: sport, mode: "insensitive" };
    }

    const professionals = await prisma.ownerProfile.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        city: true,
        state: true,
        image: true,
        gameTypes: true,
        specialization: true,
        experience: true,
        rating: true,
        numReviews: true,
      },
      orderBy: [
        { rating: "desc" },
        { numReviews: "desc" }
      ],
      take: 100
    });

    return res.status(200).json({ professionals });
  } catch (error) {
    logger.error("Error in getAllProfessionals:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get unique states and cities for filters
export const getProfessionalFilters = async (req, res) => {
  try {
    const roles = ["coach", "umpire", "scorer", "streamer"];
    
    const statesData = await prisma.ownerProfile.findMany({
      where: { role: { in: roles } },
      select: { state: true },
      distinct: ['state']
    });
    
    const citiesData = await prisma.ownerProfile.findMany({
      where: { role: { in: roles } },
      select: { city: true },
      distinct: ['city']
    });

    return res.status(200).json({ 
      states: statesData.map(s => s.state).filter(Boolean),
      cities: citiesData.map(c => c.city).filter(Boolean) 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get professional by ID with availability and reviews
export const getProfessionalById = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query; // Optional date for availability
  try {
    const professional = await prisma.ownerProfile.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, profilePicture: true }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!professional) return res.status(404).json({ message: "Professional not found" });

    // Fetch availability for the specific date
    let availability = null;
    if (date) {
      availability = await prisma.professionalAvailability.findFirst({
        where: { professionalId: id, date }
      });
    }

    return res.status(200).json({ 
      professional, 
      availability, 
      reviews: professional.reviews 
    });
  } catch (error) {
    logger.error("Error in getProfessionalById:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Book a professional (Reserve Coins)
export const bookProfessional = async (req, res) => {
  const userId = (req.user.id || req.user.user).toString();
  const { professionalId, date, slots, totalAmount, bookingType, message } = req.body;

  try {
    const usableBalance = await WalletService.getUsableBalance(userId, 'user');
    if (usableBalance < totalAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Reserve balance using WalletService (it uses tx internally if passed)
      await WalletService.reserve(userId, 'user', totalAmount, tx);

      // 2. Create a pending booking
      const booking = await tx.professionalBooking.create({
        data: {
          userId,
          professionalId,
          date,
          slots,
          totalAmount: parseFloat(totalAmount),
          bookingType,
          message,
          status: "PENDING"
        }
      });

      // 3. Mark slots as pending/unavailable in availability
      const availability = await tx.professionalAvailability.findUnique({
        where: { professionalId_date: { professionalId, date } }
      });

      if (availability) {
        const updatedSlots = availability.slots.map(slot => {
          if (slots.some(s => s.startTime === slot.startTime)) {
            return { ...slot, isAvailable: false, bookedBy: userId, bookingId: booking.id };
          }
          return slot;
        });

        await tx.professionalAvailability.update({
          where: { id: availability.id },
          data: { slots: updatedSlots }
        });
      }
    });

    return res.status(201).json({ message: "Booking request sent successfully. Coins reserved." });
  } catch (error) {
    logger.error("Error in bookProfessional:", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- PROFESSIONAL OPERATIONS ---

// Update availability (Set slots)
export const updateAvailability = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Only partners can set availability" });
  const { date, slots } = req.body;

  try {
    const availability = await prisma.professionalAvailability.upsert({
      where: { professionalId_date: { professionalId, date } },
      update: { slots },
      create: { professionalId, date, slots }
    });
    return res.status(200).json({ message: "Availability updated", availability });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get professional bookings (Requests)
export const getMyBookings = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Only partners can view their bookings" });
  try {
    const bookings = await prisma.professionalBooking.findMany({
      where: { professionalId },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true, profilePicture: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json({ bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Handle booking request (Accept/Reject)
export const handleBookingRequest = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });
  const { bookingId, status, rejectionReason } = req.body;

  try {
    const booking = await prisma.professionalBooking.findUnique({
      where: { id: bookingId }
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.professionalId !== professionalId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await prisma.$transaction(async (tx) => {
      if (status === "ACCEPTED") {
        // 1. Deduct coins from user (Release + Debit)
        await WalletService.release(booking.userId, 'user', booking.totalAmount, true, tx);

        // 2. Add coins to professional
        await WalletService.credit(professionalId, 'owner', booking.totalAmount, tx);

        // 3. Create wallet transactions
        await tx.walletTransaction.createMany({
          data: [
            {
              userId: booking.userId,
              amount: booking.totalAmount,
              type: "DEBIT",
              status: "SUCCESS",
              description: `Paid for ${booking.bookingType} session with professional`
            },
            {
              userId: professionalId, // This might need a different field if it's an owner, but WalletTransaction model seems to use userId
              amount: booking.totalAmount,
              type: "CREDIT",
              status: "SUCCESS",
              description: `Earnings from ${booking.bookingType} session`
            }
          ]
        });

        await tx.professionalBooking.update({
          where: { id: bookingId },
          data: { status: "ACCEPTED" }
        });
      } else if (status === "REJECTED") {
        // 1. Release reserved balance for user
        await WalletService.release(booking.userId, 'user', booking.totalAmount, false, tx);

        // 2. Make slots available again
        const availability = await tx.professionalAvailability.findUnique({
          where: { professionalId_date: { professionalId: booking.professionalId, date: booking.date } }
        });

        if (availability) {
          const updatedSlots = availability.slots.map(slot => {
            if (booking.slots.some(s => s.startTime === slot.startTime)) {
              return { ...slot, isAvailable: true, bookedBy: null, bookingId: null };
            }
            return slot;
          });

          await tx.professionalAvailability.update({
            where: { id: availability.id },
            data: { slots: updatedSlots }
          });
        }

        await tx.professionalBooking.update({
          where: { id: bookingId },
          data: { status: "REJECTED", rejectionReason }
        });
      }
    });

    return res.status(200).json({ message: `Booking ${status.toLowerCase()} successfully` });
  } catch (error) {
    logger.error("Error in handleBookingRequest:", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- REVIEW OPERATIONS ---

export const addProfessionalReview = async (req, res) => {
  const userId = (req.user.id || req.user.user).toString();
  const { professionalId, rating, comment } = req.body;
  try {
    const review = await prisma.review.create({
      data: {
        userId,
        professionalId,
        rating: parseInt(rating),
        comment
      }
    });

    // Update professional rating and numReviews
    const professional = await prisma.ownerProfile.findUnique({ where: { id: professionalId } });
    if (professional) {
      const currentRating = professional.rating || 0;
      const currentReviews = professional.numReviews || 0;
      const newNumReviews = currentReviews + 1;
      const newRating = ((currentRating * currentReviews) + rating) / newNumReviews;

      await prisma.ownerProfile.update({
        where: { id: professionalId },
        data: {
          rating: newRating,
          numReviews: newNumReviews
        }
      });
    }

    return res.status(201).json({ message: "Review added", review });
  } catch (error) {
    logger.error("Error in addProfessionalReview:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const replyToReview = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });
  const { reviewId, reply } = req.body;
  try {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.professionalId !== professionalId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply,
        replyDate: new Date()
      }
    });

    return res.status(200).json({ message: "Reply added", review: updatedReview });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfessionalProfile = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });
  const { 
    name, bio, hourlyPrice, gameTypes, city, state, 
    specialization, experience, certifications,
    gender, dob, address, pinCode, coachingLevel,
    availabilityTimings, availabilityMode, preferredLocations,
    trainingTypes, ageGroups, languages, achievements
  } = req.body;

  try {
    const updateData = {
      // In Prisma OwnerProfile, most of these are top-level fields
      bio,
      price: hourlyPrice ? parseFloat(hourlyPrice) : undefined,
      gameTypes,
      city,
      state,
      gender,
      dob: dob ? new Date(dob) : undefined,
      coachingLevel,
      availabilityTimings,
      availabilityMode,
      preferredLocations,
      trainingTypes,
      ageGroups,
      languages,
      achievements,
      experience,
      specialization,
      certifications,
      // If some fields still need to be in businessDetails JSON
      businessDetails: {
        address,
        pinCode,
        specialization,
        experience
      }
    };

    const professional = await prisma.ownerProfile.update({
      where: { id: professionalId },
      data: updateData
    });

    return res.status(200).json({ message: "Profile updated successfully", professional });
  } catch (error) {
    logger.error("Error in updateProfessionalProfile:", error);
    return res.status(500).json({ message: error.message });
  }
};

