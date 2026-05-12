import Owner from "../../models/owner.model.js";
import WithdrawalRequest from "../../models/withdrawalRequest.model.js";
import * as argon2 from "argon2";

export const getBankingDetails = async (req, res) => {
  const { id, ownerId } = req.owner;
  try {
    const owner = ownerId 
      ? await Owner.findById(ownerId).select("bankingDetails walletBalance")
      : await Owner.findOne({ userId: id }).select("bankingDetails walletBalance");
      
    if (!owner) {
      return res.status(404).json({ success: false, message: "Partner record not found" });
    }
    res.status(200).json({ 
      success: true, 
      bankingDetails: owner.bankingDetails || {},
      walletBalance: owner.walletBalance || 0 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBankingDetails = async (req, res) => {
  const { id, ownerId } = req.owner;
  const { accountName, accountNumber, ifscCode, bankName, upiId, payoutMode, cancelledCheckUrl } = req.body;
  try {
    const owner = ownerId 
      ? await Owner.findById(ownerId)
      : await Owner.findOne({ userId: id });
      
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
    // Friday is the fixed payout day (5)
    res.status(200).json({ success: true, settings: { payoutDay: 5 } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestPayout = async (req, res) => {
  const { id, ownerId } = req.owner;
  const { amount, password } = req.body;

  try {
    const owner = ownerId 
      ? await Owner.findById(ownerId)
      : await Owner.findOne({ userId: id });
      
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    // Verify password
    if (!password) {
      return res.status(400).json({ success: false, message: "Please enter your password" });
    }

    if (!owner.password) {
      return res.status(400).json({ 
        success: false, 
        message: "No master password set for this account. If you signed up via Google, please set a password in your profile settings." 
      });
    }

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
      return res.status(400).json({ success: false, message: "Minimum withdrawal amount is Rs 5000" });
    }

    if (amount > 300000) {
      return res.status(400).json({ success: false, message: "Maximum withdrawal limit is Rs 300,000" });
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
      message: `Withdrawal of Rs ${amount} initiated to ${owner.bankingDetails.bankName}. Funds will reflect in 48-72 hours.` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
