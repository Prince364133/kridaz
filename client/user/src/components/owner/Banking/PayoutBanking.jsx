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

import { useSelector } from "react-redux";

const PayoutBanking = () => {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#CCFF00";
  const vaultTitle = isScorer ? "Payout & Settlement" : "Marketplace Vault";

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
          border: `1px solid ${themeColor}`,
          fontSize: "10px",
          fontWeight: "black",
          textTransform: "uppercase",
          letterSpacing: "0.1em"
        },
        icon: <AlertCircle style={{ color: themeColor }} size={16} />
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
    if (numericWithdrawAmount < 500) {
      toast.error("Minimum withdrawal is Rs 500", {
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
       refreshWallet(); // Refresh balance
    }
  };

  if (bankingLoading || dashboardLoading || walletLoading) return <div className="p-10 text-center animate-pulse text-gray-500 font-inter font-black uppercase tracking-widest">Initializing Secure Banking...</div>;

  return (
    <div className="h-full custom-scrollbar bg-[#000000] font-inter">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 lg:space-y-10 animate-fade-in pt-0 pb-24 h-full relative">
        <div className="absolute top-0 right-0 w-96 h-96 blur-[120px] pointer-events-none" style={{ backgroundColor: `${themeColor}0D` }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 blur-[120px] pointer-events-none" style={{ backgroundColor: `${themeColor}0D` }} />
        
        {/* Top Banner: Marketplace Wealth */}
        <div className="relative p-8 lg:p-12 bg-[#000000] rounded-[8px] border border-white/5 shadow-2xl overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 blur-[60px] pointer-events-none" style={{ backgroundColor: `${themeColor}0D` }} />
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl border flex items-center justify-center" style={{ backgroundColor: `${themeColor}1A`, borderColor: `${themeColor}33`, color: themeColor }}>
                     <Coins size={32} />
                  </div>
                   <div>
                      <h1 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase font-inter">{vaultTitle.split(' ')[0]} <span style={{ color: themeColor }}>{vaultTitle.split(' ').slice(1).join(' ')}</span></h1>
                      <p className="text-[#878C9F] font-inter text-[14px] mt-2 uppercase tracking-widest font-semibold">Banking & Settlement Console</p>
                   </div>
               </div>
               
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="border px-6 py-3 rounded-2xl" style={{ backgroundColor: `${themeColor}0D`, borderColor: `${themeColor}33` }}>
                     <p className="text-[10px] font-bold uppercase mb-1" style={{ color: themeColor }}>Confirmed Revenue</p>
                     <p className="text-2xl font-black text-white">Rs {numericTotalCoins.toLocaleString()} <span className="text-xs ml-1 uppercase" style={{ color: themeColor }}>Credits</span></p>
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
                 <div className="bg-[#000000] border p-8 rounded-[8px] space-y-5 shadow-2xl relative overflow-hidden group" style={{ borderColor: `${themeColor}4D` }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ backgroundColor: `${themeColor}0D` }} />
                    <div className="flex items-center gap-2 relative z-10">
                       <ShieldCheck style={{ color: themeColor }} size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: themeColor }}>Withdrawal Active</span>
                    </div>
                    <h3 className="text-xl font-black relative z-10 uppercase tracking-tight">Confirmed Balance: <span style={{ color: themeColor }}>{numericTotalCoins.toLocaleString()}</span></h3>
                    <button 
                      onClick={handleOpenPayoutModal}
                      className="w-full py-4 text-black rounded-[4px] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-lg relative z-10"
                      style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}33` }}
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
            <div className="bg-[#000000] border border-white/5 rounded-[8px] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase tracking-tight">Financial Ledger</h3>
                  <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: themeColor }}>
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
                     <tbody className="divide-y divide-white/5">
                        {walletData.transactions && walletData.transactions.length > 0 ? (
                           walletData.transactions.map((tx, idx) => (
                              <tr key={tx._id || idx} className="hover:bg-white/5 transition-colors group">
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-[6px] bg-[#111] flex items-center justify-center border border-white/5 transition-all" style={{ color: tx.type === 'DEBIT' ? '#ef4444' : themeColor, borderColor: tx.type === 'DEBIT' ? '#ef444433' : `${themeColor}33` }}>
                                          {tx.type === 'DEBIT' ? <ArrowUpRight size={16} /> : <TrendingUp size={16} />}
                                       </div>
                                       <div>
                                          <p className="text-sm font-black uppercase tracking-tight text-white">{tx.description || `Transaction #${tx._id?.slice(-6).toUpperCase()}`}</p>
                                          <p className="text-[10px] text-[#878C9F] font-bold uppercase tracking-widest mt-1">{tx.type} • {tx.status}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 text-[10px] text-[#878C9F] font-black uppercase tracking-widest">
                                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                 </td>
                                 <td className={`px-8 py-6 text-right font-black tracking-tight text-lg`} style={{ color: tx.type === 'DEBIT' ? '#ef4444' : themeColor }}>
                                    {tx.type === 'DEBIT' ? '-' : '+'} Rs {Number(tx.amount).toLocaleString()}
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="3" className="px-8 py-12 text-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">
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
            <div className="bg-[#000000] border border-white/5 rounded-[8px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute bottom-0 right-0 w-32 h-32 blur-[40px] pointer-events-none" style={{ backgroundColor: `${themeColor}0D` }} />
                <div className="flex justify-between items-center relative z-10">
                   <h3 className="text-lg font-black uppercase tracking-tight font-inter">Banking Info</h3>
                   <button 
                     onClick={() => setIsEditingBank(!isEditingBank)}
                     className="p-2 bg-white/5 rounded-[6px] border border-white/5 hover:bg-white/10 transition-all"
                     style={{ color: themeColor }}
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
                         className="w-full bg-[#111] border border-white/5 rounded-[6px] px-4 py-3 text-sm focus:outline-none font-bold text-white"
                         style={{ '--tw-ring-color': themeColor }}
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
                               className="w-full bg-[#111] border border-white/5 rounded-[6px] px-4 py-3 text-sm focus:outline-none font-bold text-white"
                               value={bankForm.accountNumber}
                               onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})}
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-[#878C9F] uppercase tracking-widest ml-1">IFSC Code</label>
                             <input 
                               type="text" required
                               className="w-full bg-[#111] border border-white/5 rounded-[6px] px-4 py-3 text-sm focus:outline-none font-bold text-white"
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
                            className="w-full bg-[#111] border border-white/5 rounded-[6px] px-4 py-3 text-sm focus:outline-none font-bold text-white"
                            value={bankForm.upiId}
                            onChange={e => setBankForm({...bankForm, upiId: e.target.value})}
                          />
                       </div>
                    )}
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-[#878C9F] uppercase tracking-widest ml-1">Payout Mode</label>
                       <select 
                         className="w-full bg-[#111] border border-white/5 rounded-[6px] px-4 py-3 text-sm focus:outline-none font-black appearance-none cursor-pointer text-white uppercase tracking-widest"
                         value={bankForm.payoutMode}
                         onChange={e => setBankForm({...bankForm, payoutMode: e.target.value})}
                       >
                          <option value="BANK">Direct Bank Transfer</option>
                          <option value="UPI">UPI (Unified Payments Interface)</option>
                       </select>
                    </div>
                    <button type="submit" className="w-full py-4 text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-[4px] mt-4 shadow-lg active:scale-95 transition-all" style={{ backgroundColor: themeColor }}>Save & Verify Node</button>
                 </form>
               ) : (
                 <div className="space-y-6 relative z-10">
                      <div className="flex items-center gap-4 bg-[#111] p-5 rounded-[4px] border border-white/5">
                         <div className="w-12 h-12 rounded-[4px] flex items-center justify-center border" style={{ backgroundColor: `${themeColor}1A`, color: themeColor, borderColor: `${themeColor}33` }}>
                            <Landmark size={24} />
                         </div>
                         <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight font-inter">{bankingDetails?.bankName || "HDFC Bank"}</p>
                            <p className="text-[10px] text-[#878C9F] font-bold uppercase tracking-widest mt-1 font-inter">Ending in •••• {bankingDetails?.accountNumber?.slice(-4) || "4920"}</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black border-b border-white/5 pb-4">
                            <span className="text-[#878C9F] uppercase tracking-widest">Account Holder</span>
                            <span className="text-white uppercase tracking-widest font-inter">{bankingDetails?.accountName || "MANISH GOUD KATTA"}</span>
                         </div>
                         
                         {bankingDetails?.payoutMode === "UPI" ? (
                           <div className="flex justify-between items-center text-[10px] font-black border-b border-white/5 pb-4">
                              <span className="text-[#878C9F] uppercase tracking-widest">UPI Identifier</span>
                              <span className="text-white uppercase tracking-widest font-inter">{bankingDetails?.upiId || "manish.goud@okaxis"}</span>
                           </div>
                         ) : (
                           <div className="flex justify-between items-center text-[10px] font-black border-b border-white/5 pb-4">
                              <span className="text-[#878C9F] uppercase tracking-widest">IFSC Code</span>
                              <span className="text-white uppercase tracking-widest font-inter">{bankingDetails?.ifscCode || "HDFC0001234"}</span>
                           </div>
                         )}

                         <div className="flex justify-between items-center text-[10px] font-black">
                            <span className="text-[#878C9F] uppercase tracking-widest">Settlement Hub</span>
                            <span className="uppercase tracking-widest px-4 py-1.5 rounded-full border text-[9px]" style={{ color: themeColor, backgroundColor: `${themeColor}1A`, borderColor: `${themeColor}33` }}>
                               {bankingDetails?.payoutMode === "UPI" ? "UPI Gateway" : "Direct Bank"}
                            </span>
                         </div>
                      </div>

                      {!isBankingInfoComplete && (
                        <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-[4px] space-y-4 mt-6">
                          <div className="flex items-center gap-3">
                             <AlertCircle className="text-orange-500" size={16} />
                             <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">KYC Pending</span>
                          </div>
                          <p className="text-[10px] text-[#878C9F] font-bold uppercase tracking-widest leading-relaxed">Identity verification required for settlements. Complete your node details.</p>
                          <button 
                            onClick={() => setIsEditingBank(true)}
                            className="w-full py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-[4px] border transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: `${themeColor}1A`, color: themeColor, borderColor: `${themeColor}33` }}
                          >
                             <ShieldCheck size={14} /> COMPLETE NOW
                          </button>
                        </div>
                      )}
                 </div>
               )}
            </div>

            <div className="bg-[#000000] border border-white/5 rounded-[8px] p-8 shadow-2xl">
               <h3 className="text-lg font-black uppercase tracking-tight mb-8 font-inter">Recent Settlements</h3>
                <div className="space-y-4">
                  {withdrawals && withdrawals.length > 0 ? (
                     withdrawals.slice(0, 3).map((withdrawal, i) => (
                        <div key={withdrawal._id || i} className="flex justify-between items-center p-5 bg-[#111] rounded-[8px] border border-white/5 hover:border-white/20 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-[6px] flex items-center justify-center border transition-all ${
                                 withdrawal.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                 withdrawal.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                 'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>
                                 {withdrawal.status === 'SUCCESS' ? <CheckCircle size={18} /> : <History size={18} />}
                              </div>
                              <div>
                                 <p className="text-base font-black text-white tracking-tight">Rs {Number(withdrawal.amount).toLocaleString()}</p>
                                 <p className="text-[10px] text-[#878C9F] font-black uppercase tracking-widest mt-1">
                                    {new Date(withdrawal.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                                 </p>
                              </div>
                           </div>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${
                              withdrawal.status === 'SUCCESS' ? 'text-emerald-500' : 
                              withdrawal.status === 'PENDING' ? 'text-orange-500' : 'text-red-500'
                           }`}>
                              {withdrawal.status}
                           </span>
                        </div>
                     ))
                  ) : (
                     <div className="py-12 text-center bg-[#111] rounded-[8px] border border-white/5">
                        <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">No Recent Records</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>

       {/* Verification Modal */}
       {showVerifyModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setShowVerifyModal(false)} />
            <div className="relative bg-[#000] border border-white/10 w-full max-w-md rounded-3xl p-10 space-y-10 animate-in zoom-in duration-300 shadow-2xl">
               <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 border transition-all"
                        style={{ backgroundColor: `${themeColor}1A`, color: themeColor, borderColor: `${themeColor}33`, boxShadow: `0 0 40px ${themeColor}1A` }}>
                     <Lock size={48} />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter font-inter text-white">Secure Access</h2>
                  <p className="text-[11px] text-[#878C9F] font-black uppercase tracking-[0.2em]">
                    {isVerified ? "Define Settlement Hub" : "Master Password Verification Required"}
                  </p>
               </div>

               <div className="space-y-6">
                  {withdrawStep === 0 ? (
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Confirm Password</label>
                          <input 
                            type="password"
                            className="w-full bg-[#111] border border-white/5 rounded-2xl px-6 py-5 text-lg focus:outline-none text-white font-black"
                            style={{ borderColor: password ? themeColor : 'rgba(255,255,255,0.05)' }}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                          />
                       </div>
                        <button 
                          onClick={handleVerify}
                          disabled={verifying}
                          className="w-full py-5 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] transition-all transform active:scale-95 shadow-2xl"
                          style={{ backgroundColor: themeColor, boxShadow: `0 10px 40px ${themeColor}33` }}
                        >
                           {verifying ? "Verifying..." : "Access Vault"}
                        </button>
                    </div>
                  ) : withdrawStep === 1 ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                       <div className="bg-[#111] p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] pointer-events-none" style={{ backgroundColor: `${themeColor}0D` }} />
                          <p className="text-[10px] text-[#878C9F] font-black uppercase tracking-[0.2em] mb-4 relative z-10">Available Liquidity</p>
                          <div className="flex items-center gap-3 relative z-10">
                             <span className="text-4xl font-black" style={{ color: themeColor }}>Rs</span>
                             <span className="text-4xl font-black text-white">{numericTotalCoins.toLocaleString()}</span>
                          </div>
                       </div>
                        <button 
                          onClick={handleProceedToAmount}
                          className="w-full py-5 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] transition-all transform active:scale-95 shadow-2xl"
                          style={{ backgroundColor: themeColor, boxShadow: `0 10px 40px ${themeColor}33` }}
                        >
                           Initialize Transfer
                        </button>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                       <div className="bg-[#111] p-8 rounded-3xl border border-white/5 relative overflow-hidden group space-y-8">
                          <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] pointer-events-none" style={{ backgroundColor: `${themeColor}0D` }} />
                          
                          <div className="space-y-2 relative z-10">
                             <p className="text-[10px] text-[#878C9F] font-black uppercase tracking-[0.2em]">Total Pot</p>
                             <div className="flex items-center gap-2">
                                <span className="text-2xl font-black" style={{ color: themeColor }}>Rs</span>
                                <span className="text-2xl font-black text-white/30">{numericTotalCoins.toLocaleString()}</span>
                             </div>
                          </div>

                          <div className="space-y-3 relative z-10 p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: themeColor }}>Withdrawal Volume</p>
                             <div className="flex items-center gap-3">
                                <span className="text-4xl font-black" style={{ color: themeColor }}>Rs</span>
                                <input 
                                  type="number"
                                  className="w-full bg-transparent border-none text-4xl font-black text-white focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={withdrawAmount === 0 ? "" : withdrawAmount}
                                  onChange={(e) => setWithdrawAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                                  placeholder="0"
                                  autoFocus
                                />
                             </div>
                          </div>

                          <div className="pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                             <div className="space-y-1">
                                <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Residual</p>
                                <p className="text-lg font-black transition-colors" style={{ color: numericTotalCoins - withdrawAmount < 0 ? '#ef4444' : themeColor }}>
                                   Rs {(numericTotalCoins - withdrawAmount).toLocaleString()}
                                </p>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                                <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Limit: 3L</span>
                             </div>
                          </div>
                       </div>
                        <button 
                          onClick={handlePayoutRequest}
                          className="w-full py-5 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] transition-all transform active:scale-95 shadow-2xl"
                          style={{ backgroundColor: themeColor, boxShadow: `0 10px 40px ${themeColor}33` }}
                        >
                           Release Funds
                        </button>
                    </div>
                  )}
               </div>
            </div>
         </div>
       )}
      </div>
    </div>
  );
};

export default PayoutBanking;
