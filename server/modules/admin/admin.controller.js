import User from "../../models/user.model.js";
import Turf from "../../models/turf.model.js";
import Booking from "../../models/booking.model.js";
import OwnerRequest from "../../models/ownerRequest.model.js";
import Owner from "../../models/owner.model.js";
import Review from "../../models/review.model.js";
import WithdrawalRequest from "../../models/withdrawalRequest.model.js";
import SupportTicket from "../../models/supportTicket.model.js";
import Dispute from "../../models/dispute.model.js";
import CommunityPost from "../../models/communityPost.model.js";
import HostedGame from "../../models/hostedGame.model.js";
import AuditLog from "../../models/auditLog.model.js";
import Blog from "../../models/blog.model.js";
import Story from "../../models/story.model.js";
import Match from "../../models/match.model.js";
import WalletTransaction from "../../models/walletTransaction.model.js";
import Notification from "../../models/notification.model.js";
import Chat from "../../models/chat.model.js";
import Message from "../../models/message.model.js";
import generateEmail from "../../utils/generateEmail.js";
import { logAdminAction } from "../../utils/auditLogger.js";

/**
 * Helper to perform cascade deletion of all user-related data.
 * Purges posts, stories, games, bookings, reviews, and social interactions.
 */
const cleanupUserData = async (userIds) => {
  if (!Array.isArray(userIds)) userIds = [userIds];
  
  try {
    // Find associated Owner IDs before User deletion
    const owners = await Owner.find({ userId: { $in: userIds } });
    const ownerIds = owners.map(o => o._id);
    
    // 1. Content: Posts & Stories
    await CommunityPost.deleteMany({ adminId: { $in: userIds }, authorModel: 'User' });
    await Story.deleteMany({ userId: { $in: userIds }, userModel: 'User' });
    
    // 2. Gameplay: Games & Matches
    // Delete games where they are the host
    await HostedGame.deleteMany({ host: { $in: userIds } });
    
    // Handle owner-specific game data (umpires)
    if (ownerIds.length > 0) {
      await Match.deleteMany({ umpire: { $in: ownerIds } });
      await HostedGame.updateMany(
        { umpire: { $in: ownerIds } },
        { $set: { umpire: null, status: "PENDING" } }
      );
    }
    
    // 3. Transactions & Feedback
    await Booking.deleteMany({ user: { $in: userIds } });
    await Review.deleteMany({ user: { $in: userIds } });
    if (ownerIds.length > 0) {
      await Review.deleteMany({ professional: { $in: ownerIds } });
    }
    
    // 4. Requests & Lifecycle
    await OwnerRequest.deleteMany({ userId: { $in: userIds } });
    if (ownerIds.length > 0) {
      await WithdrawalRequest.deleteMany({ owner: { $in: ownerIds } });
      await Turf.deleteMany({ owner: { $in: ownerIds } });
    }
    
    // 5. Support & Disputes
    await SupportTicket.deleteMany({ user: { $in: userIds } });
    await Dispute.deleteMany({ raisedBy: { $in: userIds }, onModel: "User" });
    
    // 6. Wallet & Communication
    await WalletTransaction.deleteMany({ user: { $in: userIds } });
    await Notification.deleteMany({ recipient: { $in: userIds } });
    
    // 7. Social Cleanup: Pull ID from others' posts (likes/comments)
    await CommunityPost.updateMany(
      {},
      { 
        $pull: { 
          likes: { $in: userIds },
          comments: { userId: { $in: userIds } }
        } 
      }
    );
    
    // 8. Social Cleanup: Followers & Following
    await User.updateMany(
      {},
      { 
        $pull: { 
          followers: { $in: userIds },
          following: { $in: userIds }
        } 
      }
    );
    
    // 9. Messaging Cleanup
    await Chat.updateMany(
      {},
      { $pull: { users: { user: { $in: userIds } } } }
    );
    await Message.deleteMany({ "sender.user": { $in: userIds }, "sender.onModel": "User" });
    
    // 10. Game Slot Cleanup: Free up slots in others' games
    await HostedGame.updateMany(
      { "teams.teamA.slots.user": { $in: userIds } },
      { $set: { "teams.teamA.slots.$[elem].user": null, "teams.teamA.slots.$[elem].status": "OPEN" } },
      { arrayFilters: [{ "elem.user": { $in: userIds } }] }
    );
    await HostedGame.updateMany(
      { "teams.teamB.slots.user": { $in: userIds } },
      { $set: { "teams.teamB.slots.$[elem].user": null, "teams.teamB.slots.$[elem].status": "OPEN" } },
      { arrayFilters: [{ "elem.user": { $in: userIds } }] }
    );
    await HostedGame.updateMany(
      { "quickSlots.user": { $in: userIds } },
      { $set: { "quickSlots.$[elem].user": null, "quickSlots.$[elem].status": "OPEN" } },
      { arrayFilters: [{ "elem.user": { $in: userIds } }] }
    );

    // 11. Final purge of Owner records
    if (ownerIds.length > 0) {
      await Owner.deleteMany({ _id: { $in: ownerIds } });
    }
  } catch (error) {
    console.error("CASCADE_DELETION_ERROR:", error);
    throw error; // Propagate to controller for 500 response
  }
};

