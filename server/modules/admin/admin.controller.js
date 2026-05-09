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
import generateEmail from "../../utils/generateEmail.js";
import { logAdminAction } from "../../utils/auditLogger.js";

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
    const professionals = await Owner.find({ role: { $in: ["coach", "umpire"] } }, { password: 0 });
    res.status(200).json({
      message: "Fetched all professionals",
      professionals,
    });
  } catch (error) {
    console.error("Error in getAllProfessionals: ", error);
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
      role: { $in: ["coach", "umpire"] } 
    }).populate("userId", "profilePicture name");
    const professionalRejectedRequests = await OwnerRequest.find({
      status: "rejected",
      role: { $in: ["coach", "umpire"] }
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
    } else {
      // Update existing owner's role
      owner.role = ownerRequest.role;
      owner.verificationDocuments = ownerRequest.documents;
      owner.approvalDetails = {
        adminName,
        adminDesignation,
        approvedAt: new Date()
      };
      await owner.save();
    }

    ownerRequest.status = "approved";
    await ownerRequest.save();
    
    const to = ownerRequest.email;
    const subject = "Your Professional Account has been Approved!";
    const html = ` 
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
        <h1 style="color: #4CAF50;">Congratulations!</h1>
        <p>Your request to become a <strong>${ownerRequest.role}</strong> on TurfSpot has been approved.</p>
        <p>You can now access your dashboard using your existing login credentials:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.OWNER_URL || 'http://localhost:5173'}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; font-size: 16px; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br/>The TurfSpot Team</p>
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
        <p>Best regards,<br/>The BookMySportz Team</p>
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
          <p>Best regards,<br/>The BookMySportz Team</p>
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
