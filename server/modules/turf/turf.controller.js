import { prisma } from "../../config/prisma.js";
import cloudinary from "../../utils/cloudinary.js";
import { startOfDay, parseISO, addDays, format, parse } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { findNearby, updateGeoPoint } from "../../utils/geo.util.js";
import { getOrSetCache, generateCacheKey } from "../../utils/cache.js";
import logger from "../../utils/logger.js";

// --- USER OPERATIONS ---

export const getAllTurfs = async (req, res) => {
  const { searchTerm, city, state, lat, lng, radius } = req.query;
  try {
    const isVal = (v) => v && v !== "" && v !== "null" && v !== "undefined" && v !== "Select";

    const where = {
      status: "approved",
      isActive: true
    };

    if (isVal(city)) where.city = { contains: city, mode: 'insensitive' };
    if (isVal(state)) where.state = { contains: state, mode: 'insensitive' };
    
    if (isVal(searchTerm) && searchTerm !== "All") {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sportTypes: { has: searchTerm } }
      ];
    }

    const cacheKey = generateCacheKey("turfs:list", { searchTerm, city, state, lat, lng, radius });

    const formattedTurfs = await getOrSetCache(cacheKey, async () => {
      if (lat && lng) {
        const r = radius ? parseFloat(radius) : 5000;
        const nearbyTurfs = await findNearby('Turf', parseFloat(lat), parseFloat(lng), r, {
          where,
          include: {
            owner: {
              include: {
                user: {
                  select: { id: true, name: true, username: true, profilePicture: true }
                }
              }
            },
            reviews: { select: { rating: true } }
          }
        });
        
        return nearbyTurfs.map(t => {
          const totalRating = t.reviews.reduce((acc, r) => acc + r.rating, 0);
          const avgRating = t.reviews.length > 0 ? (totalRating / t.reviews.length) : 0;
          return {
            ...t,
            avgRating,
            owner: t.owner ? {
              id: t.owner.id,
              businessName: t.owner.businessName,
              user: t.owner.user ? {
                id: t.owner.user.id,
                name: t.owner.user.name,
                username: t.owner.user.username,
                profilePicture: t.owner.user.profilePicture
              } : null
            } : null
          };
        });
      }

      const turfs = await prisma.turf.findMany({
        where,
        include: {
          owner: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profilePicture: true
                }
              }
            }
          },
          reviews: {
            select: { rating: true }
          }
        }
      });

      return turfs.map(t => {
        const totalRating = t.reviews.reduce((acc, r) => acc + r.rating, 0);
        const avgRating = t.reviews.length > 0 ? (totalRating / t.reviews.length) : 0;
        
        return {
          ...t,
          avgRating,
          owner: t.owner ? {
            id: t.owner.id,
            businessName: t.owner.businessName,
            user: t.owner.user ? {
              id: t.owner.user.id,
              name: t.owner.user.name,
              username: t.owner.user.username,
              profilePicture: t.owner.user.profilePicture
            } : null
          } : null
        };
      });
    }, 900); // 15 minute TTL

    return res.status(200).json({ turfs: formattedTurfs });
  } catch (err) {
    logger.info("Error in getAllTurfs", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Returns distinct states and cities from approved turfs
 * so the frontend can populate filter dropdowns.
 */
export const getTurfLocations = async (req, res) => {
  try {
    const turfs = await prisma.turf.findMany({
      where: { status: "approved", isActive: true },
      select: { city: true, state: true }
    });

    const locationMap = {};
    const states = new Set();

    for (const t of turfs) {
      const state = t.state || "";
      const city = t.city || "";
      if (!state && !city) continue;

      if (state) {
        states.add(state);
        if (!locationMap[state]) locationMap[state] = [];
        if (city && !locationMap[state].includes(city)) {
          locationMap[state].push(city);
        }
      }
    }

    // Sort cities within each state
    for (const s of Object.keys(locationMap)) {
      locationMap[s].sort();
    }

    return res.status(200).json({
      states: [...states].sort(),
      citiesByState: locationMap,
    });
  } catch (err) {
    logger.info("Error in getTurfLocations", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getTurfById = async (req, res) => {
  const { id } = req.params;
  try {
    const turf = await prisma.turf.findUnique({
      where: { id },
      include: {
        ownerProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profilePicture: true
              }
            }
          }
        },
        reviews: {
          select: { rating: true }
        }
      }
    });

    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    const totalRating = turf.reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = turf.reviews.length > 0 ? (totalRating / turf.reviews.length) : 0;

    const formattedTurf = {
      ...turf,
      avgRating,
      owner: turf.ownerProfile ? {
        id: turf.ownerProfile.id,
        name: turf.ownerProfile.name,
        email: turf.ownerProfile.email,
        phone: turf.ownerProfile.phone,
        profilePicture: turf.ownerProfile.profilePicture,
        userId: turf.ownerProfile.user ? {
          id: turf.ownerProfile.user.id,
          name: turf.ownerProfile.user.name,
          username: turf.ownerProfile.user.username,
          profilePicture: turf.ownerProfile.user.profilePicture
        } : null
      } : null
    };

    // Expiry check side effect
    if (turf.slotsConfigDuration === "Fixed Weeks" && turf.slotsConfigExpiry && new Date() > new Date(turf.slotsConfigExpiry)) {
      if (!turf.slotsNeedsUpdate) {
        await prisma.turf.update({
          where: { id: turf.id },
          data: { slotsNeedsUpdate: true }
        });
        formattedTurf.slotsNeedsUpdate = true;
      }
    }

    return res.status(200).json({ turf: formattedTurf });
  } catch (error) {
    logger.info("Error in getTurfById", error);
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
    const selectedDate = parseISO(date);
    const startOfSelectedDate = fromZonedTime(startOfDay(selectedDate), timeZone);
    const endOfSelectedDate = addDays(startOfSelectedDate, 1);

    const turfDetails = await prisma.turf.findUnique({
      where: { id: turfId },
      select: {
        id: true,
        openTime: true,
        closeTime: true,
        pricePerHour: true,
        generatedSlots: true,
        availableDays: true,
        offDays: true,
        slotsNeedsUpdate: true,
        slotsConfigDuration: true,
        slotsConfigExpiry: true
      }
    });

    if (!turfDetails) {
      return res.status(404).json({ message: "Turf not found" });
    }

    const bookedTime = await prisma.timeSlot.findMany({
      where: {
        turfId: turfId,
        startTime: { gte: startOfSelectedDate },
        endTime: { lte: endOfSelectedDate }
      }
    });

    // If configuration needs update (current date > expiry), block all slots
    if (turfDetails.slotsNeedsUpdate || (turfDetails.slotsConfigDuration === "Fixed Weeks" && turfDetails.slotsConfigExpiry && new Date() > turfDetails.slotsConfigExpiry)) {
      return res.status(200).json({ 
        timeSlots: { ...turfDetails, generatedSlots: [] }, 
        bookedTime: [],
        message: "This venue's configuration has expired and needs a review by the owner."
      });
    }

    // Check if the SELECTED DATE is beyond the configuration expiry
    if (turfDetails.slotsConfigDuration === "Fixed Weeks" && turfDetails.slotsConfigExpiry && startOfSelectedDate > turfDetails.slotsConfigExpiry) {
      return res.status(200).json({ 
        timeSlots: { ...turfDetails, generatedSlots: [] }, 
        bookedTime: [],
        message: "Reservations for this date are not yet open. The venue configuration only covers the upcoming weeks."
      });
    }

    return res.status(200).json({ timeSlots: turfDetails, bookedTime });
  } catch (error) {
    logger.info("Error in getTimeSlotByTurfId", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- OWNER OPERATIONS ---

export const turfRegister = async (req, res) => {
  const ownerData = req.owner;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          { id: ownerData.ownerId },
          { userId: ownerData.id }
        ]
      }
    });

    if (!ownerProfile) {
      return res.status(404).json({ success: false, message: "Owner profile not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "At least one turf image is required" });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "kridaz/turfs" },
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
      price,
      ...otherData 
    } = req.body;

    let configExpiry = null;
    if (slotsConfigDuration === "Fixed Weeks" && slotsConfigWeeks) {
      configExpiry = new Date();
      configExpiry.setDate(configExpiry.getDate() + (Number(slotsConfigWeeks) * 7));
    }

    const newTurf = await prisma.turf.create({
      data: {
        ...otherData,
        image: imageUrls[0], 
        images: imageUrls,    
        ownerId: ownerProfile.id,
        status: "pending",
        city,
        state,
        lat: latitude ? parseFloat(latitude) : null,
        lng: longitude ? parseFloat(longitude) : null,
        slotDuration: Number(slotDuration) || 60,
        breakTime: Number(breakTime) || 0,
        pricePerHour: parseFloat(price) || 0,
        availableDays: Array.isArray(availableDays) ? availableDays : (availableDays ? [availableDays] : []),
        offDays: Array.isArray(offDays) ? offDays : (offDays ? [offDays] : []),
        generatedSlots: generatedSlots ? JSON.parse(generatedSlots) : [],
        managerContacts: managerContacts ? JSON.parse(managerContacts) : [],
        slotsConfigDuration: slotsConfigDuration || "Until Changed",
        slotsConfigWeeks: Number(slotsConfigWeeks) || 1,
        slotsConfigExpiry: configExpiry,
        slotsNeedsUpdate: false,
        isActive: true
      }
    });

    if (latitude && longitude) {
      await updateGeoPoint('Turf', newTurf.id, parseFloat(latitude), parseFloat(longitude));
    }

    return res.status(201).json({ 
      success: true, 
      message: "Turf registered and sent for admin approval",
      turf: newTurf
    });
  } catch (err) {
    logger.info("Error in turfRegister", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTurfByOwner = async (req, res) => {
  const ownerData = req.owner;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          { id: ownerData.ownerId },
          { userId: ownerData.id }
        ]
      }
    });

    if (!ownerProfile) {
      return res.status(404).json({ success: false, message: "Owner profile not found" });
    }

    const turfs = await prisma.turf.findMany({
      where: { ownerId: ownerProfile.id },
      include: {
        reviews: {
          select: { rating: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedTurfs = turfs.map(t => {
      const totalRating = t.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = t.reviews.length > 0 ? (totalRating / t.reviews.length) : 0;
      
      return {
        ...t,
        avgRating,
        numReviews: t.reviews.length
      };
    });

    // Side effect: Check for expiry
    Promise.all(formattedTurfs.map(async (t) => {
      if (t.slotsConfigDuration === "Fixed Weeks" && t.slotsConfigExpiry && new Date() > new Date(t.slotsConfigExpiry)) {
        if (!t.slotsNeedsUpdate) {
          await prisma.turf.update({
            where: { id: t.id },
            data: { slotsNeedsUpdate: true }
          });
        }
      }
    })).catch(err => logger.error("Error updating turf expiry in background:", err));

    return res.status(200).json(formattedTurfs);
  } catch (err) {
    logger.error("Error getting turfs by ownerId", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const editTurfById = async (req, res) => {
  const ownerData = req.owner;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          { id: ownerData.ownerId },
          { userId: ownerData.id }
        ]
      }
    });

    if (!ownerProfile) {
      return res.status(404).json({ success: false, message: "Owner profile not found" });
    }

    const { id } = req.params;
    const { sportTypes, groundTypes, facilities, sportsType, price, ...otherDetails } = req.body;
    
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
    if (price) updatedTurfData.pricePerHour = parseFloat(price);

    if (req.body.city) updatedTurfData.city = req.body.city;
    if (req.body.state) updatedTurfData.state = req.body.state;
    if (req.body.latitude && req.body.longitude) {
      updatedTurfData.lat = parseFloat(req.body.latitude);
      updatedTurfData.lng = parseFloat(req.body.longitude);
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
    
    updatedTurfData.slotsNeedsUpdate = false;

    const turf = await prisma.turf.findFirst({ 
      where: {
        id,
        ownerId: ownerProfile.id
      }
    });

    if (!turf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "kridaz/turfs" },
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

    // Logic for pending updates
    if (turf.status === "approved") {
      await prisma.turf.update({
        where: { id },
        data: {
          pendingUpdates: updatedTurfData,
          status: "pending"
        }
      });
    } else {
      await prisma.turf.update({
        where: { id },
        data: {
          ...updatedTurfData,
          status: "pending"
        }
      });
    }

    const allTurfs = await prisma.turf.findMany({ where: { ownerId: ownerProfile.id } });
    return res.status(200).json({ 
      success: true, 
      message: "Changes saved and sent for admin review", 
      allTurfs
    });
  } catch (err) {
    logger.error("Error updating turf:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTurfDetailsWithSlots = async (req, res) => {
  const { id } = req.params;

  try {
    const turf = await prisma.turf.findUnique({
      where: { id },
      include: {
        timeSlots: {
          include: {
            booking: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    phoneNumber: true,
                    profilePicture: true
                  }
                }
              }
            }
          },
          orderBy: { startTime: 'asc' }
        }
      }
    });

    if (!turf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }

    const processedSlots = turf.timeSlots.map(s => {
      const booking = s.booking[0]; // Assuming one booking per slot
      return {
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        isBooked: !!booking,
        bookingDetails: booking ? {
          user: booking.user ? {
            name: booking.user.name,
            email: booking.user.email,
            phoneNumber: booking.user.phoneNumber,
            profileImage: booking.user.profilePicture
          } : {
            name: booking.guestName,
            email: booking.guestEmail,
            phoneNumber: booking.guestPhone,
            isGuest: true
          },
          totalPrice: booking.totalPrice,
          bookedAt: booking.createdAt,
          bookingSource: booking.bookingSource,
          status: booking.status
        } : null
      };
    });

    const bookings = processedSlots.filter(s => s.isBooked).map(s => s.bookingDetails);

    // Generate virtual slots
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
    const today = startOfDay(toZonedTime(new Date(), timeZone));
    
    const allSlots = [...processedSlots];
    const existingSlotTimes = new Set(processedSlots.map(s => 
      `${new Date(s.startTime).getTime()}-${new Date(s.endTime).getTime()}`
    ));

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(today, i);
      const dayName = format(currentDate, "EEEE");
      
      if (turf.offDays && turf.offDays.includes(dayName)) continue;
      if (turf.availableDays && !turf.availableDays.includes(dayName)) continue;
      
      const generatedSlots = turf.generatedSlots || [];
      for (const template of generatedSlots) {
        if (template.isActive === false) continue;

        try {
          const startTime = parse(template.startTime, "hh:mm a", currentDate);
          const endTime = parse(template.endTime, "hh:mm a", currentDate);
          
          const utcStart = fromZonedTime(startTime, timeZone);
          const utcEnd = fromZonedTime(endTime, timeZone);
          
          const timeKey = `${utcStart.getTime()}-${utcEnd.getTime()}`;
          
          if (!existingSlotTimes.has(timeKey)) {
            allSlots.push({
              id: `virtual_${timeKey}`,
              startTime: utcStart,
              endTime: utcEnd,
              isBooked: false,
              bookingDetails: null,
              price: template.price || turf.pricePerHour,
              isActive: true
            });
          }
        } catch (err) {
          continue;
        }
      }
    }

    allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const stats = {
      totalBookings: bookings.filter(b => b.status !== "CANCELLED").length,
      totalRevenue: bookings.filter(b => b.status !== "CANCELLED").reduce((acc, b) => acc + b.totalPrice, 0)
    };

    return res.status(200).json({ 
      success: true, 
      turf, 
      slots: allSlots, 
      stats 
    });
  } catch (err) {
    logger.error("Error getting turf details with slots:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- ADMIN OPERATIONS ---

export const adminGetAllTurfs = async (req, res) => {
  if (req.admin.role?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const turfs = await prisma.turf.findMany({
      include: {
        ownerProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        },
        reviews: {
          select: { rating: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedTurfs = turfs.map(t => {
      const totalRating = t.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = t.reviews.length > 0 ? (totalRating / t.reviews.length) : 0;
      
      return {
        ...t,
        avgRating,
        owner: t.ownerProfile ? {
          id: t.ownerProfile.id,
          name: t.ownerProfile.name,
          email: t.ownerProfile.email,
          phoneNumber: t.ownerProfile.phone,
          profileImage: t.ownerProfile.profilePicture,
          userId: t.ownerProfile.user ? {
            id: t.ownerProfile.user.id,
            name: t.ownerProfile.user.name,
            username: t.ownerProfile.user.username
          } : null
        } : null
      };
    });

    return res.status(200).json({ turfs: formattedTurfs });
  } catch (error) {
    logger.error("Error in adminGetAllTurfs: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const adminApproveTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation } = req.body;
  try {
    const turf = await prisma.turf.findUnique({
      where: { id }
    });

    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });

    const verificationData = {
      adminName: name,
      adminDesignation: designation,
      verifiedAt: new Date(),
      action: "approved"
    };

    let updateData = {
      status: "approved",
      verificationData
    };

    if (turf.pendingUpdates && typeof turf.pendingUpdates === 'object' && Object.keys(turf.pendingUpdates).length > 0) {
      updateData = {
        ...updateData,
        ...turf.pendingUpdates,
        pendingUpdates: {}
      };
    }

    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json({ 
      success: true, 
      message: "Turf approved and changes merged", 
      turf: updatedTurf 
    });
  } catch (err) {
    logger.info("Error in adminApproveTurf", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminRejectTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation, reason } = req.body;
  try {
    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: {
        status: "rejected",
        verificationData: {
          adminName: name,
          adminDesignation: designation,
          verifiedAt: new Date(),
          action: "rejected",
          reason
        }
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: "Turf rejected", 
      turf: updatedTurf 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminDecommissionTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation } = req.body;
  try {
    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: {
        status: "decommissioned",
        isActive: false,
        verificationData: {
          adminName: name,
          adminDesignation: designation,
          verifiedAt: new Date(),
          action: "decommissioned"
        }
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: "Venue decommissioned. Owner must re-apply for verification.", 
      turf: updatedTurf 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminSoftDeleteTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation } = req.body;
  try {
    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: {
        status: "deleted",
        isActive: false,
        verificationData: {
          adminName: name,
          adminDesignation: designation,
          verifiedAt: new Date(),
          action: "deleted"
        }
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: "Venue moved to deleted list.", 
      turf: updatedTurf 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminHardDeleteTurf = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction([
      prisma.timeSlot.deleteMany({ where: { turfId: id } }),
      prisma.booking.deleteMany({ where: { turfId: id } }),
      prisma.review.deleteMany({ where: { turfId: id } }),
      prisma.turf.delete({ where: { id } })
    ]);

    return res.status(200).json({ success: true, message: "Venue and all associated data permanently deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleTurfVisibility = async (req, res) => {
  const ownerData = req.owner;
  const { id } = req.params;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          { id: ownerData.ownerId },
          { userId: ownerData.id }
        ]
      }
    });

    if (!ownerProfile) {
      return res.status(404).json({ success: false, message: "Owner profile not found" });
    }

    const turf = await prisma.turf.findFirst({ 
      where: {
        id,
        ownerId: ownerProfile.id
      }
    });

    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });
    
    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: { isActive: !turf.isActive }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: `Turf listing ${updatedTurf.isActive ? 'enabled' : 'disabled'}`,
      isActive: updatedTurf.isActive 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTurf = async (req, res) => {
  const ownerData = req.owner;
  const { id } = req.params;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          { id: ownerData.ownerId },
          { userId: ownerData.id }
        ]
      }
    });

    if (!ownerProfile) {
      return res.status(404).json({ success: false, message: "Owner profile not found" });
    }

    const turf = await prisma.turf.findFirst({ 
      where: {
        id,
        ownerId: ownerProfile.id
      }
    });

    if (!turf) return res.status(404).json({ success: false, message: "Turf not found or unauthorized" });
    
    await prisma.$transaction([
      prisma.timeSlot.deleteMany({ where: { turfId: id } }),
      prisma.booking.deleteMany({ where: { turfId: id } }),
      prisma.review.deleteMany({ where: { turfId: id } }),
      prisma.turf.delete({ where: { id } })
    ]);
    
    return res.status(200).json({ success: true, message: "Arena decommissioned successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
