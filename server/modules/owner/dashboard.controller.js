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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log("DEBUG: Running parallel dashboard queries...");
    const [
      totalBookings,
      reviews,
      totalRevenueData,
      bookingsPerTurf,
      revenueOverTimeRaw,
      activeUsers,
    ] = await Promise.all([
      Booking.countDocuments({ turf: { $in: turfIds } }),
      Review.find({ turf: { $in: turfIds } }).select("rating").lean(),
      Booking.aggregate([
        { $match: { turf: { $in: turfIds } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Booking.aggregate([
        { $match: { turf: { $in: turfIds } } },
        { $group: { _id: "$turf", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "turves",
            localField: "_id",
            foreignField: "_id",
            as: "turfInfo",
          },
        },
        { $unwind: "$turfInfo" },
        { $project: { name: "$turfInfo.name", bookings: "$count" } },
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
    ]);
    console.log("DEBUG: Parallel queries completed");

    const revenueOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = revenueOverTimeRaw.find(r => r._id === dateStr);
      revenueOverTime.push({
        date: dateStr,
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayData ? dayData.revenue : 0
      });
    }

    console.log("DEBUG: Fetching recent bookings...");
    const recentBookings = await Booking.find({ turf: { $in: turfIds } })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("user", "name email")
      .populate("turf", "name location")
      .lean();

    const totalPossibleSlots = turfs.length * 12 * 30;
    const utilization = totalPossibleSlots > 0 ? Math.min(100, Math.round((totalBookings / totalPossibleSlots) * 100)) : 0;

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
      : 0;

    console.log("DEBUG: Sending successful main dashboard response");
    res.json({
      totalBookings,
      totalReviews,
      averageRating,
      totalRevenue: totalRevenueData[0]?.total || 0,
      totalTurfs: turfs.length,
      bookingsPerTurf,
      revenueOverTime,
      recentBookings,
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
