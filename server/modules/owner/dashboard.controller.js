import Booking from "../../models/booking.model.js";
import Review from "../../models/review.model.js";
import Turf from "../../models/turf.model.js";
import User from "../../models/user.model.js";
import Match from "../../models/match.model.js";
import Session from "../../models/session.model.js";

export const getDashboardData = async (req, res) => {
  const ownerId = req.owner.id;
  console.log("DEBUG: Fetching main dashboard data for ownerId:", ownerId);

  try {
    console.log("DEBUG: Querying Turf model...");
    const turfs = await Turf.find({ owner: ownerId }).select("_id name pricePerHour reviews").lean();
    console.log(`DEBUG: Found ${turfs.length} turfs`);

    if (turfs.length === 0) {
      console.log("DEBUG: No turfs found for owner, returning zeroed response");
      return res.json({
        totalBookings: 0,
        totalReviews: 0,
        averageRating: 0,
        totalRevenue: 0,
        totalTurfs: 0,
        bookingsPerTurf: [],
        revenueOverTime: [],
        recentBookings: [],
        activeUsers: 0,
        utilization: 0
      });
    }

    const turfIds = turfs.map((turf) => turf._id);
    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalBookings,
      reviews,
      totalRevenueData,
      bookingsPerTurfDay,
      bookingsPerTurfWeek,
      bookingsPerTurfMonth,
      revenueOverTimeRaw,
      activeUsers,
      revenueByCategory,
      occupancyRaw,
    ] = await Promise.all([
      Booking.countDocuments({ turf: { $in: turfIds } }),
      Review.find({ turf: { $in: turfIds } }).select("rating").lean(),
      Booking.aggregate([
        { $match: { turf: { $in: turfIds } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      // Bookings Per Turf - DAY
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, createdAt: { $gte: todayStart } } },
        { $group: { _id: "$turf", count: { $sum: 1 } } },
        { $lookup: { from: "turves", localField: "_id", foreignField: "_id", as: "turf" } },
        { $unwind: "$turf" },
        { $project: { name: "$turf.name", value: "$count" } }
      ]),
      // Bookings Per Turf - WEEK
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: "$turf", count: { $sum: 1 } } },
        { $lookup: { from: "turves", localField: "_id", foreignField: "_id", as: "turf" } },
        { $unwind: "$turf" },
        { $project: { name: "$turf.name", value: "$count" } }
      ]),
      // Bookings Per Turf - MONTH
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$turf", count: { $sum: 1 } } },
        { $lookup: { from: "turves", localField: "_id", foreignField: "_id", as: "turf" } },
        { $unwind: "$turf" },
        { $project: { name: "$turf.name", value: "$count" } }
      ]),
      Booking.aggregate([
        { 
          $match: { 
            turf: { $in: turfIds },
            createdAt: { $gte: sevenDaysAgo }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalPrice" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.distinct("user", { turf: { $in: turfIds } }),
      // Revenue By Category
      Booking.aggregate([
        { $match: { turf: { $in: turfIds } } },
        { $lookup: { from: "turves", localField: "turf", foreignField: "_id", as: "turfInfo" } },
        { $unwind: "$turfInfo" },
        { $group: { _id: "$turfInfo.category", value: { $sum: "$totalPrice" } } },
        { $project: { name: "$_id", value: 1 } }
      ]),
      // Occupancy Heatmap
      Booking.aggregate([
        { $match: { turf: { $in: turfIds } } },
        {
          $group: {
            _id: {
              day: { $dayOfWeek: "$createdAt" },
              hour: { $hour: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        }
      ]),
    ]);

    const occupancyHeatmap = occupancyRaw.map(o => ({
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][o._id.day - 1],
      hour: o._id.hour,
      value: o.count
    }));

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
      : 0;

    const venueHealth = {
      score: Math.round((averageRating / 5) * 100),
      profileComp: 95, // Logic for profile completeness
      responseRate: 98,
      satisfaction: averageRating,
      cancellation: 1.2
    };

    const totalPossibleSlots = turfs.length * 12 * 30;
    const utilization = totalPossibleSlots > 0 ? Math.min(100, Math.round((totalBookings / totalPossibleSlots) * 100)) : 0;

    console.log("DEBUG: Sending successful main dashboard response");
    res.json({
      totalBookings,
      totalReviews,
      averageRating,
      totalRevenue: totalRevenueData[0]?.total || 0,
      totalTurfs: turfs.length,
      bookingsPerTurfDay,
      bookingsPerTurfWeek,
      bookingsPerTurfMonth,
      revenueOverTimeRaw, // Raw for frontend to format
      revenueByCategory,
      occupancyHeatmap,
      venueHealth,
      recentBookings: await Booking.find({ turf: { $in: turfIds } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "name email avatar")
        .populate("turf", "name category")
        .lean(),
      activeUsers: activeUsers.length,
      utilization
    });
  } catch (error) {
    console.error("CRITICAL ERROR in getDashboardData:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching dashboard data", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getCoachDashboardData = async (req, res) => {
  const coachId = req.owner.id;
  console.log("DEBUG: Fetching coach dashboard data for coachId:", coachId);
  
  try {
    // 1. Fetch sessions
    console.log("DEBUG: Querying Session model...");
    const sessions = await Session.find({ coach: coachId })
      .populate("students", "name email phone avatar")
      .sort({ date: 1 })
      .lean() || [];
    console.log(`DEBUG: Found ${sessions.length} sessions`);

    // 2. Extract trainee IDs (robust filtering)
    console.log("DEBUG: Extracting trainee IDs...");
    const traineeIds = [];
    sessions.forEach(s => {
      if (s.students && Array.isArray(s.students)) {
        s.students.forEach(st => {
          if (st && st._id) traineeIds.push(st._id.toString());
        });
      }
    });
    const uniqueTraineeIds = [...new Set(traineeIds)];
    console.log(`DEBUG: Found ${uniqueTraineeIds.length} unique trainees`);

    // 3. Fetch detailed trainee info
    let detailedTrainees = [];
    if (uniqueTraineeIds.length > 0) {
      console.log("DEBUG: Fetching detailed trainee info from User model...");
      detailedTrainees = await User.find({ _id: { $in: uniqueTraineeIds } }, "name email phone avatar").lean() || [];
      console.log(`DEBUG: Found ${detailedTrainees.length} detailed trainees`);
    }

    // 4. Assemble response
    console.log("DEBUG: Assembling coach dashboard response...");
    const responseData = {
      activeTrainees: detailedTrainees.length,
      totalSessions: sessions.length,
      liveStreamMins: 0, 
      performanceIndex: 0, 
      studentProgress: [],
      sessions: sessions,
      trainees: detailedTrainees,
      upcomingSessions: sessions
        .filter(s => s && s.status === 'upcoming')
        .slice(0, 5)
        .map(s => ({
          time: s.time || "TBD",
          type: s.type || "Session",
          name: s.name || "Coaching Session",
          student: `${(s.students && s.students.length) || 0} Students`
        }))
    };
    
    console.log("DEBUG: Sending successful response for coach dashboard");
    res.json(responseData);
  } catch (error) {
    console.error("CRITICAL ERROR in getCoachDashboardData:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching coach dashboard data", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getUmpireDashboardData = async (req, res) => {
  const umpireId = req.owner.id;
  console.log("DEBUG: Fetching umpire dashboard data for umpireId:", umpireId);
  
  try {
    console.log("DEBUG: Querying Match model...");
    const matches = await Match.find({ umpire: umpireId }).sort({ date: 1 }).lean();
    console.log(`DEBUG: Found ${matches.length} matches`);
    
    const matchesOfficiated = matches.filter(m => m.status === "completed").length;
    const upcomingMatches = matches.filter(m => m.status === "upcoming").length;

    const responseData = {
      matchesOfficiated,
      upcomingMatches,
      officialRating: 0,
      earnings: matchesOfficiated * 500,
      matchEngagement: [],
      matches: matches,
      upcomingAssignments: matches.filter(m => m.status === "upcoming").slice(0, 5).map(m => ({
        match: m.name || "TBD Match",
        time: m.date ? `${new Date(m.date).toLocaleDateString()} - ${m.time || 'N/A'}` : 'TBD',
        venue: m.venue || "TBD Venue",
        role: "Head Umpire"
      }))
    };

    console.log("DEBUG: Sending successful response for umpire dashboard");
    res.json(responseData);
  } catch (error) {
    console.error("CRITICAL ERROR in getUmpireDashboardData:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching umpire dashboard data", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getOwnerCalendarData = async (req, res) => {
  const ownerId = req.owner.id;
  const { date } = req.query; // Expecting YYYY-MM-DD
  
  try {
    const selectedDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // 1. Fetch all turfs for this owner
    const turfs = await Turf.find({ owner: ownerId }).select("name category generatedSlots pricePerHour images").lean();
    const turfIds = turfs.map(t => t._id);

    // 2. Fetch all bookings for these turfs on the selected date
    // We need to check bookings where the timeSlot's startTime is within the selected date
    const bookings = await Booking.find({ turf: { $in: turfIds } })
      .populate({
        path: 'timeSlot',
        match: {
          startTime: { $gte: startOfDay, $lte: endOfDay }
        }
      })
      .populate('user', 'name')
      .lean();

    // Filter out bookings that don't have a matching timeSlot for this date
    const dailyBookings = bookings.filter(b => b.timeSlot);

    // 3. Process data for the calendar
    const calendarData = turfs.map(turf => {
      // Map generated slots and check if they are booked
      const slots = (turf.generatedSlots || []).map(slot => {
        // Check if this slot is booked
        // A slot is booked if there's a booking for this turf where the time matches
        const booking = dailyBookings.find(b => 
          b.turf.toString() === turf._id.toString() &&
          new Date(b.timeSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) === slot.startTime
        );

        return {
          ...slot,
          isBooked: !!booking,
          bookingDetails: booking ? {
            userName: booking.user?.name || "Partner/Other",
            totalPrice: booking.totalPrice,
            bookingId: booking._id
          } : null
        };
      });

      return {
        id: turf._id,
        name: turf.name,
        category: turf.category,
        slots: slots
      };
    });

    // 4. Calculate Stats for the day
    const confirmedSlots = dailyBookings.length;
    const totalRevenue = dailyBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalPossibleSlots = turfs.reduce((sum, t) => sum + (t.generatedSlots?.length || 0), 0);
    const averageLoad = totalPossibleSlots > 0 ? Math.round((confirmedSlots / totalPossibleSlots) * 100) : 0;

    res.json({
      success: true,
      date: startOfDay,
      facilities: calendarData,
      stats: {
        averageLoad,
        confirmedSlots,
        totalRevenue
      }
    });

  } catch (error) {
    console.error("Error in getOwnerCalendarData:", error);
    res.status(500).json({ success: false, message: "Error fetching calendar data" });
  }
};
