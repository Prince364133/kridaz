import Booking from "../../models/booking.model.js";
import Review from "../../models/review.model.js";
import Turf from "../../models/turf.model.js";
import User from "../../models/user.model.js";
import Match from "../../models/match.model.js";
import Session from "../../models/session.model.js";

export const getDashboardData = async (req, res) => {
  try {
    const ownerId = req.owner.id;

    const turfs = await Turf.find({ owner: ownerId }).select("_id name pricePerHour reviews");
    const turfIds = turfs.map((turf) => turf._id);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalBookings,
      reviews,
      totalRevenueData,
      bookingsPerTurf,
      revenueOverTimeRaw,
      activeUsers,
    ] = await Promise.all([
      Booking.countDocuments({ turf: { $in: turfIds } }),
      Review.find({ turf: { $in: turfIds } }).select("rating"),
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

    const recentBookings = await Booking.find({ turf: { $in: turfIds } })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("user", "name email")
      .populate("turf", "name location");

    const totalPossibleSlots = turfs.length * 12 * 30;
    const utilization = totalPossibleSlots > 0 ? Math.min(100, Math.round((totalBookings / totalPossibleSlots) * 100)) : 0;

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
      : 0;

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
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
};

export const getCoachDashboardData = async (req, res) => {
  try {
    const coachId = req.owner.id;
    
    const [sessions, trainees] = await Promise.all([
      Session.find({ coach: coachId }).populate("students", "name email phone").sort({ date: 1 }),
      Session.distinct("students", { coach: coachId })
    ]);

    const detailedTrainees = await User.find({ _id: { $in: trainees } }, "name email phone avatar");

    res.json({
      activeTrainees: detailedTrainees.length,
      totalSessions: sessions.length,
      liveStreamMins: 0, 
      performanceIndex: 0, 
      studentProgress: [],
      sessions: sessions,
      trainees: detailedTrainees,
      upcomingSessions: sessions.filter(s => s.status === 'upcoming').slice(0, 5).map(s => ({
        time: s.time,
        type: s.type,
        name: s.name,
        student: `${s.students.length} Students`
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching coach dashboard data" });
  }
};

export const getUmpireDashboardData = async (req, res) => {
  try {
    const umpireId = req.owner.id;

    const matches = await Match.find({ umpire: umpireId }).sort({ date: 1 });
    
    const matchesOfficiated = matches.filter(m => m.status === "completed").length;
    const upcomingMatches = matches.filter(m => m.status === "upcoming").length;

    res.json({
      matchesOfficiated,
      upcomingMatches,
      officialRating: 0,
      earnings: matchesOfficiated * 500,
      matchEngagement: [],
      matches: matches,
      upcomingAssignments: matches.filter(m => m.status === "upcoming").slice(0, 5).map(m => ({
        match: m.name,
        time: `${new Date(m.date).toLocaleDateString()} - ${m.time}`,
        venue: m.venue,
        role: "Head Umpire"
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching umpire dashboard data" });
  }
};
