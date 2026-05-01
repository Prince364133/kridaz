import User from "../../models/user.model.js";
import Turf from "../../models/turf.model.js";
import Booking from "../../models/booking.model.js";
import OwnerRequest from "../../models/ownerRequest.model.js";
import Owner from "../../models/owner.model.js";
import Review from "../../models/review.model.js";
import generateEmail from "../../utils/generateEmail.js";

export const getAllUsers = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin") {
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
  console.log("Starting getAdminDashboardData fetch...");
  try {
    console.log("Fetching counts...");
    const counts = await Promise.all([
      User.countDocuments().catch(e => { console.error("User count failed:", e); return 0; }),
      Owner.countDocuments({ role: "owner" }).catch(e => { console.error("Owner count failed:", e); return 0; }),
      Turf.countDocuments().catch(e => { console.error("Turf count failed:", e); return 0; }),
      Booking.countDocuments().catch(e => { console.error("Booking count failed:", e); return 0; }),
      OwnerRequest.countDocuments({ status: "pending" }).catch(e => { console.error("PendingReq count failed:", e); return 0; }),
      OwnerRequest.countDocuments({ status: "rejected" }).catch(e => { console.error("RejectedReq count failed:", e); return 0; }),
    ]);
    
    const [totalUsers, totalOwners, totalTurfs, totalBookings, pendingRequests, rejectedRequests] = counts;
    console.log("Counts fetched successfully:", { totalUsers, totalOwners, totalTurfs });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log("Running booking aggregation...");
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
      console.log("Aggregation completed. Results:", bookingHistory?.length || 0);
    } catch (aggErr) {
      console.warn("Aggregation failed (possibly empty collection):", aggErr.message);
      bookingHistory = [];
    }

    const responseData = {
      totalUsers,
      totalOwners,
      totalTurfs,
      totalBookings,
      pendingRequests,
      rejectedRequests,
      bookingHistory: bookingHistory || [],
    };
    
    console.log("Dashboard data ready. Sending response.");
    return res.status(200).json(responseData);
  } catch (err) {
    console.error("CRITICAL ERROR in getAdminDashboardData:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error getting dashboard", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const getAllTransactions = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin") {
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
  if (admin !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const owners = await Owner.find({ role: "owner" }, { password: 0 });
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
  if (admin !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const turfs = await Turf.find({ owner: id }).lean();
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
      message: "Fetched turf",
      turfs: turfsWithAvgRating,
    });
  } catch (error) {
    console.error("Error in getTurfByOwnerId: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllRequestedOwners = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const ownerRequests = await OwnerRequest.find({ status: "pending" });
    const ownerRejectedRequests = await OwnerRequest.find({
      status: "rejected",
    });
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

export const approveOwnerRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin !== "admin") {
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
        businessDetails: ownerRequest.businessDetails, // We should add this to Owner model too if needed
      });
      await owner.save();
    } else {
      // Update existing owner's role
      owner.role = ownerRequest.role;
      // owner.businessDetails = ownerRequest.businessDetails;
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
    return res.status(200).json({ success: true, message: "Owner request approved and profile created" });
  } catch (err) {
    console.error("Error in approveOwnerRequest: ", err);
    return res.status(500).json({ message: "error", data: err.message });
  }
};

export const deleteOwnerRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin !== "admin") {
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
    return res.status(200).json({ success: true, message: "Owner request rejected" });
  } catch (err) {
    console.error("Error in deleteOwnerRequest: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const reconsiderOwnerRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin !== "admin") {
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
