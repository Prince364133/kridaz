import FeatureFlag from "../models/featureFlag.model.js";

// @desc    Get all feature flags
// @route   GET /api/features
// @access  Public
export const getAllFeatureFlags = async (req, res) => {
  try {
    const flags = await FeatureFlag.find({});
    // Convert array to an object map { key: enabled } for easier frontend consumption
    const flagMap = flags.reduce((acc, flag) => {
      acc[flag.key] = flag.enabled;
      return acc;
    }, {});

    res.status(200).json({ success: true, data: flags, flagsMap: flagMap });
  } catch (error) {
    console.error("Error in getAllFeatureFlags:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Toggle feature flag
// @route   PUT /api/admin/features/:key
// @access  Private/Admin
export const toggleFeatureFlag = async (req, res) => {
  try {
    const { key } = req.params;
    const { enabled } = req.body;

    let flag = await FeatureFlag.findOne({ key });

    if (!flag) {
      return res.status(404).json({ success: false, message: "Feature flag not found" });
    }

    flag.enabled = enabled !== undefined ? enabled : !flag.enabled;
    await flag.save();

    res.status(200).json({ success: true, data: flag });
  } catch (error) {
    console.error("Error in toggleFeatureFlag:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create/Seed initial feature flags (Internal use or setup)
// @route   POST /api/admin/features/seed
// @access  Private/Admin
export const seedFeatureFlags = async (req, res) => {
  try {
    const defaultFlags = [
      {
        key: "find_professionals",
        name: "Find Professionals Section",
        description: "Show the Find Professionals card section on the landing page.",
        enabled: true,
      },
      {
        key: "join_games",
        name: "Join Games Near You Section",
        description: "Show the Join Games Near You card section on the landing page.",
        enabled: true,
      },
    ];

    for (const df of defaultFlags) {
      await FeatureFlag.updateOne({ key: df.key }, { $set: df }, { upsert: true });
    }

    const allFlags = await FeatureFlag.find({});
    res.status(200).json({ success: true, data: allFlags, message: "Flags seeded successfully" });
  } catch (error) {
    console.error("Error in seedFeatureFlags:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
