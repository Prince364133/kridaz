import Owner from "../../models/owner.model.js";
import WithdrawalRequest from "../../models/withdrawalRequest.model.js";
import * as argon2 from "argon2";

export const getBankingDetails = async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const owner = await Owner.findById(ownerId).select("bankingDetails walletBalance");
    res.status(200).json({ 
      success: true, 
      bankingDetails: owner.bankingDetails,
      walletBalance: owner.walletBalance || 0 
    });
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

    const currentDetails = owner.bankingDetails || {};

    owner.bankingDetails = {
      accountName,
      accountNumber,
      ifscCode,
      bankName,
      upiId,
      payoutMode,
      cancelledCheckUrl: cancelledCheckUrl || currentDetails.cancelledCheckUrl,
      kycStatus: currentDetails.kycStatus === "VERIFIED" ? "VERIFIED" : "PENDING"
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

export const requestPayout = async (req, res) => {
  const ownerId = req.owner.id;
  const { amount, password } = req.body;

  try {
    const owner = await Owner.findById(ownerId);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    // Verify password using argon2
    const isMatch = await argon2.verify(owner.password, password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid master password" });
    }

    // If amount is 0, we just return success for password verification
    if (amount === 0) {
      return res.status(200).json({ success: true, message: "Password verified successfully" });
    }

    // Verify balance
    if (owner.walletBalance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    if (amount < 5000) {
      return res.status(400).json({ success: false, message: "Minimum withdrawal amount is 5000 coins" });
    }

    if (amount > 300000) {
      return res.status(400).json({ success: false, message: "Maximum withdrawal limit is 300,000 coins" });
    }

    // Check if banking info exists
    const { bankingDetails } = owner;
    if (!bankingDetails || !bankingDetails.accountName) {
      return res.status(400).json({ success: false, message: "Please configure your banking details first" });
    }

    if (bankingDetails.payoutMode === "BANK" && (!bankingDetails.accountNumber || !bankingDetails.ifscCode)) {
      return res.status(400).json({ success: false, message: "Bank account number and IFSC code are required" });
    }

    if (bankingDetails.payoutMode === "UPI" && !bankingDetails.upiId) {
      return res.status(400).json({ success: false, message: "UPI ID is required for UPI payout" });
    }

    // Create Withdrawal Record
    const withdrawal = new WithdrawalRequest({
      owner: ownerId,
      amount,
      bankDetails: {
        accountName: bankingDetails.accountName,
        accountNumber: bankingDetails.accountNumber,
        ifscCode: bankingDetails.ifscCode,
        bankName: bankingDetails.bankName || (bankingDetails.payoutMode === "UPI" ? "UPI Transfer" : "Unknown Bank"),
        upiId: bankingDetails.upiId,
        payoutMode: bankingDetails.payoutMode
      }
    });

    // Deduct from wallet
    owner.walletBalance -= amount;
    
    await Promise.all([withdrawal.save(), owner.save()]);

    res.status(200).json({ 
      success: true, 
      message: `Withdrawal of ${amount} coins initiated to ${owner.bankingDetails.bankName}. Funds will reflect in 48-72 hours.` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
