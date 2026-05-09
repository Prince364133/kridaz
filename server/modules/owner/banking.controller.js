import Owner from "../../models/owner.model.js";

export const getBankingDetails = async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const owner = await Owner.findById(ownerId).select("bankingDetails");
    res.status(200).json({ success: true, bankingDetails: owner.bankingDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBankingDetails = async (req, res) => {
  const ownerId = req.owner.id;
  const { accountName, accountNumber, ifscCode, bankName, upiId, payoutMode, cancelledCheckUrl } = req.body;
  try {
    const owner = await Owner.findById(ownerId);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    owner.bankingDetails = {
      ...owner.bankingDetails,
      accountName,
      accountNumber,
      ifscCode,
      bankName,
      upiId,
      payoutMode,
      cancelledCheckUrl: cancelledCheckUrl || owner.bankingDetails.cancelledCheckUrl,
      kycStatus: "PENDING" // Mark as pending whenever details are updated
    };

    await owner.save();
    res.status(200).json({ success: true, message: "Banking details updated and sent for verification", bankingDetails: owner.bankingDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPayoutConfig = async (req, res) => {
  try {
    const SystemSetting = (await import("../../models/systemSetting.model.js")).default;
    const settings = await SystemSetting.findOne({ key: "PAYOUT_CONFIG" });
    res.status(200).json({ success: true, settings: settings?.value || { payoutDay: 6 } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
