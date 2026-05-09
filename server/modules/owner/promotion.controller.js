import Coupon from "../../models/coupon.model.js";
import Turf from "../../models/turf.model.js";

// Create a new promotion/coupon
export const createPromotion = async (req, res) => {
  try {
    const { code, discountType, discountValue, validUntil, usageLimit, turfId } = req.body;
    const ownerId = req.user.id;

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    // If a specific turf is selected, verify the owner owns it
    if (turfId && turfId !== "all") {
      const turf = await Turf.findOne({ _id: turfId, owner: ownerId });
      if (!turf) {
        return res.status(403).json({ message: "You do not own this turf" });
      }
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      ownerId,
      turfId: turfId === "all" ? null : turfId,
      discountType,
      discountValue,
      validUntil,
      usageLimit: usageLimit || 0
    });

    await newCoupon.save();
    res.status(201).json({ message: "Promotion created successfully", coupon: newCoupon });
  } catch (error) {
    console.error("Error creating promotion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all promotions for the logged-in owner
export const getPromotions = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const coupons = await Coupon.find({ ownerId }).populate("turfId", "name").sort({ createdAt: -1 });
    
    // Format the response for the frontend
    const formattedCoupons = coupons.map(c => ({
      _id: c._id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      validUntil: c.validUntil,
      usageLimit: c.usageLimit,
      timesUsed: c.timesUsed,
      isActive: c.isActive,
      turfName: c.turfId ? c.turfId.name : "All Grounds"
    }));

    res.status(200).json(formattedCoupons);
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a promotion
export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    const coupon = await Coupon.findOneAndDelete({ _id: id, ownerId });
    if (!coupon) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    res.status(200).json({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Toggle promotion status
export const togglePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    const coupon = await Coupon.findOne({ _id: id, ownerId });
    if (!coupon) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({ message: "Promotion status updated", isActive: coupon.isActive });
  } catch (error) {
    console.error("Error toggling promotion status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
