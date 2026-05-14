import mongoose from "mongoose";
import Booking from "../../models/booking.model.js";
import Review from "../../models/review.model.js";
import Turf from "../../models/turf.model.js";
import User from "../../models/user.model.js";
import Match from "../../models/match.model.js";
import Session from "../../models/session.model.js";
import WalletTransaction from "../../models/walletTransaction.model.js";
import Owner from "../../models/owner.model.js";
import HostedGame from "../../models/hostedGame.model.js";
import CricketScoring from "../../models/cricketScoring.model.js";
import { format, formatDistanceToNow } from "date-fns";
import * as youtubeService from "../../services/youtubeService.js";
import * as facebookService from "../../services/facebookService.js";


export const getDashboardData = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  console.log(`DEBUG: Fetching main dashboard data for ${role} (ID: ${userId})`);

  // Redirect based on role
  if (role === "coach") return getCoachDashboardData(req, res);
  if (role?.toLowerCase().includes("umpire")) return getUmpireDashboardData(req, res);
  if (role?.toLowerCase() === "streamer") return getStreamerDashboardData(req, res);
  if (role?.toLowerCase() === "scorer") return getScorerDashboardData(req, res);

  try {
    // 1. Resolve correct owner document
    const ownerRecord = await Owner.findOne({ 
      $or: [
        { _id: userId }, // If userId is already an Owner ID
        { userId: userId } // If userId is a User ID linked to an Owner
      ]
    });

    if (!ownerRecord) {
      console.log(`DEBUG: No owner profile found for ID: ${userId}`);
      return res.status(404).json({ message: "Owner profile not found" });
    }

    const ownerId = ownerRecord._id;

    // 2. Fetch ground statistics
    const turfs = await Turf.find({ 
      $or: [
        { owner: ownerId },
        { owner: ownerRecord.userId }
      ]
    }).select("_id name pricePerHour reviews").lean();
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
    const startOfToday = new Date(now.setHours(0,0,0,0));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);


    const [
      totalRevenueData,
      bookingsPerTurfDay,
      bookingsPerTurfWeek,
      bookingsPerTurfMonth,
      revenueTrendDay,
      revenueTrendWeek,
      revenueTrendMonth,
      activeUsers,
      revenueByCategory,
      occupancyRaw,
      revenueByVenueRaw,
    ] = await Promise.all([
      // Total Revenue stats
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            settlementRevenue: { $sum: "$totalPrice" } // Adjust if settlement logic exists
          }
        }
      ]),
      // Bookings Per Turf - DAY
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        { $lookup: { from: "timeslots", localField: "timeSlot", foreignField: "_id", as: "slot" } },
        { $unwind: "$slot" },
        { $match: { "slot.startTime": { $gte: startOfToday } } },
        { $group: { _id: "$turf", count: { $sum: 1 } } },
        { $lookup: { from: "turves", localField: "_id", foreignField: "_id", as: "turf" } },
        { $unwind: "$turf" },
        { $project: { name: "$turf.name", value: "$count" } }
      ]),
      // Bookings Per Turf - WEEK
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        { $lookup: { from: "timeslots", localField: "timeSlot", foreignField: "_id", as: "slot" } },
        { $unwind: "$slot" },
        { $match: { "slot.startTime": { $gte: sevenDaysAgo } } },
        { $group: { _id: "$turf", count: { $sum: 1 } } },
        { $lookup: { from: "turves", localField: "_id", foreignField: "_id", as: "turf" } },
        { $unwind: "$turf" },
        { $project: { name: "$turf.name", value: "$count" } }
      ]),
      // Bookings Per Turf - MONTH
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        { $lookup: { from: "timeslots", localField: "timeSlot", foreignField: "_id", as: "slot" } },
        { $unwind: "$slot" },
        { $match: { "slot.startTime": { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$turf", count: { $sum: 1 } } },
        { $lookup: { from: "turves", localField: "_id", foreignField: "_id", as: "turf" } },
        { $unwind: "$turf" },
        { $project: { name: "$turf.name", value: "$count" } }
      ]),
      // Revenue Over Time - DAY (Hourly)
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        { $lookup: { from: "timeslots", localField: "timeSlot", foreignField: "_id", as: "slot" } },
        { $unwind: "$slot" },
        { $match: { "slot.startTime": { $gte: startOfToday } } },
        {
          $group: {
            _id: { $hour: "$slot.startTime" },
            revenue: { $sum: "$totalPrice" },
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Revenue Over Time - WEEK (Daily)
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        { $lookup: { from: "timeslots", localField: "timeSlot", foreignField: "_id", as: "slot" } },
        { $unwind: "$slot" },
        { $match: { "slot.startTime": { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$slot.startTime" } },
            revenue: { $sum: "$totalPrice" },
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Revenue Over Time - MONTH (Daily)
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        { $lookup: { from: "timeslots", localField: "timeSlot", foreignField: "_id", as: "slot" } },
        { $unwind: "$slot" },
        { $match: { "slot.startTime": { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$slot.startTime" } },
            revenue: { $sum: "$totalPrice" },
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Booking.distinct("user", { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } }),
      // Revenue By Category
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        { $lookup: { from: "turves", localField: "turf", foreignField: "_id", as: "turfInfo" } },
        { $unwind: "$turfInfo" },
        { $group: { _id: "$turfInfo.category", value: { $sum: "$totalPrice" } } },
        { $project: { name: "$_id", value: 1 } }
      ]),
      // Detailed Occupancy Heatmap
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        { $lookup: { from: "timeslots", localField: "timeSlot", foreignField: "_id", as: "slot" } },
        { $unwind: "$slot" },
        { $lookup: { from: "turves", localField: "turf", foreignField: "_id", as: "turfInfo" } },
        { $unwind: "$turfInfo" },
        {
          $group: {
            _id: {
              day: { $dayOfWeek: "$slot.startTime" },
              hour: { $hour: "$slot.startTime" }
            },
            count: { $sum: 1 },
            turfs: { $addToSet: "$turfInfo.name" }
          }
        }
      ]),
      // Revenue By Venue
      Booking.aggregate([
        { $match: { turf: { $in: turfIds }, status: { $ne: "CANCELLED" } } },
        { $lookup: { from: "turves", localField: "turf", foreignField: "_id", as: "turfInfo" } },
        { $unwind: "$turfInfo" },
        { $group: { _id: "$turfInfo.name", revenue: { $sum: "$totalPrice" } } },
        { $project: { name: "$_id", value: "$revenue" } }
      ]),
    ]);

    const occupancyHeatmap = (occupancyRaw || []).map(o => ({
      day: o._id && o._id.day ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][o._id.day - 1] : "Unknown",
      hour: o._id ? o._id.hour : 0,
      value: o.count,
      turfs: o.turfs
    }));

    const totalReviews = await Review.countDocuments({ turf: { $in: turfIds } });
    const reviews = await Review.find({ turf: { $in: turfIds } }).select("rating").lean();
    const averageRating = totalReviews > 0 && Array.isArray(reviews)
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1) 
      : 0;

    const venueHealth = {
      score: Math.round((averageRating / 5) * 100),
      profileComp: 95,
      responseRate: 98,
      satisfaction: averageRating,
      cancellation: 1.2
    };

    const totalPossibleSlots = turfs.length * 12 * 30; // Approx
    const totalBookings = await Booking.countDocuments({ turf: { $in: turfIds }, status: { $ne: "CANCELLED" } });
    const utilization = totalPossibleSlots > 0 ? Math.min(100, Math.round((totalBookings / totalPossibleSlots) * 100)) : 0;

    res.json({
      totalBookings,
      totalReviews,
      averageRating,
      totalRevenue: totalRevenueData[0]?.totalRevenue || 0,
      settlementRevenue: totalRevenueData[0]?.settlementRevenue || 0,
      totalTurfs: turfs.length,
      bookingsPerTurfDay,
      bookingsPerTurfWeek,
      bookingsPerTurfMonth,
      revenueTrendDay,
      revenueTrendWeek,
      revenueTrendMonth,
      revenueByCategory,
      revenueByVenue: revenueByVenueRaw,
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
    res.status(500).json({ success: false, message: "Error fetching dashboard data" });
  }
};

