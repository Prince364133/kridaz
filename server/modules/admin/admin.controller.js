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
  try {
    const totalUsers = await User.countDocuments();
    const totalOwners = await Owner.countDocuments({ role: "owner" });
    const totalTurfs = await Turf.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingRequests = await OwnerRequest.countDocuments({
      status: "pending",
    });
    const rejectedRequests = await OwnerRequest.countDocuments({
      status: "rejected",
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const bookingHistory = await Booking.aggregate([
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
    return res.status(200).json({
      totalUsers,
      totalOwners,
      totalTurfs,
      totalBookings,
      pendingRequests,
      rejectedRequests,
      bookingHistory,
    });
  } catch (err) {
    console.error("Error getting dashboard:", err.message);
    return res.status(500).json({ message: "Error getting dashboard" });
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
    ownerRequest.status = "approved";
    await ownerRequest.save();
    
    const to = ownerRequest.email;
    const subject = "Your request has been approved";
    const html = ` 
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="color: #4CAF50;">Your request to become an owner has been approved</h1>
        <p>Congratulations! You can now create your account by clicking the button below:</p>
        <button style="background-color: #4CAF50; border: none; padding: 10px 20px; text-align: center; display: inline-block; margin: 10px 0; cursor: pointer; border-radius: 5px;">
            <a href="${process.env.OWNER_URL}" style="color: white; text-decoration: none; font-size: 16px;">Create your account</a>
        </button>
    </div>`;
    
    await generateEmail(to, subject, html);
    return res.status(200).json({ success: true, message: "Owner request approved" });
  } catch (err) {
    console.error("Error in approveOwnerRequest: ", err);
    return res.status(500).json({ message: "error", data: err });
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
