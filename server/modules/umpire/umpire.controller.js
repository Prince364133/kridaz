import { prisma } from "../../config/prisma.js";

// @desc    Get Umpire Profile
// @route   GET /api/umpire/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.umpireProfile.findUnique({
      where: { userId },
      include: {
        certifications: true,
        assignments: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Umpire profile not found" });
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create or Update Umpire Profile
// @route   PUT /api/umpire/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    // Upsert the profile
    const profile = await prisma.umpireProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        ...updateData,
        userId,
      },
    });

    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get Dashboard Stats
// @route   GET /api/umpire/dashboard
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.umpireProfile.findUnique({
      where: { userId },
      include: {
        assignments: {
          where: { assignmentStatus: "Pending" }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Umpire profile not found" });
    }

    const stats = {
      matchesOfficiated: profile.totalMatchesOfficiated || 0,
      earnings: profile.totalEarnings || 0,
      upcomingAssignments: profile.assignments.length || 0,
      kridazRating: profile.kridazRating || 0,
    };

    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
