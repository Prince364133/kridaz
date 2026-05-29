import React, { useState, useEffect } from "react";
import { 
  IndianRupee, 
  Landmark, 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Edit2,
  Calendar,
  X,
  FileText,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";

const PayoutsTab = ({ role }) => {
  const [banking, setBanking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Banking Form state
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payoutMode, setPayoutMode] = useState("BANK"); // BANK or UPI
  
  // UI States
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  
  // Card Description Toggles
  const [activeDescCard, setActiveDescCard] = useState(null); // 'usable', 'reserved', 'dispute', 'lifetime' or null
  
  // Feedback
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackType, setFeedbackType] = useState("success");

  // Lifetime Earnings Filter state
  const [earningsFilter, setEarningsFilter] = useState("ALL_TIME"); // TODAY, 7_DAYS, THIS_MONTH, LAST_MONTH, CUSTOM
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  // Mock comparison chart data based on filter selection
  const [chartData, setChartData] = useState([]);

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
        
        // If banking details aren't fully configured, force edit mode to display form at top
        if (!details.accountName) {
          setIsEditingBank(true);
        } else {
          setIsEditingBank(false);
        }
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

  // Generate comparison graph data
  useEffect(() => {
    // Generate mock graph comparing current selection/month with previous
    setChartData([
      { name: "Week 1", "Previous Month": 4200, "This Month": 5100 },
      { name: "Week 2", "Previous Month": 3800, "This Month": 6200 },
      { name: "Week 3", "Previous Month": 5500, "This Month": 4800 },
      { name: "Week 4", "Previous Month": 6100, "This Month": 7300 },
    ]);
  }, [earningsFilter, customStartDate, customEndDate]);

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
        setFeedbackMsg("Banking configurations saved successfully and sent for pending verification!");
        setIsEditingBank(false);
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
        setFeedbackMsg("Withdrawal request submitted successfully! Pending admin approval.");
        setWithdrawAmount("");
        setIsWithdrawModalOpen(false);
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
  const reservedBalance = parseFloat(banking?.reservedBalance || 0);
  const disputeBalance = parseFloat(banking?.disputeBalance || 0);
  const withdrawnBalance = parseFloat(banking?.withdrawnBalance || 0);

  // Calculate Lifetime Earning based on live balances
  const getFilteredLifetimeEarning = () => {
    return walletBalance + reservedBalance + disputeBalance + withdrawnBalance;
  };

  const hasConfiguredBank = banking?.bankingDetails && banking.bankingDetails.accountName;
  const kycStatus = banking?.bankingDetails?.kycStatus || "PENDING";

  return (
    <div className="space-y-6 text-white font-inter">
      {/* feedback message banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-300 ${feedbackType === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {feedbackType === "success" ? <CheckCircle size={20} className="flex-shrink-0" /> : <AlertCircle size={20} className="flex-shrink-0" />}
          <span className="text-sm font-medium flex-1">{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg("")} className="text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* TOP BANK DETAILS SECTION */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#141414] to-[#0d0d0d] border border-[#2D2D2D] space-y-6 relative overflow-hidden">
        {/* Glow element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#BFF367]/5 blur-[80px] pointer-events-none" />

        {isEditingBank ? (
          // BANK CONFIGURATION INPUT FORM
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-4">
              <div className="flex items-center gap-2.5">
                <Landmark size={22} className="text-[#BFF367]" />
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Configure Payout Destination</h3>
                  <p className="text-xs text-gray-400">Fill details to request payouts. Verification status will show as pending.</p>
                </div>
              </div>
              {hasConfiguredBank && (
                <button 
                  onClick={() => setIsEditingBank(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#222] hover:bg-[#333] text-xs font-semibold border border-white/5 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex bg-black p-1 rounded-xl border border-[#2D2D2D] gap-2 max-w-xs">
              <button
                type="button"
                onClick={() => setPayoutMode("BANK")}
                className={`flex-1 font-bold text-xs py-2 rounded-lg transition-all uppercase tracking-wider ${payoutMode === "BANK" ? "bg-[#222] text-[#BFF367]" : "text-[#878C9F] hover:text-white"}`}
              >
                Bank Account
              </button>
              <button
                type="button"
                onClick={() => setPayoutMode("UPI")}
                className={`flex-1 font-bold text-xs py-2 rounded-lg transition-all uppercase tracking-wider ${payoutMode === "UPI" ? "bg-[#222] text-[#BFF367]" : "text-[#878C9F] hover:text-white"}`}
              >
                UPI ID
              </button>
            </div>

            <form onSubmit={handleSaveBanking} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs text-[#878C9F] font-bold uppercase tracking-widest ml-1">Account Holder Name</label>
                <input 
                  type="text" 
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Name as in Bank Account"
                  className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BFF367] transition-colors"
                />
              </div>

              {payoutMode === "BANK" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs text-[#878C9F] font-bold uppercase tracking-widest ml-1">Bank Name</label>
                    <input 
                      type="text" 
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., HDFC Bank"
                      className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BFF367] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-[#878C9F] font-bold uppercase tracking-widest ml-1">IFSC Code</label>
                    <input 
                      type="text" 
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="IFSC Code"
                      className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BFF367] transition-colors font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-[#878C9F] font-bold uppercase tracking-widest ml-1">Account Number</label>
                    <input 
                      type="text" 
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter Account Number"
                      className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BFF367] transition-colors font-mono"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs text-[#878C9F] font-bold uppercase tracking-widest ml-1">UPI ID / VPA</label>
                  <input 
                    type="text" 
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BFF367] transition-colors font-mono"
                  />
                </div>
              )}

              <div className="md:col-span-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSavingDetails}
                  className="w-full md:w-auto px-8 bg-[#BFF367] hover:bg-[#aee057] text-black font-extrabold rounded-xl py-3.5 transition-all text-sm shadow-[0_0_20px_rgba(191,243,103,0.15)] uppercase tracking-wider"
                >
                  {isSavingDetails ? "Saving Configuration..." : "Submit Bank Details for Verification"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // CONFIGURED BANK VIEW (ICON + VERIFICATION STATUS)
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#BFF367]/10 flex items-center justify-center border border-[#BFF367]/20">
                <Landmark size={28} className="text-[#BFF367]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h4 className="font-bold text-white tracking-tight text-lg">
                    {payoutMode === "BANK" ? bankName : "UPI Payment Destination"}
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    kycStatus === "VERIFIED" 
                      ? "bg-green-500/10 text-green-400 border-green-500/20" 
                      : kycStatus === "REJECTED" 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  }`}>
                    {kycStatus === "VERIFIED" ? "Verified" : kycStatus === "REJECTED" ? "Rejected" : "Verification Pending"}
                  </span>
                </div>
                <p className="text-xs text-[#878C9F] font-semibold uppercase tracking-widest font-mono">
                  {payoutMode === "BANK" 
                    ? `A/C Number: *******${accountNumber.slice(-4)} (${accountName})`
                    : `UPI ID: ${upiId} (${accountName})`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setIsEditingBank(true)}
                className="flex-1 md:flex-initial px-4 py-3 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2D2D2D] rounded-xl text-xs font-bold text-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 size={14} />
                Edit Bank details
              </button>
              
              <button 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={walletBalance <= 0 || kycStatus !== "VERIFIED"}
                className="flex-1 md:flex-initial px-6 py-3 bg-[#BFF367] hover:bg-[#aee057] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(191,243,103,0.1)]"
              >
                <ArrowUpRight size={15} />
                Withdrawal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOUR FINANCIAL BOXES (2 per row layout) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 1: Usable Balance */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#141414] to-[#0f0f0f] border border-[#2D2D2D] relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute right-2 top-2 text-[#BFF367]/5 pointer-events-none">
            <IndianRupee size={50} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#878C9F] font-bold uppercase tracking-[0.15em]">Usable Balance</span>
              <button 
                onClick={() => setActiveDescCard(activeDescCard === "usable" ? null : "usable")}
                className="text-gray-500 hover:text-white transition-colors"
                title="View Details"
              >
                <Info size={13} />
              </button>
            </div>
            <h2 className="text-xl font-black text-[#BFF367] mt-1 tracking-tight">₹{walletBalance.toFixed(2)}</h2>
          </div>
          {activeDescCard === "usable" ? (
            <div className="text-[9px] text-gray-300 mt-2 bg-black/40 p-1.5 rounded border border-white/5 animate-in fade-in duration-200">
              Available for immediate withdrawal request.
            </div>
          ) : (
            <div className="text-[9px] text-gray-500 mt-2 flex items-center gap-1">
              <CheckCircle size={10} className="text-green-500" /> Ready
            </div>
          )}
        </div>

        {/* Card 2: Reserved Escrow */}
        <div className="p-4 rounded-xl bg-[#141414] border border-[#2D2D2D] relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#878C9F] font-bold uppercase tracking-[0.15em]">Reserved Escrow</span>
              <button 
                onClick={() => setActiveDescCard(activeDescCard === "reserved" ? null : "reserved")}
                className="text-gray-500 hover:text-white transition-colors"
                title="View Details"
              >
                <Info size={13} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 tracking-tight">₹{reservedBalance.toFixed(2)}</h2>
          </div>
          {activeDescCard === "reserved" ? (
            <div className="text-[9px] text-gray-300 mt-2 bg-black/40 p-1.5 rounded border border-white/5 animate-in fade-in duration-200">
              Released to usable balance automatically upon successful match completion.
            </div>
          ) : (
            <div className="text-[9px] text-gray-500 mt-2 flex items-center gap-1">
              <Clock size={10} className="text-yellow-500" /> Pending Match
            </div>
          )}
        </div>

        {/* Card 3: Dispute Balance */}
        <div className="p-4 rounded-xl bg-[#141414] border border-[#2D2D2D] relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#878C9F] font-bold uppercase tracking-[0.15em]">Conflict Balance</span>
              <button 
                onClick={() => setActiveDescCard(activeDescCard === "dispute" ? null : "dispute")}
                className="text-gray-500 hover:text-white transition-colors"
                title="View Details"
              >
                <Info size={13} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 tracking-tight">₹{disputeBalance.toFixed(2)}</h2>
          </div>
          {activeDescCard === "dispute" ? (
            <div className="text-[9px] text-gray-300 mt-2 bg-black/40 p-1.5 rounded border border-white/5 animate-in fade-in duration-200">
              Under review due to dispute/claims raised within 12 hours of match ending.
            </div>
          ) : (
            <div className="text-[9px] text-gray-500 mt-2 flex items-center gap-1">
              <AlertTriangle size={10} className="text-red-500" /> On hold
            </div>
          )}
        </div>

        {/* Card 4: Total Lifetime Earnings with Filtering */}
        <div className="p-4 rounded-xl bg-[#141414] border border-[#2D2D2D] relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#878C9F] font-bold uppercase tracking-[0.15em]">Lifetime Earnings</span>
              <button 
                onClick={() => setActiveDescCard(activeDescCard === "lifetime" ? null : "lifetime")}
                className="text-gray-500 hover:text-white transition-colors"
                title="View Details"
              >
                <Info size={13} />
              </button>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <h2 className="text-xl font-bold text-white tracking-tight">₹{getFilteredLifetimeEarning().toLocaleString()}</h2>
              {/* Filter Dropdown */}
              <select
                value={earningsFilter}
                onChange={(e) => setEarningsFilter(e.target.value)}
                className="bg-black/60 border border-[#2D2D2D] text-[9px] font-bold text-white rounded px-1.5 py-1 focus:outline-none focus:border-[#BFF367] transition-all cursor-pointer w-fit max-w-full"
              >
                <option value="ALL_TIME">All Time</option>
                <option value="TODAY">Today's Journey</option>
                <option value="7_DAYS">Last 7 Days</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="CUSTOM">Custom Date Range</option>
              </select>
            </div>
          </div>

          {earningsFilter === "CUSTOM" && (
            <div className="flex flex-col gap-1 mt-2 p-1.5 bg-black/40 rounded border border-white/5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-1">
                <DatePicker
                  selected={customStartDate}
                  onChange={(date) => setCustomStartDate(date)}
                  placeholderText="Start"
                  className="bg-black border border-[#2D2D2D] rounded px-1 py-0.5 text-[8px] text-white focus:outline-none w-14"
                />
                <span className="text-[8px] text-[#878C9F]">to</span>
                <DatePicker
                  selected={customEndDate}
                  onChange={(date) => setCustomEndDate(date)}
                  placeholderText="End"
                  className="bg-black border border-[#2D2D2D] rounded px-1 py-0.5 text-[8px] text-white focus:outline-none w-14"
                />
              </div>
            </div>
          )}

          {activeDescCard === "lifetime" ? (
            <div className="text-[9px] text-gray-300 mt-2 bg-black/40 p-1.5 rounded border border-white/5 animate-in fade-in duration-200">
              Gross earnings generated from all completed match duties.
            </div>
          ) : (
            <div className="text-[9px] text-[#BFF367] mt-2 flex items-center gap-1">
              <TrendingUp size={10} /> Tracked
            </div>
          )}
        </div>
      </div>

      {/* GRAPH / ANALYTICS SECTION */}
      <div className="p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] space-y-6">
        <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Earnings Comparison</h3>
            <p className="text-xs text-[#878C9F]">Comparing previous period vs this period's performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-neutral-600" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Previous Period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#BFF367]" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-inter">Current Period</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BFF367" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#BFF367" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#878C9F" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#878C9F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
              <XAxis dataKey="name" stroke="#878C9F" fontSize={10} tickLine={false} />
              <YAxis stroke="#878C9F" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#111", border: "1px solid #2D2D2D", borderRadius: "10px" }}
                itemStyle={{ color: "#fff", fontSize: "12px" }}
                labelStyle={{ color: "#878C9F", fontSize: "11px", fontWeight: "bold" }}
              />
              <Area type="monotone" dataKey="This Month" stroke="#BFF367" strokeWidth={2} fillOpacity={1} fill="url(#colorThis)" name="Current Period" />
              <Area type="monotone" dataKey="Previous Month" stroke="#878C9F" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPrev)" name="Previous Period" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* WITHDRAWAL REQUEST OVERLAY MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111] border border-[#2D2D2D] rounded-2xl p-6 space-y-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsWithdrawModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-neutral-800 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight text-white uppercase italic">Request Fund Withdrawal</h3>
              <p className="text-xs text-gray-400">Withdraw money from your usable balance directly to your configured payout destination.</p>
            </div>

            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2D2D2D] flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Available quantum:</span>
              <span className="text-lg font-black text-[#BFF367] font-inter">₹{walletBalance.toFixed(2)}</span>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-[#878C9F] font-bold uppercase tracking-widest ml-1">Withdrawal Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-lg font-bold text-gray-500">₹</span>
                  <input 
                    type="number" 
                    min={1}
                    max={walletBalance}
                    step="any"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-black border border-[#2D2D2D] rounded-xl pl-10 pr-4 py-3.5 text-lg font-bold text-white focus:outline-none focus:border-[#BFF367] transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 bg-[#222] hover:bg-[#333] text-white font-bold rounded-xl py-3.5 transition-all text-sm uppercase tracking-wider border border-[#2D2D2D]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingPayout || !withdrawAmount || parseFloat(withdrawAmount) > walletBalance}
                  className="flex-1 bg-[#BFF367] hover:bg-[#aee057] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-extrabold rounded-xl py-3.5 transition-all text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(191,243,103,0.15)]"
                >
                  {isSubmittingPayout ? "Processing..." : "Confirm Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsTab;