export const getAllUsers = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json({ success: true, message: "success", users });
  } catch (error) {
    console.error("Error in getAllUsers: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAdminDashboardData = async (req, res) => {
  try {
    const counts = await Promise.all([
      User.countDocuments().catch(e => 0),
      Owner.countDocuments({ role: { $in: ["owner", "VERIFIED_VENUE_OWNER", "BMSP_OWNER"] } }).catch(e => 0),
      Turf.countDocuments().catch(e => 0),
      Turf.countDocuments({ status: "pending" }).catch(e => 0),
      Booking.countDocuments().catch(e => 0),
      OwnerRequest.countDocuments({ status: "pending" }).catch(e => 0),
      Owner.countDocuments({ role: "coach" }).catch(e => 0),
      Owner.countDocuments({ role: "umpire" }).catch(e => 0),
      Owner.countDocuments({ role: "streamer" }).catch(e => 0),
      WithdrawalRequest.aggregate([{ $match: { status: "COMPLETED" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).catch(e => []),
      SupportTicket.countDocuments({ status: "OPEN" }).catch(e => 0),
      Dispute.countDocuments({ status: "PENDING" }).catch(e => 0),
      CommunityPost.countDocuments().catch(e => 0),
      HostedGame.countDocuments().catch(e => 0),
      Blog.countDocuments({ status: "published" }).catch(e => 0),
      User.aggregate([{ $group: { _id: null, total: { $sum: "$walletBalance" } } }]).catch(e => []),
    ]);
    
    const [
      totalUsers, 
      totalOwners, 
      totalTurfs, 
      pendingTurfs,
      totalBookings, 
      pendingRequests, 
      totalCoaches,
      totalUmpires,
      totalStreamers,
      payoutData,
      openTickets,
      pendingDisputes,
      totalCommunityPosts,
      totalHostedGames,
      publishedBlogs,
      userWalletData
    ] = counts;

    const recentAuditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('admin', 'name')
      .lean()
      .catch(e => []);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let bookingHistory = [];
    try {
      bookingHistory = await Booking.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            amount: { $sum: "$totalPrice" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            amount: 1,
            _id: 0,
          },
        },
      ]);
    } catch (aggErr) {
      bookingHistory = [];
    }

    const responseData = {
      totalUsers,
      totalOwners,
      totalTurfs,
      pendingTurfs,
      totalBookings,
      pendingRequests,
      totalCoaches,
      totalUmpires,
      totalStreamers,
      totalPayouts: payoutData[0]?.total || 0,
      openTickets,
      pendingDisputes,
      totalCommunityPosts,
      totalHostedGames,
      publishedBlogs,
      totalUserWalletBalance: userWalletData[0]?.total || 0,
      recentAuditLogs,
      bookingHistory: bookingHistory || [],
      platformHealth: {
        uptime: "99.9%",
        syncStatus: "Active",
        professionalGrowth: "+12%"
      }
    };
    
    return res.status(200).json(responseData);
  } catch (err) {
    console.error("CRITICAL ERROR in getAdminDashboardData:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error getting dashboard", 
      error: err.message
    });
  }
};

