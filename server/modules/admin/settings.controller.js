import SystemSetting from "../../models/systemSetting.model.js";
import { logAdminAction } from "../../utils/auditLogger.js";

export const getPayoutSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne({ key: "PAYOUT_CONFIG" });
    if (!settings) {
      settings = await SystemSetting.create({
        key: "PAYOUT_CONFIG",
        value: {
          payoutDay: 6, // 0 = Sunday, 6 = Saturday
          settlementTimeHrs: 48,
          minPayoutAmount: 500,
          coinConversionRate: 1
        },
        description: "Global payout configuration"
      });
    }
    res.status(200).json({ success: true, settings: settings.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePayoutSettings = async (req, res) => {
  const { payoutDay, settlementTimeHrs, minPayoutAmount } = req.body;
  try {
    const settings = await SystemSetting.findOneAndUpdate(
      { key: "PAYOUT_CONFIG" },
      { 
        value: { 
          payoutDay, 
          settlementTimeHrs, 
          minPayoutAmount,
          coinConversionRate: 1 
        },
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    await logAdminAction(req, "UPDATE_PAYOUT_SETTINGS", "SYSTEM_SETTINGS", settings._id, req.body);

    res.status(200).json({ success: true, settings: settings.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
