import React, { useState, useMemo } from "react";
import { 
  Coins, Landmark, CreditCard, ArrowUpRight, TrendingUp, 
  History, Calendar, ShieldCheck, Download, Plus, 
  FileText, Upload, CheckCircle, AlertCircle, Lock
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import useBanking from "../../../hooks/owner/useBanking";
import useOwnerDashboard from "../../../hooks/owner/useOwnerDashboard";
import useOwnerWallet from "../../../hooks/owner/useOwnerWallet";
import toast from "react-hot-toast";

const PayoutBanking = () => {
  const { bankingDetails, walletBalance, payoutSettings, loading: bankingLoading, isPayoutDay, updateBanking, requestPayout, verifyPassword } = useBanking();
  const { dashboardData, loading: dashboardLoading } = useOwnerDashboard();
  const { walletData, withdrawals, loading: walletLoading, refresh: refreshWallet } = useOwnerWallet();
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(0); // 0: Password, 1: Balance, 2: Amount
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [password, setPassword] = useState("");
  const [bankForm, setBankForm] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    payoutMode: "BANK"
  });
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  // Sync form with existing details
  React.useEffect(() => {
    if (bankingDetails) {
      setBankForm({
        accountName: bankingDetails.accountName || "",
        accountNumber: bankingDetails.accountNumber || "",
        ifscCode: bankingDetails.ifscCode || "",
        bankName: bankingDetails.bankName || "",
        upiId: bankingDetails.upiId || "",
        payoutMode: bankingDetails.payoutMode || "BANK"
      });
    }
  }, [bankingDetails]);

  // Derived Analytics (Real data from Dashboard)
  const analyticsData = useMemo(() => {
    if (!dashboardData?.revenueOverTimeRaw || dashboardData.revenueOverTimeRaw.length === 0) {
      return [
        { name: 'Mon', coins: 0, lastWeek: 0 },
        { name: 'Tue', coins: 0, lastWeek: 0 },
        { name: 'Wed', coins: 0, lastWeek: 0 },
        { name: 'Thu', coins: 0, lastWeek: 0 },
        { name: 'Fri', coins: 0, lastWeek: 0 },
        { name: 'Sat', coins: 0, lastWeek: 0 },
        { name: 'Sun', coins: 0, lastWeek: 0 },
      ];
    }
    
    return dashboardData.revenueOverTimeRaw.map(item => ({
      name: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
      coins: item.revenue,
      lastWeek: item.revenue * 0.8 // Simulated comparison since we only fetch 7 days
    }));
  }, [dashboardData]);

  // Deriving numbers to prevent string comparison issues
  const numericTotalCoins = Number(walletData?.balance || 0);
  const numericPendingCoins = Number(walletData?.pendingBalance || 0);
  const numericWithdrawAmount = Number(withdrawAmount);

  // Initialize withdraw amount when modal opens
  React.useEffect(() => {
    if (showVerifyModal) {
      setWithdrawAmount(numericTotalCoins);
      setIsVerified(false);
      setPassword("");
      setWithdrawStep(0);
    }
  }, [showVerifyModal, numericTotalCoins]);

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    const success = await updateBanking(bankForm);
    if (success) setIsEditingBank(false);
  };

  const isBankingInfoComplete = useMemo(() => {
    if (!bankingDetails) return false;
    const { accountName, payoutMode, accountNumber, ifscCode, upiId } = bankingDetails;
    if (!accountName) return false;
    if (payoutMode === "BANK") {
      return !!(accountNumber && ifscCode);
    } else if (payoutMode === "UPI") {
      return !!upiId;
    }
    return false;
  }, [bankingDetails]);

  const handleOpenPayoutModal = () => {
    if (!isBankingInfoComplete) {
      toast.error("Please fill in your banking details first!", {
        style: {
          background: "#000",
          color: "#fff",
          border: "1px solid #CCFF00",
          fontSize: "10px",
          fontWeight: "black",
          textTransform: "uppercase",
          letterSpacing: "0.1em"
        },
        icon: <AlertCircle className="text-[#CCFF00]" size={16} />
      });
      setIsEditingBank(true); // Open edit mode automatically
      return;
    }
    setShowVerifyModal(true);
  };

  const handleVerify = async () => {
    setVerifying(true);
    const success = await verifyPassword(password);
    if (success) {
      setIsVerified(true);
      setWithdrawStep(1);
    }
    setVerifying(false);
  };

  const handleProceedToAmount = () => {
    setWithdrawStep(2);
  };

  const handlePayoutRequest = async () => {
    if (numericWithdrawAmount < 5000) {
      toast.error("Minimum withdrawal is Rs 5000", {
        style: { background: "#000", color: "#fff", border: "1px solid #ff4d4d", fontSize: "10px", fontWeight: "black" }
      });
      return;
    }
    if (numericWithdrawAmount > 300000) {
      toast.error("Maximum withdrawal limit is Rs 300,000", {
        style: { background: "#000", color: "#fff", border: "1px solid #ff4d4d", fontSize: "10px", fontWeight: "black" }
      });
      return;
    }
    if (numericWithdrawAmount > numericTotalCoins) {
      toast.error("Insufficient wallet balance", {
        style: { background: "#000", color: "#fff", border: "1px solid #ff4d4d", fontSize: "10px", fontWeight: "black" }
      });
      return;
    }

    const success = await requestPayout(numericWithdrawAmount, password);
    if (success) {
       setShowVerifyModal(false);
       setPassword("");
       setIsVerified(false);
       refresh(); // Refresh balance
    }
  };

  if (bankingLoading || dashboardLoading || walletLoading) return <div className="p-10 text-center animate-pulse text-gray-500">Initializing Secure Banking...</div>;

  return (
    <div className="h-full custom-scrollbar bg-[#000000]">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 lg:space-y-10 animate-fade-in pt-0 pb-24 h-full relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
        
        {/* Top Banner: Marketplace Wealth */}
        <div className="relative p-8 lg:p-12 bg-[#000000] rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[60px] pointer-events-none" />
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#CCFF00]/10 rounded-2xl border border-[#CCFF00]/20 text-[#CCFF00]">
                     <Coins size={32} />
                  </div>
                   <div>
                      <h1 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase font-open-sans">Marketplace <span className="text-[#CCFF00]">Vault</span></h1>
                      <p className="text-[#878C9F] font-inter text-[20px] mt-2">Banking & Settlement Console</p>
                   </div>
               </div>
               
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/20 px-6 py-3 rounded-2xl">
                     <p className="text-[10px] text-[#CCFF00] font-bold uppercase mb-1">Confirmed Revenue</p>
                     <p className="text-2xl font-black text-white">Rs {numericTotalCoins.toLocaleString()} <span className="text-xs text-[#CCFF00] ml-1 uppercase">Credits</span></p>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                     <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Pending Revenue</p>
                     <p className="text-2xl font-black text-white">Rs {numericPendingCoins.toLocaleString()} <span className="text-xs text-gray-400 ml-1 uppercase">Upcoming</span></p>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                     <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Lifetime Earnings</p>
                     <p className="text-2xl font-black text-white">Rs {(dashboardData?.totalRevenue || 0).toLocaleString()}</p>
                  </div>
               </div>
            </div>

            {/* Payout Trigger Area */}
             <div className="w-full lg:w-auto">
                 <div className="bg-[#000000] border border-[#CCFF00]/30 p-8 rounded-[8px] space-y-5 shadow-[0_0_50px_rgba(204,255,0,0.05)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[#CCFF00]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-center gap-2 relative z-10">
                       <ShieldCheck className="text-[#CCFF00]" size={16} />
                       <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">Withdrawal Active</span>
                    </div>
                    <h3 className="text-xl font-bold relative z-10 uppercase tracking-tight">Confirmed Balance: <span className="text-[#CCFF00]">{numericTotalCoins.toLocaleString()}</span></h3>
                    <button 
                      onClick={handleOpenPayoutModal}
                      className="w-full py-4 bg-[#CCFF00] text-black rounded-[6px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#b3ff00] transition-all shadow-[0_10px_30px_rgba(204,255,0,0.2)] relative z-10"
                    >
                       Request Settlement
                    </button>
                    <p className="text-[9px] text-gray-500 text-center font-bold uppercase relative z-10 tracking-widest">Next Scheduled Payout: Friday</p>
                 </div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Multi-Series Analytics Graph */}
          <div className="lg:col-span-2 space-y-8">

            {/* Transaction Ledger */}
            <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden shadow-[var(--shadow-2)]">
               <div className="p-8 border-b border-[#2D2D2D] flex justify-between items-center">
                  <h3 className="text-lg font-bold uppercase tracking-tight">Financial Ledger</h3>
                  <button className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
                     Download CSV <Download size={14} />
                  </button>
               </div>
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white/[0.02]">
                           <th className="px-8 py-5 text-[10px] font-black text-[#878C9F] uppercase tracking-widest">Transaction Details</th>
                           <th className="px-8 py-5 text-[10px] font-black text-[#878C9F] uppercase tracking-widest">Date</th>
                           <th className="px-8 py-5 text-[10px] font-black text-[#878C9F] uppercase tracking-widest text-right">Amount</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#2D2D2D]/30">
                        {walletData.transactions && walletData.transactions.length > 0 ? (
                           walletData.transactions.map((tx, idx) => (
                              <tr key={tx._id || idx} className="hover:bg-[#2D2D2D]/20 transition-colors group">
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-10 h-10 rounded-[6px] bg-[#2D2D2D] flex items-center justify-center border border-[#404040] group-hover:border-[#CCFF00]/50 transition-all ${tx.type === 'DEBIT' ? 'text-red-500' : 'text-[#CCFF00]'}`}>
                                          {tx.type === 'DEBIT' ? <ArrowUpRight size={16} /> : <TrendingUp size={16} />}
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold uppercase tracking-tight">{tx.description || `Transaction #${tx._id?.slice(-6).toUpperCase()}`}</p>
                                          <p className="text-[10px] text-[#878C9F] font-bold uppercase tracking-widest mt-1">{tx.type} • {tx.status}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 text-[11px] text-[#878C9F] font-bold uppercase tracking-widest">
                                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                 </td>
                                 <td className={`px-8 py-6 text-right font-black tracking-tight ${tx.type === 'DEBIT' ? 'text-red-500' : 'text-[#CCFF00]'}`}>
                                    {tx.type === 'DEBIT' ? '-' : '+'} Rs {Number(tx.amount).toLocaleString()}
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="3" className="px-8 py-10 text-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                                 No transactions found in this node
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Right Sidebar: Banking & KYC */}
          <div className="space-y-8">
            {/* Banking Details Card */}
            <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 space-y-6 shadow-[var(--shadow-2)] relative overflow-hidden">
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[40px] pointer-events-none" />
               <div className="flex justify-between items-center relative z-10">
                  <h3 className="text-lg font-bold uppercase tracking-tight font-open-sans">Banking Info</h3>
                  <button 
                    onClick={() => setIsEditingBank(!isEditingBank)}
                    className="p-2 bg-[#2D2D2D] rounded-[6px] border border-[#404040] text-[#CCFF00] hover:bg-[#CCFF00]/10 transition-all"
                  >
                     <Plus size={16} />
                  </button>
               </div>

               {isEditingBank ? (
                 <form onSubmit={handleBankSubmit} className="space-y-4 animate-in slide-in-from-top duration-300 relative z-10">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-[#878C9F] uppercase tracking-widest ml-1">Account Name</label>
                       <input 
                         type="text" required
                         className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                         value={bankForm.accountName}
                         onChange={e => setBankForm({...bankForm, accountName: e.target.value})}
                       />
                    </div>
                    {bankForm.payoutMode === "BANK" ? (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left duration-300">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black text-[#878C9F] uppercase tracking-widest ml-1">Account #</label>
                            <input 
                              type="text" required
                              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                              value={bankForm.accountNumber}
                              onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})}
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-black text-[#878C9F] uppercase tracking-widest ml-1">IFSC Code</label>
                            <input 
                              type="text" required
                              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                              value={bankForm.ifscCode}
                              onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})}
                            />
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-1 animate-in fade-in slide-in-from-right duration-300">
                         <label className="text-[9px] font-black text-[#878C9F] uppercase tracking-widest ml-1">UPI ID</label>
                         <input 
                           type="text" required
                           placeholder="username@bank"
                           className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                           value={bankForm.upiId}
                           onChange={e => setBankForm({...bankForm, upiId: e.target.value})}
                         />
                      </div>
                    )}
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-[#878C9F] uppercase tracking-widest ml-1">Payout Mode</label>
                       <select 
                         className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] px-4 py-3 text-sm focus:outline-none font-bold appearance-none cursor-pointer"
                         value={bankForm.payoutMode}
                         onChange={e => setBankForm({...bankForm, payoutMode: e.target.value})}
                       >
                          <option value="BANK">Direct Bank Transfer</option>
                          <option value="UPI">UPI (Unified Payments Interface)</option>
                       </select>
                    </div>
                    <button type="submit" className="w-full py-3 bg-[#CCFF00] text-black font-black uppercase text-[10px] tracking-widest rounded-[6px] mt-4 shadow-[0_10px_20px_rgba(204,255,0,0.1)] active:scale-95 transition-transform">Save & Verify</button>
                 </form>
               ) : (
                 <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4 bg-[#151617] p-4 rounded-[8px] border border-[#2D2D2D]">
                       <div className="w-12 h-12 bg-[#CCFF00]/10 rounded-[6px] flex items-center justify-center text-[#CCFF00] border border-[#CCFF00]/20">
                          <Landmark size={24} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{bankingDetails?.bankName || "HDFC Bank"}</p>
                          <p className="text-[10px] text-[#878C9F] font-bold uppercase tracking-widest mt-1">Ending in •••• {bankingDetails?.accountNumber?.slice(-4) || "4920"}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-bold border-b border-[#2D2D2D] pb-3">
                          <span className="text-[#878C9F] uppercase tracking-widest">Account Holder</span>
                          <span className="text-white uppercase tracking-wider">{bankingDetails?.accountName || "PRASENJIT DAS"}</span>
                       </div>
                       
                       {bankingDetails?.payoutMode === "UPI" ? (
                         <div className="flex justify-between items-center text-[10px] font-bold border-b border-[#2D2D2D] pb-3">
                            <span className="text-[#878C9F] uppercase tracking-widest">UPI Identifier</span>
                            <span className="text-white uppercase tracking-wider">{bankingDetails?.upiId || "das.prasenjit@okhdfcbank"}</span>
                         </div>
                       ) : (
                         <>
                           <div className="flex justify-between items-center text-[10px] font-bold border-b border-[#2D2D2D] pb-3">
                              <span className="text-[#878C9F] uppercase tracking-widest">IFSC Code</span>
                              <span className="text-white uppercase tracking-wider">{bankingDetails?.ifscCode || "HDFC0001234"}</span>
                           </div>
                         </>
                       )}

                       <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-[#878C9F] uppercase tracking-widest">Settlement Hub</span>
                          <span className="text-[#CCFF00] uppercase tracking-wider bg-[#CCFF00]/10 px-3 py-1 rounded-full border border-[#CCFF00]/20">
                             {bankingDetails?.payoutMode === "UPI" ? "UPI Gateway" : "Direct Bank"}
                          </span>
                       </div>
                    </div>

                    {/* KYC Indicator - Show until banking info is complete */}
                    {!isBankingInfoComplete && (
                      <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-[8px] space-y-3 mt-4">
                        <div className="flex items-center gap-2">
                           <AlertCircle className="text-orange-500" size={14} />
                           <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">KYC Verification Pending</span>
                        </div>
                        <p className="text-[10px] text-[#878C9F] font-bold uppercase tracking-widest leading-relaxed">Identity verification required for settlements. Please complete your banking info to proceed.</p>
                        <button 
                          onClick={() => setIsEditingBank(true)}
                          className="w-full py-3 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-black uppercase tracking-widest rounded-[6px] border border-[#CCFF00]/20 hover:bg-[#CCFF00] hover:text-black transition-all flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(204,255,0,0.05)]"
                        >
                           <ShieldCheck size={14} /> COMPLETE NOW
                        </button>
                      </div>
                    )}
                 </div>
               )}
            </div>

            {/* Payout History Snapshot */}
            <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 shadow-[var(--shadow-2)]">
               <h3 className="text-lg font-bold uppercase tracking-tight mb-6 font-open-sans">Recent Settlements</h3>
                <div className="space-y-4">
                  {withdrawals && withdrawals.length > 0 ? (
                     withdrawals.slice(0, 3).map((withdrawal, i) => (
                        <div key={withdrawal._id || i} className="flex justify-between items-center p-5 bg-[#151617] rounded-[8px] border border-[#2D2D2D] hover:border-[#CCFF00]/30 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-[6px] flex items-center justify-center border transition-all ${
                                 withdrawal.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                 withdrawal.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                 'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>
                                 {withdrawal.status === 'SUCCESS' ? <CheckCircle size={14} /> : <History size={14} />}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-white tracking-tight">Rs {Number(withdrawal.amount).toLocaleString()}</p>
                                 <p className="text-[10px] text-[#878C9F] font-bold uppercase tracking-widest mt-1">
                                    {new Date(withdrawal.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                                 </p>
                              </div>
                           </div>
                           <span className={`text-[9px] font-black uppercase tracking-widest ${
                              withdrawal.status === 'SUCCESS' ? 'text-emerald-500' : 
                              withdrawal.status === 'PENDING' ? 'text-orange-500' : 'text-red-500'
                           }`}>
                              {withdrawal.status}
                           </span>
                        </div>
                     ))
                  ) : (
                     <div className="p-8 text-center bg-[#151617] rounded-[8px] border border-[#2D2D2D]">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">No recent settlements</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>

       {/* Verification Modal */}
       {showVerifyModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowVerifyModal(false)} />
            <div className="relative bg-[#000000] border border-[#2D2D2D] w-full max-w-md rounded-[8px] p-10 space-y-8 animate-in zoom-in duration-300 shadow-[0_0_100px_rgba(204,255,0,0.1)]">
               <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-[#CCFF00]/10 rounded-[6px] flex items-center justify-center text-[#CCFF00] mx-auto mb-6 border border-[#CCFF00]/20 shadow-[0_0_30px_rgba(204,255,0,0.1)]">
                     <Lock size={36} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Secure Payout</h2>
                  <p className="text-[10px] text-[#878C9F] font-bold uppercase tracking-widest">
                    {isVerified ? "Define Settlement Amount" : "Biometric Identity Verification Required"}
                  </p>
                             <div className="space-y-5">
                  {withdrawStep === 0 ? (
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#878C9F] uppercase tracking-widest ml-1">Master Password</label>
                          <input 
                            type="password"
                            className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] px-4 py-4 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                            placeholder="Confirm identity..."
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                          />
                       </div>
                       <button 
                         onClick={handleIdentityVerify}
                         disabled={verifying}
                         className="w-full py-5 bg-[#CCFF00] text-black rounded-[6px] font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_10px_40px_rgba(204,255,0,0.2)] hover:bg-[#b3ff00] transition-all transform active:scale-[0.98]"
                       >
                          {verifying ? "Verifying..." : "Verify Identity"}
                       </button>
                    </div>
                  ) : withdrawStep === 1 ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                       <div className="bg-[#151617] p-6 rounded-[8px] border border-[#2D2D2D] relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[40px] pointer-events-none" />
                          <p className="text-[10px] text-[#878C9F] font-black uppercase tracking-widest mb-3 relative z-10">Total Balance</p>
                          <div className="flex items-center gap-3 relative z-10">
                             <span className="text-3xl font-black text-[#CCFF00]">Rs</span>
                             <span className="text-3xl font-black text-white">{numericTotalCoins.toLocaleString()}</span>
                          </div>
                          <div className="mt-4 flex justify-between items-center relative z-10">
                             <p className="text-[9px] text-[#878C9F] font-bold uppercase tracking-widest">Available Balance</p>
                          </div>
                       </div>
                       <button 
                         onClick={handleProceedToAmount}
                         className="w-full py-5 bg-[#CCFF00] text-black rounded-[6px] font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_10px_40px_rgba(204,255,0,0.2)] hover:bg-[#b3ff00] transition-all transform active:scale-[0.98]"
                       >
                          Confirm Settlement
                       </button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                       <div className="bg-[#151617] p-6 rounded-[8px] border border-[#2D2D2D] relative overflow-hidden group space-y-6">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[40px] pointer-events-none" />
                          
                          {/* Total Balance Display */}
                          <div className="space-y-2 relative z-10">
                             <p className="text-[9px] text-[#878C9F] font-black uppercase tracking-widest">Total Balance</p>
                             <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-[#CCFF00]">Rs</span>
                                <span className="text-xl font-black text-white/50">{numericTotalCoins.toLocaleString()}</span>
                             </div>
                          </div>

                          {/* Withdraw Input */}
                          <div className="space-y-2 relative z-10 p-4 bg-white/5 rounded-[6px] border border-white/5">
                             <p className="text-[10px] text-[#CCFF00] font-black uppercase tracking-widest">Withdraw Amount</p>
                             <div className="flex items-center gap-3">
                                <span className="text-3xl font-black text-[#CCFF00]">Rs</span>
                                <input 
                                  type="number"
                                  className="w-full bg-transparent border-none text-3xl font-black text-white focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={withdrawAmount === 0 ? "" : withdrawAmount}
                                  onChange={(e) => setWithdrawAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                                  min="500"
                                  placeholder="0"
                                  autoFocus
                                />
                             </div>
                          </div>

                          {/* Live Calculation: Remaining Balance */}
                          <div className="pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                             <div className="space-y-1">
                                <p className="text-[9px] text-[#878C9F] font-bold uppercase tracking-widest">Remaining Balance</p>
                                <p className={`text-sm font-black transition-colors ${numericTotalCoins - withdrawAmount < 0 ? 'text-red-500' : 'text-[#CCFF00]'}`}>
                                   Rs {(numericTotalCoins - withdrawAmount).toLocaleString()}
                                </p>
                             </div>
                              <div className="flex gap-2">
                                 <p className="text-[9px] text-white/30 font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">Min: Rs 500</p>
                                 <p className="text-[9px] text-white/30 font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">Max: Rs 1L</p>
                              </div>
                          </div>
                       </div>
                       <button 
                         onClick={handlePayoutRequest}
                         className="w-full py-5 bg-[#CCFF00] text-black rounded-[6px] font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_10px_40px_rgba(204,255,0,0.2)] hover:bg-[#b3ff00] transition-all transform active:scale-[0.98]"
                       >
                          Confirm Settlement
                       </button>
                    </div>
                  )}
               </div>
      </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default PayoutBanking;