export const getAllTransactions = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const transactions = await Booking.find({}, { createdAt: 1, payment: 1, totalPrice: 1 })
      .populate("user", { name: 1, _id: 0 })
      .populate("turf", { name: 1, _id: 0 })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Fetched all transactions",
      transactions,
    });
  } catch (error) {
    console.error("Error in getAllTransactions: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllOwners = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const owners = await Owner.find({ role: { $in: ["owner", "VERIFIED_VENUE_OWNER", "BMSP_OWNER"] } }, { password: 0 });
    res.status(200).json({
      message: "Fetched all owners",
      owners,
    });
  } catch (error) {
    console.error("Error in getAllOwners: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTurfByOwnerId = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const turfs = await Turf.find({ owner: id }).lean();
    const owner = await Owner.findById(id).select("-password").lean();

    const turfsWithAvgRating = await Promise.all(
      turfs.map(async (turf) => {
        const reviews = await Review.find({ turf: turf._id });
        const totalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        return {
          ...turf,
          avgRating: Number(avgRating.toFixed(1)),
        };
      })
    );

    return res.status(200).json({
      message: "Fetched turf and owner",
      turfs: turfsWithAvgRating,
      owner
    });
  } catch (error) {
    console.error("Error in getTurfByOwnerId: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllRequestedOwners = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const ownerRequests = await OwnerRequest.find({ status: "pending", role: "owner" }).populate("userId", "profilePicture name");
    const ownerRejectedRequests = await OwnerRequest.find({
      status: "rejected",
      role: "owner"
    }).populate("userId", "profilePicture name");
    res.status(200).json({
      success: true,
      message: "success",
      ownerRequests,
      ownerRejectedRequests,
    });
  } catch (err) {
    console.error("Error in getAllRequestedOwners: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllProfessionals = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const professionals = await Owner.find({ role: { $in: ["coach", "umpire", "streamer"] } }, { password: 0 });
    res.status(200).json({
      message: "Fetched all professionals",
      professionals,
    });
  } catch (error) {
    console.error("Error in getAllProfessionals: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProfessionalDetails = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  
  try {
    const professional = await Owner.findById(id, { password: 0 })
      .populate({
        path: "bookings",
        populate: [
          { path: "turf", select: "name location" },
          { path: "user", select: "name profilePicture email phone" }
        ]
      })
      .lean();
      
    if (!professional) {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }

    // Fetch hosted games officiated by this umpire
    const matches = await HostedGame.find({ umpire: id })
      .populate("host", "name profilePicture email")
      .populate("ground", "name location")
      .sort({ date: -1 })
      .lean();

    // Fetch reviews (if applicable, using 'targetId' or 'owner')
    // We'll skip reviews if there's no direct schema support, but Owner has rating/numReviews.

    res.status(200).json({
      success: true,
      profile: professional,
      matches
    });
  } catch (error) {
    console.error("Error in getProfessionalDetails: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllRequestedProfessionals = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const professionalRequests = await OwnerRequest.find({ 
      status: "pending", 
      role: { $in: ["coach", "umpire", "streamer"] } 
    }).populate("userId", "profilePicture name");
    const professionalRejectedRequests = await OwnerRequest.find({
      status: "rejected",
      role: { $in: ["coach", "umpire", "streamer"] }
    }).populate("userId", "profilePicture name");
    res.status(200).json({
      success: true,
      message: "success",
      professionalRequests,
      professionalRejectedRequests,
    });
  } catch (err) {
    console.error("Error in getAllRequestedProfessionals: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllVerificationRequests = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const pendingRequests = await OwnerRequest.find({ status: "pending" }).populate("userId", "profilePicture name").sort({ createdAt: -1 });
    const rejectedRequests = await OwnerRequest.find({ status: "rejected" }).populate("userId", "profilePicture name").sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      pendingRequests,
      rejectedRequests,
    });
  } catch (err) {
    console.error("Error in getAllVerificationRequests: ", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const approveOwnerRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { adminName, adminDesignation } = req.body;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const ownerRequest = await OwnerRequest.findById(id);
    if (!ownerRequest) {
      return res.status(404).json({ success: false, message: "Owner request not found" });
    }

    // Check if an owner already exists with this email
    let owner = await Owner.findOne({ email: ownerRequest.email });
    
    if (!owner) {
      // If a userId is associated, get the user's password
      let password = "";
      let googleId = "";
      if (ownerRequest.userId) {
        const user = await User.findById(ownerRequest.userId);
        if (user) {
          password = user.password;
          googleId = user.googleId;
        }
      }

      owner = new Owner({
        userId: ownerRequest.userId,
        name: ownerRequest.name,
        email: ownerRequest.email,
        phone: ownerRequest.phone,
        password: password,
        googleId: googleId,
        role: ownerRequest.role,
        businessDetails: ownerRequest.businessDetails,
        verificationDocuments: ownerRequest.documents,
        approvalDetails: {
          adminName,
          adminDesignation,
          approvedAt: new Date()
        }
      });
      await owner.save();

      // Update User document to point to the new Owner document
      if (ownerRequest.userId) {
        await User.findByIdAndUpdate(ownerRequest.userId, { 
          ownerDetails: owner._id,
          role: ownerRequest.role // Sync role
        });
      }
    } else {
      // Update existing owner's role
      owner.role = ownerRequest.role;
      if (!owner.userId && ownerRequest.userId) owner.userId = ownerRequest.userId;
      owner.verificationDocuments = ownerRequest.documents;
      owner.approvalDetails = {
        adminName,
        adminDesignation,
        approvedAt: new Date()
      };
      await owner.save();

      // Update User document to point to the Owner document if needed
      if (ownerRequest.userId) {
        await User.findByIdAndUpdate(ownerRequest.userId, { 
          ownerDetails: owner._id,
          role: ownerRequest.role // Sync role
        });
      }
    }

    ownerRequest.status = "approved";
    await ownerRequest.save();
    
    const to = ownerRequest.email;
    const subject = "Your Professional Account has been Approved!";
    const html = ` 
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
        <h1 style="color: #4CAF50;">Congratulations!</h1>
        <p>Your request to become a <strong>${ownerRequest.role}</strong> on Kridaz has been approved.</p>
        <p>You can now access your dashboard using your existing login credentials:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.OWNER_URL || 'http://localhost:5173'}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; font-size: 16px; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br/>The Kridaz Team</p>
    </div>`;
    
    await generateEmail(to, subject, html);

    await logAdminAction(req, "APPROVE_PARTNER", "USER_MANAGEMENT", ownerRequest._id, {
      role: ownerRequest.role,
      email: ownerRequest.email
    });

    return res.status(200).json({ success: true, message: "Owner request approved and profile created" });
  } catch (err) {
    console.error("Error in approveOwnerRequest: ", err);
    return res.status(500).json({ message: "error", data: err.message });
  }
};

export const deleteOwnerRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const ownerRequest = await OwnerRequest.findById(id);
    if (!ownerRequest) {
      return res.status(404).json({ success: false, message: "Owner request not found" });
    }
    ownerRequest.status = "rejected";
    await ownerRequest.save();
    
    const to = ownerRequest.email;
    const subject = "Your request has been rejected";
    const html = ` 
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="color: #4CAF50;">Your request to become an owner has been rejected</h1>
        <p>We apologize for the inconvenience. Please contact us if you have any further questions.</p>
        <p>Thank you for your understanding.</p>
    </div>`;
    
    await generateEmail(to, subject, html);

    await logAdminAction(req, "REJECT_PARTNER", "USER_MANAGEMENT", ownerRequest._id, {
      role: ownerRequest.role,
      email: ownerRequest.email
    });

    return res.status(200).json({ success: true, message: "Owner request rejected" });
  } catch (err) {
    console.error("Error in deleteOwnerRequest: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const reconsiderOwnerRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const ownerRequest = await OwnerRequest.findById(id);
    if (!ownerRequest) {
      return res.status(404).json({ success: false, message: "Owner request not found" });
    }
    ownerRequest.status = "pending";
    await ownerRequest.save();
    
    const to = ownerRequest.email;
    const subject = "Your request has been reconsidered";
    const html = ` 
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="color: #4CAF50;">Your request to become an owner has been reconsidered</h1>
        <p>We apologize for the inconvenience. Please contact us if you have any further questions.</p>
        <p>Thank you for your understanding.</p>
    </div>`;
    
    await generateEmail(to, subject, html);
    return res.status(200).json({ success: true, message: "Owner request reconsidered" });
  } catch (err) {
    console.error("Error in reconsiderOwnerRequest: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllWithdrawalRequests = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const requests = await WithdrawalRequest.find()
      .populate("owner", "name email role walletBalance reservedBalance profilePicture")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("Error in getAllWithdrawalRequests: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const approveWithdrawalRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { transactionId } = req.body;

  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const request = await WithdrawalRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Withdrawal request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ success: false, message: `Request is already ${request.status.toLowerCase()}` });
    }

    const owner = await Owner.findById(request.owner);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    // Process the withdrawal
    owner.walletBalance -= request.amount;
    if (owner.reservedBalance >= request.amount) {
      owner.reservedBalance -= request.amount;
    }

    await owner.save();

    request.status = "COMPLETED";
    request.transactionId = transactionId;
    request.processedAt = new Date();
    await request.save();

    // Notify owner
    const to = owner.email;
    const subject = "Withdrawal Request Approved";
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4CAF50;">Withdrawal Successful!</h2>
        <p>Hello ${owner.name},</p>
        <p>Your withdrawal request for <strong>₹${request.amount}</strong> has been approved and processed.</p>
        <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
        <p>The funds should reflect in your bank account shortly.</p>
        <p>Best regards,<br/>The Kridaz Team</p>
      </div>
    `;
    await generateEmail(to, subject, html);

    await logAdminAction(req, "APPROVE_WITHDRAWAL", "FINANCE", request._id, {
      amount: request.amount,
      transactionId
    });

    res.status(200).json({ success: true, message: "Withdrawal approved and processed" });
  } catch (error) {
    console.error("Error in approveWithdrawalRequest: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const rejectWithdrawalRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { reason } = req.body;

  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const request = await WithdrawalRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Withdrawal request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ success: false, message: `Request is already ${request.status.toLowerCase()}` });
    }

    const owner = await Owner.findById(request.owner);
    if (owner && owner.reservedBalance >= request.amount) {
      owner.reservedBalance -= request.amount;
      await owner.save();
    }

    request.status = "REJECTED";
    request.rejectionReason = reason;
    request.processedAt = new Date();
    await request.save();

    if (owner) {
      const to = owner.email;
      const subject = "Withdrawal Request Rejected";
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #f44336;">Withdrawal Request Update</h2>
          <p>Hello ${owner.name},</p>
          <p>Your withdrawal request for <strong>₹${request.amount}</strong> has been rejected.</p>
          <p><strong>Reason:</strong> ${reason || "No specific reason provided."}</p>
          <p>The amount has been credited back to your usable wallet balance.</p>
          <p>Best regards,<br/>The Kridaz Team</p>
        </div>
      `;
      await generateEmail(to, subject, html);
    }

    await logAdminAction(req, "REJECT_WITHDRAWAL", "FINANCE", request._id, {
      amount: request.amount,
      reason
    });

    res.status(200).json({ success: true, message: "Withdrawal request rejected" });
  } catch (error) {
    console.error("Error in rejectWithdrawalRequest: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const verifyKYC = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { status } = req.body;

  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const owner = await Owner.findById(id);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    owner.bankingDetails.kycStatus = status;
    await owner.save();

    await logAdminAction(req, `KYC_${status}`, "USER_MANAGEMENT", owner._id, { status });

    res.status(200).json({ success: true, message: `KYC status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { status } = req.body;

  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    await logAdminAction(req, `USER_${status.toUpperCase()}`, "USER_MANAGEMENT", user._id, { status });

    res.status(200).json({ success: true, message: `User status updated to ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;

  if (admin !== "admin" && admin !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Perform cascade deletion of all related data
    await cleanupUserData(id);

    // Finally delete the user record
    await User.findByIdAndDelete(id);

    await logAdminAction(req, "DELETE_USER", "USER_MANAGEMENT", id, { 
      name: user.name, 
      email: user.email 
    });

    res.status(200).json({ success: true, message: "User and all associated data permanently deleted" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteOwner = async (req, res) => {
  const adminRole = req.admin.role;
  const { id } = req.params;

  if (adminRole !== "admin" && adminRole !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const owner = await Owner.findById(id);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    // If there's an associated User, perform full cascade cleanup starting from User
    if (owner.userId) {
      await cleanupUserData(owner.userId);
      await User.findByIdAndDelete(owner.userId);
    } else {
      // If no User ID (rare), just cleanup owner-specific data
      await Turf.deleteMany({ owner: id });
      await WithdrawalRequest.deleteMany({ owner: id });
      await HostedGame.updateMany({ umpire: id }, { $set: { umpire: null } });
      await Owner.findByIdAndDelete(id);
    }

    await logAdminAction(
      req,
      "DELETE_OWNER",
      "USER_MANAGEMENT",
      id,
      { name: owner.name, email: owner.email }
    );

    res.status(200).json({ success: true, message: "Owner and all associated data permanently deleted" });
  } catch (error) {
    console.error("Error in deleteOwner:", error);
    res.status(500).json({ message: error.message });
  }
};



export const getAllHostedGames = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole !== "admin" && adminRole !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const games = await HostedGame.find()
      .populate('host', 'name email profilePicture')
      .populate('ground', 'name location')
      .populate('umpire', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, games });
  } catch (error) {
    console.error("Error in getAllHostedGames:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteHostedGame = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole !== "admin" && adminRole !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    const game = await HostedGame.findByIdAndDelete(id);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    await logAdminAction(
      req,
      "DELETE_HOSTED_GAME",
      "GAME_MANAGEMENT",
      id,
      { gameDetails: { id, date: game.date, type: game.gameType } }
    );

    res.status(200).json({ success: true, message: "Game deleted successfully" });
  } catch (error) {
    console.error("Error in deleteHostedGame:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchDeleteGames = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole !== "admin" && adminRole !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { gameIds } = req.body;
  if (!gameIds || !Array.isArray(gameIds)) {
    return res.status(400).json({ success: false, message: "Invalid game IDs" });
  }

  try {
    const result = await HostedGame.deleteMany({ _id: { $in: gameIds } });

    await logAdminAction(
      req,
      "BATCH_DELETE_GAMES",
      "GAME_MANAGEMENT",
      null,
      { count: result.deletedCount, gameIds }
    );

    res.status(200).json({ success: true, message: `Successfully deleted ${result.deletedCount} games`, count: result.deletedCount });
  } catch (error) {
    console.error("Error in batchDeleteGames:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchUpdateGameStatus = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole !== "admin" && adminRole !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { gameIds, status } = req.body;
  if (!gameIds || !Array.isArray(gameIds) || !status) {
    return res.status(400).json({ success: false, message: "Invalid request parameters" });
  }

  try {
    const result = await HostedGame.updateMany(
      { _id: { $in: gameIds } },
      { $set: { status } }
    );

    await logAdminAction(
      req,
      "BATCH_GAME_STATUS_UPDATE",
      "GAME_MANAGEMENT",
      null,
      { count: result.modifiedCount, status, gameIds }
    );

    res.status(200).json({ success: true, message: `Successfully updated ${result.modifiedCount} games to ${status}`, count: result.modifiedCount });
  } catch (error) {
    console.error("Error in batchUpdateGameStatus:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchDeleteUsers = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole !== "admin" && adminRole !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ success: false, message: "Invalid user IDs" });
  }

  try {
    // Perform full cascade cleanup for all users
    await cleanupUserData(userIds);

    // Finally delete the user records
    const result = await User.deleteMany({ _id: { $in: userIds } });
    
    // Log the batch action
    await logAdminAction(
      req,
      "BATCH_DELETE_USERS",
      "USER_MANAGEMENT",
      null,
      { count: result.deletedCount, userIds }
    );

    res.status(200).json({ success: true, message: `Successfully deleted ${result.deletedCount} users and all associated data`, count: result.deletedCount });
  } catch (error) {
    console.error("Error in batchDeleteUsers:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchUpdateUserStatus = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole !== "admin" && adminRole !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { userIds, status } = req.body;
  if (!userIds || !Array.isArray(userIds) || !status) {
    return res.status(400).json({ success: false, message: "Invalid request parameters" });
  }

  try {
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { status } }
    );

    // Log the batch action
    await logAdminAction(
      req.admin._id,
      "BATCH_STATUS_UPDATE",
      "User",
      null,
      { count: result.modifiedCount, status, userIds },
      `Updated status to ${status} for ${result.modifiedCount} users via batch action`
    );

    res.status(200).json({ success: true, message: `Successfully updated ${result.modifiedCount} users to ${status}`, count: result.modifiedCount });
  } catch (error) {
    console.error("Error in batchUpdateUserStatus:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchDeleteOwners = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole !== "admin" && adminRole !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { ownerIds } = req.body;
  if (!ownerIds || !Array.isArray(ownerIds)) {
    return res.status(400).json({ success: false, message: "Invalid owner IDs" });
  }

  try {
    const owners = await Owner.find({ _id: { $in: ownerIds } });
    const userIds = owners.filter(o => o.userId).map(o => o.userId);

    // Delete associated User entries if they exist
    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } });
    }

    // Delete Owner entries
    const result = await Owner.deleteMany({ _id: { $in: ownerIds } });
    
    // Log the batch action
    await logAdminAction(
      req.admin._id,
      "BATCH_DELETE_OWNERS",
      "Owner",
      null,
      { count: result.deletedCount, ownerIds },
      `Permanently deleted ${result.deletedCount} owners/professionals via batch action`
    );

    res.status(200).json({ success: true, message: `Successfully deleted ${result.deletedCount} records`, count: result.deletedCount });
  } catch (error) {
    console.error("Error in batchDeleteOwners:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchUpdateOwnerStatus = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole !== "admin" && adminRole !== "BMSP_ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { ownerIds, status } = req.body;
  if (!ownerIds || !Array.isArray(ownerIds) || !status) {
    return res.status(400).json({ success: false, message: "Invalid request parameters" });
  }

  try {
    const result = await Owner.updateMany(
      { _id: { $in: ownerIds } },
      { $set: { status } }
    );

    // Also update associated User status if they exist
    const owners = await Owner.find({ _id: { $in: ownerIds } });
    const userIds = owners.filter(o => o.userId).map(o => o.userId);
    if (userIds.length > 0) {
      await User.updateMany({ _id: { $in: userIds } }, { $set: { status } });
    }

    // Log the batch action
    await logAdminAction(
      req.admin._id,
      "BATCH_OWNER_STATUS_UPDATE",
      "Owner",
      null,
      { count: result.modifiedCount, status, ownerIds },
      `Updated status to ${status} for ${result.modifiedCount} owners via batch action`
    );

    res.status(200).json({ success: true, message: `Successfully updated ${result.modifiedCount} records to ${status}`, count: result.modifiedCount });
  } catch (error) {
    console.error("Error in batchUpdateOwnerStatus:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