export const getCoachDashboardData = async (req, res) => {
  const ownerId = req.owner?.ownerId || req.user?.ownerId;
  const userId = req.owner?.userId || req.user?.id;

  try {
    console.log(`[DASHBOARD_COACH] Resolving for ownerId: ${ownerId}, userId: ${userId}`);
    
    // Find coach profile
    let coach = null;
    if (ownerId) {
      coach = await Owner.findById(ownerId).lean();
    }
    if (!coach && userId) {
      coach = await Owner.findOne({ userId }).lean();
    }

    if (!coach) {
      console.warn(`[DASHBOARD_COACH] Profile not found for userId: ${userId}, returning default empty state`);
      return res.json({
        activeTrainees: 0,
        totalSessions: 0,
        totalRevenue: 0,
        revenueOverTimeRaw: [],
        liveStreamMins: 0,
        performanceIndex: 0,
        studentProgress: [],
        sessions: [],
        trainees: [],
        coach: null,
        upcomingSessions: []
      });
    }

    const coachId = coach._id;
    const coachUserId = coach.userId;
    console.log(`[DASHBOARD_COACH] Profile found: ${coachId}, userId: ${coachUserId}`);

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

    // 4. Fetch Real Revenue from Wallet
    const coachProfile = await Owner.findOne({ userId: coachUserId });
    const cId = coachProfile?._id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 2. Fetch Core Metrics
    const [revenueData, revenueOverTimeRaw] = await Promise.all([
      WalletTransaction.aggregate([
        { 
          $match: { 
            user: new mongoose.Types.ObjectId(coachUserId), 
            status: "SUCCESS", 
            type: { $ne: "DEBIT" } 
          } 
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      WalletTransaction.aggregate([
        { 
          $match: { 
            user: new mongoose.Types.ObjectId(coachUserId), 
            status: "SUCCESS", 
            type: { $ne: "DEBIT" },
            createdAt: { $gte: sevenDaysAgo }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ])
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    if (!sessions || sessions.length === 0) {
      return res.json({
        activeTrainees: 0,
        totalSessions: 0,
        totalRevenue: totalRevenue,
        revenueOverTimeRaw: revenueOverTimeRaw,
        liveStreamMins: 0,
        performanceIndex: 0,
        studentProgress: [],
        sessions: [],
        trainees: [],
        coach: coachProfile,
        upcomingSessions: []
      });
    }

    // 6. Assemble response
    console.log("DEBUG: Assembling coach dashboard response...");
    const responseData = {
      activeTrainees: detailedTrainees.length,
      totalSessions: sessions.length,
      totalRevenue,
      revenueOverTimeRaw,
      liveStreamMins: 0, 
      performanceIndex: 0, 
      studentProgress: [],
      sessions: sessions,
      trainees: detailedTrainees,
      coach: coachProfile,
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
  try {
    const ownerId = req.owner?.ownerId || req.user?.ownerId;
    const userId = req.owner?.userId || req.user?.id;

    console.log(`[DASHBOARD_UMPIRE] Resolving for ownerId: ${ownerId}, userId: ${userId}`);
    
    // Find umpire profile
    let umpire = null;
    if (ownerId) {
      umpire = await Owner.findById(ownerId).lean();
    }
    if (!umpire && userId) {
      umpire = await Owner.findOne({ userId }).lean();
    }

    if (!umpire) {
      console.warn(`[DASHBOARD_UMPIRE] Profile not found for userId: ${userId}, returning default empty state`);
      return res.json({
        matchesOfficiated: 0,
        upcomingMatches: 0,
        officialRating: 0,
        earnings: 0,
        totalRevenue: 0,
        revenueOverTimeRaw: [],
        matchEngagement: [],
        matches: [],
        upcomingAssignments: [],
        upgradeRequested: false
      });
    }

    const umpireId = umpire._id;
    const umpireUserId = umpire.userId;
    console.log(`[DASHBOARD_UMPIRE] Profile found: ${umpireId}, userId: ${umpireUserId}`);

    // Fetch user details for email/phone fallback search
    const userRecord = await User.findById(umpireUserId).select("email phone").lean();
    const userEmail = userRecord?.email;
    const userPhone = userRecord?.phone;

    const [legacyMatches, hostedGames] = await Promise.all([
      Match.find({ umpire: { $in: [umpireId, ownerId] } }).sort({ date: 1 }).lean(),
      HostedGame.find({
        $or: [
          { umpire: { $in: [umpireId, umpireUserId, ownerId] } },
          { "umpireRequest.user": { $in: [umpireId, umpireUserId, ownerId] } },
          { "customUmpire.email": userEmail },
          { "customUmpire.phone": userPhone }
        ],
        status: { $ne: "CANCELLED" }
      })
        .populate("ground", "name location")
        .sort({ date: 1 })
        .lean()
    ]);

    // Format HostedGames to match the frontend match structure
    const formattedHostedGames = hostedGames.map(game => ({
      ...game,
      name: game.name || `${game.teams?.teamA?.name || 'Team A'} VS ${game.teams?.teamB?.name || 'Team B'}`,
      venue: game.ground?.name || game.city || "TBD Venue",
      // Normalize status to lowercase for frontend filtering
      status: game.status === "ACTIVE" ? "upcoming" : game.status.toLowerCase(),
      teams: game.teams ? [game.teams.teamA.name, game.teams.teamB.name] : ["TBD", "TBD"],
      isHostedGame: true
    }));

    const allMatches = [...legacyMatches, ...formattedHostedGames];
    console.log(`DEBUG: Found ${legacyMatches.length} legacy matches and ${formattedHostedGames.length} hosted games`);
    
    // Fetch Real Revenue from Wallet
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [revenueData, revenueOverTimeRaw] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(umpireUserId), status: "SUCCESS", type: { $ne: "DEBIT" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      WalletTransaction.aggregate([
        { 
          $match: { 
            user: new mongoose.Types.ObjectId(umpireUserId), 
            status: "SUCCESS", 
            type: { $ne: "DEBIT" },
            createdAt: { $gte: sevenDaysAgo }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ])
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    if (!hostedGames || hostedGames.length === 0) {
      return res.json({
        matchesOfficiated: 0,
        upcomingMatches: 0,
        officialRating: umpire?.rating || 0,
        earnings: totalRevenue,
        totalRevenue,
        revenueOverTimeRaw,
        matchEngagement: [],
        matches: [],
        upcomingAssignments: [],
        upgradeRequested: umpire?.upgradeRequested || false
      });
    }

    const matchesOfficiated = allMatches.filter(m => m.status === "completed").length;
    const upcomingMatches = allMatches.filter(m => m.status === "upcoming").length;

    const responseData = {
      matchesOfficiated,
      upcomingMatches,
      officialRating: umpire.rating || 0,
      earnings: totalRevenue,
      totalRevenue,
      revenueOverTimeRaw,
      matchEngagement: [],
      matches: allMatches,
      upcomingAssignments: allMatches.filter(m => m.status === "upcoming").slice(0, 5).map(m => ({
        _id: m._id,
        match: m.name || "TBD Match",
        shortId: m.shortId,
        time: m.date ? `${new Date(m.date).toLocaleDateString()} - ${m.time || 'N/A'}` : 'TBD',
        venue: m.venue || "TBD Venue",
        role: "Head Umpire"
      })),
      upgradeRequested: umpire.upgradeRequested || false
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

export const getStreamerDashboardData = async (req, res) => {
  try {
    const ownerId = req.owner?.ownerId || req.user?.ownerId;
    const userId = req.owner?.userId || req.user?.id;

    console.log(`[DASHBOARD_STREAMER] Fetching for ownerId: ${ownerId}, userId: ${userId}`);
    
    // Attempt to find streamer profile by ownerId or userId
    let owner = null;
    if (ownerId) {
      owner = await Owner.findById(ownerId).lean();
    }
    if (!owner && userId) {
      owner = await Owner.findOne({ userId }).lean();
    }

    // Resilience: If no streamer profile found, return default empty dashboard
    if (!owner) {
      console.warn(`[DASHBOARD_STREAMER] Profile not found, returning default empty state for userId: ${userId}`);
      return res.json({
        matchesStreamed: 0,
        upcomingStreams: 0,
        officialRating: 0,
        earnings: 0,
        totalRevenue: 0,
        revenueOverTimeRaw: [],
        matchEngagement: [],
        matches: [],
        upcomingAssignments: [],
        upgradeRequested: false,
        socialStats: { youtube: null, facebook: null }
      });
    }

    const streamerId = owner._id;
    const streamerUserId = owner.userId;

    const hostedGames = await HostedGame.find({
      $or: [
        { streamer: { $in: [streamerId, streamerUserId, ownerId] } },
        { "streamerRequest.user": { $in: [streamerId, streamerUserId, ownerId] } }
      ],
      status: { $ne: "CANCELLED" }
    })
      .populate("ground", "name location")
      .sort({ date: 1 })
      .lean();

    // Format HostedGames to match the frontend match structure
    const allMatches = hostedGames.map(game => ({
      ...game,
      name: game.name || `${game.teams?.teamA?.name || 'Team A'} VS ${game.teams?.teamB?.name || 'Team B'}`,
      venue: game.ground?.name || game.city || "TBD Venue",
      // Normalize status to lowercase for frontend filtering
      status: game.status === "ACTIVE" ? "upcoming" : game.status.toLowerCase(),
      teams: game.teams ? [game.teams.teamA.name, game.teams.teamB.name] : ["TBD", "TBD"],
      isHostedGame: true
    }));

    console.log(`DEBUG: Found ${allMatches.length} hosted games for streamer`);
    
    // Fetch Real Revenue from Wallet
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [revenueData, revenueOverTimeRaw] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(streamerUserId), status: "SUCCESS", type: { $ne: "DEBIT" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      WalletTransaction.aggregate([
        { 
          $match: { 
            user: new mongoose.Types.ObjectId(streamerUserId), 
            status: "SUCCESS", 
            type: { $ne: "DEBIT" },
            createdAt: { $gte: sevenDaysAgo }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ])
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    if (!hostedGames || hostedGames.length === 0) {
      return res.json({
        matchesStreamed: 0,
        upcomingStreams: 0,
        officialRating: owner?.rating || 0,
        earnings: totalRevenue,
        totalRevenue,
        revenueOverTimeRaw,
        matchEngagement: [],
        matches: [],
        upcomingAssignments: [],
        upgradeRequested: owner?.upgradeRequested || false,
        socialStats: {
          youtube: null,
          facebook: null
        }
      });
    }

    const matchesStreamed = allMatches.filter(m => m.status === "completed").length;
    const upcomingStreams = allMatches.filter(m => m.status === "upcoming").length;

    // Fetch Social Stats (Non-blocking and resilient)
    let socialStats = { youtube: null, facebook: null };
    try {
      const [ytStats, fbStats] = await Promise.all([
        youtubeService.getChannelStats(streamerUserId).catch(err => {
          console.warn(`[DASHBOARD_STREAMER] YT Stats failed: ${err.message}`);
          return null;
        }),
        facebookService.getFacebookPageStats(streamerUserId).catch(err => {
          console.warn(`[DASHBOARD_STREAMER] FB Stats failed: ${err.message}`);
          return null;
        })
      ]);
      socialStats = { youtube: ytStats, facebook: fbStats };
    } catch (socialErr) {
      console.warn(`[DASHBOARD_STREAMER] Social stats aggregation failed: ${socialErr.message}`);
    }

    const responseData = {
      matchesStreamed,
      upcomingStreams,
      officialRating: owner.rating || 0,
      earnings: totalRevenue,
      totalRevenue,
      revenueOverTimeRaw,
      matchEngagement: [],
      matches: allMatches,
      upcomingAssignments: allMatches.filter(m => m.status === "upcoming").slice(0, 5).map(m => ({
        _id: m._id,
        match: m.name || "TBD Match",
        shortId: m.shortId,
        time: m.date ? `${new Date(m.date).toLocaleDateString()} - ${m.time || 'N/A'}` : 'TBD',
        venue: m.venue || "TBD Venue",
        role: "Head Streamer"
      })),
      upgradeRequested: owner?.upgradeRequested || false,
      socialStats
    };

    console.log("DEBUG: Sending successful response for streamer dashboard");
    res.json(responseData);
  } catch (error) {
    console.error("CRITICAL ERROR in getStreamerDashboardData:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching streamer dashboard data", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getScorerDashboardData = async (req, res) => {
  const userId = req.user?.id || req.owner?.userId;
  const ownerId = req.owner?.ownerId || req.user?.ownerId;

  try {
    console.log(`[DASHBOARD_SCORER] Resolving for userId: ${userId}, ownerId: ${ownerId}`);

    // Try to find scorer profile in Owner model
    let scorerProfile = null;
    if (ownerId) {
      scorerProfile = await Owner.findById(ownerId).lean();
    }
    if (!scorerProfile && userId) {
      scorerProfile = await Owner.findOne({ userId }).lean();
    }

    // Resilience: If no scorer profile found, return default empty dashboard instead of 404
    if (!scorerProfile) {
      console.warn(`[DASHBOARD_SCORER] Profile not found for userId: ${userId}, returning default empty state`);
      return res.json({
        activeMatches: 0,
        matchesScored: 0,
        upcomingMatches: 0,
        officialRating: scorerProfile?.rating || 0,
        earnings: 0,
        totalRevenue: 0,
        revenueOverTimeRaw: [],
        matchEngagement: [],
        matches: [],
        upcomingAssignments: []
      });
    }

    const scorerId = scorerProfile._id;
    const scorerUserId = scorerProfile.userId;
    console.log(`[DASHBOARD_SCORER] Profile found: ${scorerId}, userId: ${scorerUserId}`);

    const hostedGames = await HostedGame.find({
      $or: [
        { scorer: new mongoose.Types.ObjectId(scorerUserId) },
        { "scorerRequest.user": new mongoose.Types.ObjectId(scorerUserId) },
        ...(scorerId ? [{ scorer: new mongoose.Types.ObjectId(scorerId) }] : []),
        ...(scorerId ? [{ "scorerRequest.user": new mongoose.Types.ObjectId(scorerId) }] : []),
        ...(scorerProfile.phone ? [{ "customScorer.phone": scorerProfile.phone }] : []),
        ...(scorerProfile.email ? [{ "customScorer.email": scorerProfile.email }] : [])
      ],
      status: { $ne: "CANCELLED" }
    })
      .populate("ground", "name location")
      .sort({ date: 1 })
      .lean();

    // Format HostedGames to match the frontend match structure
    const allMatches = hostedGames.map(game => ({
      ...game,
      name: game.name || `${game.teams?.teamA?.name || 'Team A'} VS ${game.teams?.teamB?.name || 'Team B'}`,
      venue: game.ground?.name || game.city || "TBD Venue",
      // Normalize status to lowercase for frontend filtering
      status: game.status === "ACTIVE" ? "upcoming" : game.status.toLowerCase(),
      teams: game.teams ? [game.teams.teamA.name, game.teams.teamB.name] : ["TBD", "TBD"],
      isHostedGame: true
    }));

    console.log(`DEBUG: Found ${allMatches.length} hosted games for scorer`);
    
    const matchesScored = allMatches.filter(m => m.status === "completed").length;
    const upcomingMatches = allMatches.filter(m => m.status === "upcoming").length;

    // Fetch Real Revenue from Wallet
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [revenueData, revenueOverTimeRaw] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(scorerUserId), status: "SUCCESS", type: { $ne: "DEBIT" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      WalletTransaction.aggregate([
        { 
          $match: { 
            user: new mongoose.Types.ObjectId(scorerUserId), 
            status: "SUCCESS", 
            type: { $ne: "DEBIT" },
            createdAt: { $gte: sevenDaysAgo }
          } 
        },
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            revenue: { $sum: "$amount" } 
          } 
        },
        { $sort: { "_id": 1 } }
      ])
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    const responseData = {
      activeMatches: 0, // Default for now
      matchesScored,
      upcomingMatches,
      officialRating: scorerProfile.rating || 0,
      earnings: totalRevenue,
      totalRevenue,
      revenueOverTimeRaw,
      matchEngagement: [],
      matches: allMatches,
      upcomingAssignments: allMatches.filter(m => m.status === "upcoming").slice(0, 5).map(m => ({
        _id: m._id,
        match: m.name || "TBD Match",
        shortId: m.shortId,
        time: m.date ? `${new Date(m.date).toLocaleDateString()} - ${m.time || 'N/A'}` : 'TBD',
        venue: m.venue || "TBD Venue",
        role: "Official Scorer"
      }))
    };

    console.log("DEBUG: Sending successful response for scorer dashboard");
    res.json(responseData);
  } catch (error) {
    console.error("CRITICAL ERROR in getScorerDashboardData:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching scorer dashboard data", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const getOwnerCalendarData = async (req, res) => {
  const ownerId = new mongoose.Types.ObjectId(req.owner.id);
  const { date } = req.query; // Expecting YYYY-MM-DD
  
  try {
    const selectedDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // 1. Fetch all turfs for this owner
    // 1. Fetch all turfs for this owner (Support both ObjectId and String just in case)
    const turfs = await Turf.find({ 
      $or: [
        { owner: ownerId }, 
        { owner: req.owner.id }
      ]
    }).lean();
    const turfIds = turfs.map(t => t._id);

    if (turfs.length === 0) {
      return res.json({
        success: true,
        date: startOfDay,
        facilities: [],
        stats: { averageLoad: 0, confirmedSlots: 0, totalRevenue: 0 }
      });
    }

    // 2. Fetch all bookings for these turfs on the selected date
    const bookings = await Booking.find({ 
      turf: { $in: turfIds },
      status: { $ne: "CANCELLED" }
    })
    .populate({
      path: 'timeSlot',
      match: {
        startTime: { $gte: startOfDay, $lte: endOfDay }
      }
    })
    .populate('user', 'name profileImage')
    .lean();

    // Filter out bookings that don't have a matching timeSlot for this date
    const dailyBookings = bookings.filter(b => b.timeSlot);

    // 3. Process data for the calendar
    const calendarData = turfs.map(turf => {
      // Map generated slots and check if they are booked
      const slots = (turf.generatedSlots || []).map(slot => {
        const booking = dailyBookings.find(b => 
          b.turf.toString() === turf._id.toString() &&
          b.timeSlot.startTime &&
          new Date(b.timeSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) === slot.startTime
        );

        return {
          ...slot,
          isBooked: !!booking,
          bookingDetails: booking ? {
            userName: booking.user?.name || (booking.guestDetails?.name) || "Guest Player",
            totalPrice: booking.totalPrice,
            bookingId: booking._id,
            profileImage: booking.user?.profileImage,
            bookingSource: booking.bookingSource
          } : null
        };
      });

      return {
        id: turf._id,
        name: turf.name,
        category: turf.sportTypes?.[0] || "Other",
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

export const getDetailedOccupancyStats = async (req, res) => {
  const ownerId = req.owner.id;
    const { filter = 'week', turfId } = req.query; // week, month, year, day
    
    try {
      let turfIds = [];
      if (turfId) {
        turfIds = [new mongoose.Types.ObjectId(turfId)];
      } else {
        const turfs = await Turf.find({ owner: ownerId }).select("_id");
        turfIds = turfs.map(t => t._id);
      }

    // 1. Weekly Occupancy Grid (For the Heatmap)
    // We'll fetch all bookings for the current week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const weeklyBookings = await Booking.find({ 
      turf: { $in: turfIds },
      createdAt: { $gte: startOfWeek, $lte: endOfWeek } 
    })
    .populate("user", "name email phone")
    .populate("turf", "name")
    .populate("timeSlot", "startTime endTime")
    .lean();

    // Format for heatmap: { dayIndex, hour, bookings: [] }
    // dayIndex: 0 (Sun) to 6 (Sat)
    const heatmapData = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const slotsInThisHour = weeklyBookings.filter(b => {
          const bDate = new Date(b.timeSlot?.startTime || b.createdAt);
          return bDate.getDay() === d && bDate.getHours() === h;
        });

        heatmapData.push({
          day: d,
          hour: h,
          count: slotsInThisHour.length,
          details: slotsInThisHour.map(b => {
            const bStartTime = b.timeSlot?.startTime;
            const bEndTime = b.timeSlot?.endTime;
            return {
              id: b._id,
              user: b.user?.name || "Guest",
              email: b.user?.email,
              phone: b.user?.phone,
              turf: b.turf?.name,
              amount: b.totalPrice,
              time: bStartTime && bEndTime ? 
                `${new Date(bStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(bEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 
                "N/A"
            };
          })
        });
      }
    }

    // 2. Peak Hours Distribution (For the Graph)
    // Group by hour of day
    let dateFilter = {};
    const today = new Date();
    if (filter === 'day') {
      dateFilter = { createdAt: { $gte: new Date(today.setHours(0,0,0,0)) } };
    } else if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    } else if (filter === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: yearAgo } };
    }

    const peakHoursRaw = await Booking.aggregate([
      { $match: { turf: { $in: turfIds }, ...dateFilter } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill in missing hours
    const peakHours = Array.from({ length: 24 }, (_, i) => {
      const found = peakHoursRaw.find(p => p._id === i);
      return {
        hour: i,
        time: `${i % 12 || 12}${i < 12 ? 'AM' : 'PM'}`,
        count: found ? found.count : 0
      };
    });

    res.json({
      success: true,
      heatmap: heatmapData,
      peakHours,
      summary: {
        totalWeeklyBookings: weeklyBookings.length,
        peakTime: peakHours.reduce((prev, current) => (prev.count > current.count) ? prev : current).time
      }
    });

  } catch (error) {
    console.error("Error in getDetailedOccupancyStats:", error);
    res.status(500).json({ success: false, message: "Error fetching occupancy stats" });
  }
};
export const getOwnerCustomers = async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const turfs = await Turf.find({ owner: ownerId }).select("_id");
    const turfIds = turfs.map(t => t._id);

    // Aggregate unique customers from bookings
    const customerStats = await Booking.aggregate([
      { $match: { turf: { $in: turfIds } } },
      {
        $group: {
          _id: { $ifNull: ["$user", "$guestDetails.email"] },
          userId: { $first: "$user" },
          guestDetails: { $first: "$guestDetails" },
          totalRevenue: { $sum: "$totalPrice" },
          bookingCount: { $sum: 1 },
          lastActive: { $max: "$createdAt" },
          joinedDate: { $min: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: "$_id",
          name: { $ifNull: ["$userInfo.name", "$guestDetails.name", "Guest Player"] },
          email: { $ifNull: ["$userInfo.email", "$guestDetails.email", "N/A"] },
          phone: { $ifNull: ["$userInfo.phone", "$guestDetails.phone", "N/A"] },
          totalRevenue: 1,
          bookingCount: 1,
          lastActive: 1,
          joinedDate: 1,
          isRegistered: { $cond: [{ $ifNull: ["$userId", false] }, true, false] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Calculate Summary Stats
    const totalPlayers = customerStats.length;
    const activeUsers = customerStats.filter(c => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(c.lastActive) >= thirtyDaysAgo;
    }).length;
    
    const avgLtv = totalPlayers > 0 ? (customerStats.reduce((sum, c) => sum + c.totalRevenue, 0) / totalPlayers) : 0;
    
    // Simple retention: percentage of players with > 1 booking
    const returningPlayers = customerStats.filter(c => c.bookingCount > 1).length;
    const retentionRate = totalPlayers > 0 ? Math.round((returningPlayers / totalPlayers) * 100) : 0;

    res.json({
      customers: customerStats.map(c => {
        // Derive Status
        let status = "SILVER";
        if (c.totalRevenue > 20000 || c.bookingCount > 15) status = "ELITE";
        else if (c.totalRevenue > 10000 || c.bookingCount > 8) status = "GOLD";
        else if (c.totalRevenue > 5000 || c.bookingCount > 3) status = "PLATINUM";

        return {
          ...c,
          status,
          joinedFormatted: c.joinedDate ? `Joined ${format(new Date(c.joinedDate), "MMM yyyy")}` : "N/A",
          lastActiveFormatted: c.lastActive ? formatDistanceToNow(new Date(c.lastActive), { addSuffix: true }) : "Never"
        };
      }),
      stats: {
        totalPlayers,
        activeUsers,
        avgLtv,
        retentionRate
      }
    });

  } catch (error) {
    console.error("Error in getOwnerCustomers:", error);
    res.status(500).json({ success: false, message: "Error fetching customer directory" });
  }
};


