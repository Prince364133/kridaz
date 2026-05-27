import React, { useState, useEffect } from "react";
import { 
  IndianRupee, 
  Landmark, 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import axios from "axios";

const PayoutsTab = ({ role }) => {
  const [banking, setBanking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payoutMode, setPayoutMode] = useState("BANK"); // BANK or UPI
  
  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackType, setFeedbackType] = useState("success"); // success or error

  // Fetch Banking details & wallet balances from API
  const fetchBankingDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get("/api/owner/banking", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setBanking(res.data);
        const details = res.data.bankingDetails || {};
        setAccountName(details.accountName || "");
        setAccountNumber(details.accountNumber || "");
        setIfscCode(details.ifscCode || "");
        setBankName(details.bankName || "");
        setUpiId(details.upiId || "");
        setPayoutMode(details.payoutMode || "BANK");
      }
    } catch (err) {
      console.error("Failed to load banking details", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingDetails();
  }, []);

  // Save Banking Configuration
  const handleSaveBanking = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");
    setIsSavingDetails(true);
    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        accountName,
        payoutMode,
        ...(payoutMode === "BANK" ? { accountNumber, ifscCode, bankName } : { upiId })
      };
      
      const res = await axios.put("/api/owner/banking", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data) {
        setFeedbackType("success");
        setFeedbackMsg("Banking configurations saved successfully!");
        fetchBankingDetails();
      }
    } catch (err) {
      setFeedbackType("error");
      setFeedbackMsg(err.response?.data?.message || "Failed to save banking configurations.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Submit Withdrawal Request
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");
    
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFeedbackType("error");
      setFeedbackMsg("Please enter a valid withdrawal amount.");
      return;
    }

    if (amountNum > parseFloat(banking?.walletBalance || 0)) {
      setFeedbackType("error");
      setFeedbackMsg("Insufficient usable balance in wallet.");
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.post("/api/owner/banking/payout", { amount: amountNum }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data) {
        setFeedbackType("success");
        setFeedbackMsg("Withdrawal request submitted successfully! Pending approval.");
        setWithdrawAmount("");
        fetchBankingDetails();
      }
    } catch (err) {
      setFeedbackType("error");
      setFeedbackMsg(err.response?.data?.message || "Failed to process withdrawal request.");
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const walletBalance = parseFloat(banking?.walletBalance || 0);

  return (
    <div className="space-y-6 text-white font-inter">
      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1C2020] to-[#121212] border border-[#2D2D2D] relative overflow-hidden">
          <div className="absolute right-2 top-2 p-3 opacity-10">
            <IndianRupee size={80} />
          </div>
          <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">Usable Balance</span>
          <h2 className="text-3xl font-extrabold text-[#55DEE8] mt-2">₹{walletBalance.toFixed(2)}</h2>
          <p className="text-[10px] text-[#878C9F] mt-2">Available for immediate withdrawal</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] relative">
          <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">Reserved Escrow</span>
          <h2 className="text-2xl font-bold text-white mt-2">₹0.00</h2>
          <p className="text-[10px] text-[#878C9F] mt-2">Locked for ongoing matching requests</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] relative">
          <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">Total Earnings</span>
          <h2 className="text-2xl font-bold text-white mt-2">₹{walletBalance.toFixed(2)}</h2>
          <p className="text-[10px] text-[#878C9F] mt-2">Lifetime revenue generated on platform</p>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${feedbackType === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {feedbackType === "success" ? <CheckCircle size={20} className="flex-shrink-0" /> : <AlertCircle size={20} className="flex-shrink-0" />}
          <span className="text-sm font-medium">{feedbackMsg}</span>
        </div>
      )}

      {/* Forms Section: withdrawal & Banking Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Payout Form */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] space-y-6">
          <div className="flex items-center gap-2.5 border-b border-[#2D2D2D] pb-4">
            <ArrowUpRight size={20} className="text-[#55DEE8]" />
            <h3 className="text-lg font-bold tracking-tight">Withdraw Funds</h3>
          </div>

          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">Amount to Withdraw (INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-lg font-bold text-gray-500">₹</span>
                <input 
                  type="number" 
                  min={1}
                  step="any"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-black border border-[#2D2D2D] rounded-xl pl-10 pr-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-[#55DEE8] transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmittingPayout || walletBalance <= 0}
              className="w-full bg-[#55DEE8] hover:bg-[#44cdd7] disabled:bg-gray-600 disabled:text-gray-400 text-black font-semibold rounded-xl py-3.5 transition-colors text-sm"
            >
              {isSubmittingPayout ? "Processing Payout..." : "Withdraw to Bank"}
            </button>
          </form>
        </div>

        {/* Banking Config Form */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] space-y-6">
          <div className="flex items-center gap-2.5 border-b border-[#2D2D2D] pb-4">
            <Landmark size={20} className="text-[#55DEE8]" />
            <h3 className="text-lg font-bold tracking-tight">Payout Account Settings</h3>
          </div>

          <div className="flex bg-black p-1 rounded-xl border border-[#2D2D2D] gap-2">
            <button
              onClick={() => setPayoutMode("BANK")}
              className={`flex-1 font-semibold text-xs py-2 rounded-lg transition-all ${payoutMode === "BANK" ? "bg-[#222] text-[#55DEE8]" : "text-[#878C9F] hover:text-white"}`}
            >
              Bank Account
            </button>
            <button
              onClick={() => setPayoutMode("UPI")}
              className={`flex-1 font-semibold text-xs py-2 rounded-lg transition-all ${payoutMode === "UPI" ? "bg-[#222] text-[#55DEE8]" : "text-[#878C9F] hover:text-white"}`}
            >
              UPI ID
            </button>
          </div>

          <form onSubmit={handleSaveBanking} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] text-[#878C9F] uppercase tracking-wider">Account Holder Name</label>
              <input 
                type="text" 
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Name as in Bank Account"
                className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#55DEE8] transition-colors"
              />
            </div>

            {payoutMode === "BANK" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#878C9F] uppercase tracking-wider">Bank Name</label>
                    <input 
                      type="text" 
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., HDFC Bank"
                      className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#55DEE8] transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#878C9F] uppercase tracking-wider">IFSC Code</label>
                    <input 
                      type="text" 
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="IFSC Code"
                      className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#55DEE8] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#878C9F] uppercase tracking-wider">Account Number</label>
                  <input 
                    type="text" 
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter Account Number"
                    className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#55DEE8] transition-colors"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] text-[#878C9F] uppercase tracking-wider">UPI ID / VPA</label>
                <input 
                  type="text" 
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                  className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#55DEE8] transition-colors"
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isSavingDetails}
              className="w-full bg-[#222] border border-[#2D2D2D] hover:bg-[#333] hover:border-[#55DEE8]/30 text-white font-semibold rounded-xl py-3.5 transition-colors text-sm"
            >
              {isSavingDetails ? "Saving Configuration..." : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PayoutsTab;
