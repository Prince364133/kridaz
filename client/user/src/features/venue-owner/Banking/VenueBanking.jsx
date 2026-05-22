import React, { useState, useMemo } from "react";
import { 
  Coins, Landmark, CreditCard, ArrowUpRight, TrendingUp, 
  History, Calendar, ShieldCheck, Download, Plus, 
  FileText, Upload, CheckCircle, AlertCircle, Lock,
  ArrowDownLeft, IndianRupee, Wallet, CalendarDays, Zap
} from "lucide-react";
import useBanking from "@hooks/owner/useBanking";
import useOwnerDashboard from "@hooks/owner/useOwnerDashboard";
import useOwnerWallet from "@hooks/owner/useOwnerWallet";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

/**
 * VenueBanking G泅 Secure banking, KYC, and settlement management.
 * Fully standardized for the Console design language (Inter font, 8px radii, glassmorphism).
 */

const VenueBanking = () => {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#55DEE8";
  const vaultTitle = isScorer ? "Payout & Settlement" : "Marketplace Vault";

  const { bankingDetails, walletBalance, payoutSettings, loading: bankingLoading, isPayoutDay, updateBanking, requestPayout, verifyPassword } = useBanking();
  const { dashboardData, loading: dashboardLoading } = useOwnerDashboard();
  const { walletData, withdrawals, loading: walletLoading, refresh: refreshWallet } = useOwnerWallet();
  
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(0); 
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
      toast.error("Banking details incomplete", {
        style: { background: "#000", color: "#fff", border: `1px solid ${themeColor}`, fontSize: "10px", fontWeight: "black" }
      });
      setIsEditingBank(true); 
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
      toast.error("Minimum Rs 500 required", {
        style: { background: "#000", color: "#fff", border: "1px solid #ff4d4d", fontSize: "10px", fontWeight: "black" }
      });
      return;
    }
    if (numericWithdrawAmount > numericTotalCoins) {
      toast.error("Insufficient liquidity", {
        style: { background: "#000", color: "#fff", border: "1px solid #ff4d4d", fontSize: "10px", fontWeight: "black" }
      });
      return;
    }

    const success = await requestPayout(numericWithdrawAmount, password);
    if (success) {
       setShowVerifyModal(false);
       setPassword("");
       setIsVerified(false);
       refreshWallet();
    }
  };

  if (bankingLoading || dashboardLoading || walletLoading) return <div className="p-10 text-center text-gray-500 font-inter font-black uppercase tracking-widest animate-pulse">Initializing Secure Banking...</div>;

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white font-inter pb-24">
      <div className="p-4 lg:px-10 lg:pt-10 lg:pb-12 space-y-12 animate-fade-in relative">
        
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: themeColor }} />
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight font-inter uppercase leading-none">
                <span className="text-white">{vaultTitle.split(" ")[0]}</span>{" "}
                <span style={{ color: themeColor }}>{vaultTitle.split(" ").slice(1).join(" ")}</span>
              </h1>
              <p className="text-[#878C9F] text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">Banking & Secure Settlement Console</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
             <div className="flex flex-wrap gap-3">
                <div className="bg-white/[0.02] border border-white/5 px-5 py-2.5 rounded-lg flex flex-col justify-center min-w-[140px]">
                   <p className="text-[7px] font-black text-neutral-600 uppercase tracking-widest mb-1">Confirmed Revenue</p>
                   <p className="text-[16px] font-black text-white leading-none tracking-tight">Rs {numericTotalCoins.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 px-5 py-2.5 rounded-lg flex flex-col justify-center min-w-[140px]">
                   <p className="text-[7px] font-black text-neutral-600 uppercase tracking-widest mb-1">Pending Revenue</p>
                   <p className="text-[16px] font-black text-white leading-none tracking-tight opacity-40">Rs {numericPendingCoins.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 px-5 py-2.5 rounded-lg flex flex-col justify-center min-w-[140px]">
                   <p className="text-[7px] font-black text-neutral-600 uppercase tracking-widest mb-1">Lifetime Earnings</p>
                   <p className="text-[16px] font-black text-white leading-none tracking-tight">Rs {(dashboardData?.totalRevenue || 0).toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-10">
             
             {/* Payout Trigger Card */}
             <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-lg p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C187]/5 blur-[100px] pointer-events-none" />
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                   <div className="space-y-4 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                         <ShieldCheck style={{ color: themeColor }} size={16} />
                         <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: themeColor }}>Settlement Node Active</span>
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-[0.15em] font-inter">
                        <span className="text-white/40">Balance</span> <span className="text-white">Available:</span> <span style={{ color: themeColor }}>Rs {numericTotalCoins.toLocaleString()}</span>
                      </h3>
                      <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Next Automated Settlement: Every Friday</p>
                   </div>
                   <button 
                     onClick={handleOpenPayoutModal}
                     className="px-10 py-5 text-black rounded-lg font-black uppercase tracking-[0.2em] text-[11px] transition-all transform active:scale-95 shadow-2xl w-full md:w-auto"
                     style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}4d` }}
                   >
                      Request Settlement
                   </button>
                </div>
             </div>

             {/* Financial Ledger */}
             <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: themeColor }} />
                      <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">Financial Ledger</h3>
                   </div>
                   <button className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-neutral-500 hover:text-white transition-all">
                      <Download size={14} /> Download Audit CSV
                   </button>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-white/[0.02]">
                            <th className="px-8 py-5 text-[9px] font-black text-neutral-600 uppercase tracking-widest">Transaction Origin</th>
                            <th className="px-8 py-5 text-[9px] font-black text-neutral-600 uppercase tracking-widest">Temporal Log</th>
                            <th className="px-8 py-5 text-[9px] font-black text-neutral-600 uppercase tracking-widest text-right">Quantum</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {walletData.transactions && walletData.transactions.length > 0 ? (
                            walletData.transactions.map((tx, idx) => (
                               <tr key={tx._id || idx} className="hover:bg-white/[0.02] transition-colors group">
                                  <td className="px-8 py-6">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white/[0.02] flex items-center justify-center border border-white/5 transition-all" style={{ color: tx.type === 'DEBIT' ? '#ef4444' : themeColor, borderColor: tx.type === 'DEBIT' ? '#ef444433' : `${themeColor}33` }}>
                                           {tx.type === 'DEBIT' ? <ArrowUpRight size={16} /> : <TrendingUp size={16} />}
                                        </div>
                                        <div>
                                           <p className="text-sm font-black uppercase tracking-tight text-white">{tx.description || `Log #${tx._id?.slice(-6).toUpperCase()}`}</p>
                                           <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-1">{tx.type} G求 {tx.status}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-8 py-6 text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                                     {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                  </td>
                                  <td className={`px-8 py-6 text-right font-black tracking-tighter text-lg`} style={{ color: tx.type === 'DEBIT' ? '#ef4444' : themeColor }}>
                                     {tx.type === 'DEBIT' ? '-' : '+'} Rs {Number(tx.amount).toLocaleString()}
                                  </td>
                               </tr>
                            ))
                         ) : (
                            <tr>
                               <td colSpan="3" className="px-8 py-20 text-center">
                                  <div className="flex flex-col items-center gap-4 opacity-20">
                                     <FileText size={48} className="text-neutral-500" />
                                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600">No active audit logs</p>
                                  </div>
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          {/* Right Sidebar: Banking & Records */}
          <div className="lg:col-span-4 space-y-10">
             
             {/* Banking Hub */}
             <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-lg p-8 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: themeColor }} />
                      <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">Banking Info</h3>
                   </div>
                   <button 
                     onClick={() => setIsEditingBank(!isEditingBank)}
                     className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-all text-neutral-400 hover:text-white"
                   >
                      <Plus size={16} />
                   </button>
                </div>

                {isEditingBank ? (
                  <form onSubmit={handleBankSubmit} className="space-y-5 animate-scale-in">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Account Holder</label>
                        <input 
                          type="text" required
                          className="w-full bg-black border border-white/5 rounded-lg px-5 py-4 text-[13px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black placeholder-neutral-800"
                          value={bankForm.accountName}
                          onChange={e => setBankForm({...bankForm, accountName: e.target.value})}
                          placeholder="Full Legal Name"
                        />
                     </div>
                     {bankForm.payoutMode === "BANK" ? (
                        <div className="grid grid-cols-1 gap-5">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Account Number</label>
                              <input 
                                type="text" required
                                className="w-full bg-black border border-white/5 rounded-lg px-5 py-4 text-[13px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black placeholder-neutral-800"
                                value={bankForm.accountNumber}
                                onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})}
                                placeholder="Account Number"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">IFSC Code</label>
                              <input 
                                type="text" required
                                className="w-full bg-black border border-white/5 rounded-lg px-5 py-4 text-[13px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black uppercase placeholder-neutral-800"
                                value={bankForm.ifscCode}
                                onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})}
                                placeholder="IFSC CODE"
                              />
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">UPI ID</label>
                           <input 
                             type="text" required
                             placeholder="username@bank"
                             className="w-full bg-black border border-white/5 rounded-lg px-5 py-4 text-[13px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black"
                             value={bankForm.upiId}
                             onChange={e => setBankForm({...bankForm, upiId: e.target.value})}
                           />
                        </div>
                     )}
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Payout Channel</label>
                        <select 
                          className="w-full bg-black border border-white/5 rounded-lg px-5 py-4 text-[13px] text-white focus:outline-none font-black appearance-none cursor-pointer uppercase tracking-widest"
                          value={bankForm.payoutMode}
                          onChange={e => setBankForm({...bankForm, payoutMode: e.target.value})}
                        >
                           <option value="BANK">Bank Transfer</option>
                           <option value="UPI">UPI Gateway</option>
                        </select>
                     </div>
                     <button type="submit" className="w-full py-5 text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-lg mt-4 shadow-2xl transition-all" style={{ backgroundColor: themeColor }}>Synchronize Credentials</button>
                  </form>
                ) : (
                  <div className="space-y-8 animate-fade-in">
                       <div className="flex items-center gap-5 bg-white/[0.02] p-6 rounded-lg border border-white/5">
                          <div className="w-14 h-14 rounded-lg flex items-center justify-center border" style={{ backgroundColor: `${themeColor}1A`, color: themeColor, borderColor: `${themeColor}33` }}>
                             <Landmark size={28} />
                          </div>
                          <div>
                             <p className="text-[15px] font-black text-white uppercase tracking-tight">{bankingDetails?.bankName || "HDFC Bank"}</p>
                             <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Ending in G求G求G求G求 {bankingDetails?.accountNumber?.slice(-4) || "4920"}</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black border-b border-white/5 pb-4">
                             <span className="text-neutral-600 uppercase tracking-widest">Account Holder</span>
                             <span className="text-white uppercase tracking-widest">{bankingDetails?.accountName || "MANISH GOUD KATTA"}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] font-black border-b border-white/5 pb-4">
                             <span className="text-neutral-600 uppercase tracking-widest">{bankingDetails?.payoutMode === "UPI" ? "UPI ID" : "IFSC Code"}</span>
                             <span className="text-white uppercase tracking-widest">{bankingDetails?.payoutMode === "UPI" ? (bankingDetails?.upiId || "manish.goud@okaxis") : (bankingDetails?.ifscCode || "HDFC0001234")}</span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-black">
                             <span className="text-neutral-600 uppercase tracking-widest">Channel</span>
                             <span className="uppercase tracking-widest px-3 py-1 rounded-md text-[8px] font-black border" style={{ color: themeColor, backgroundColor: `${themeColor}1A`, borderColor: `${themeColor}33` }}>
                                {bankingDetails?.payoutMode === "UPI" ? "UPI Node" : "Bank Swift"}
                             </span>
                          </div>
                       </div>

                       {!isBankingInfoComplete && (
                         <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-lg space-y-4 mt-6">
                           <div className="flex items-center gap-3">
                              <AlertCircle className="text-red-500" size={16} />
                              <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">KYC REQUIRED</span>
                           </div>
                           <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">Financial identity verification is pending. Settlement nodes are currently frozen.</p>
                           <button 
                             onClick={() => setIsEditingBank(true)}
                             className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border transition-all flex items-center justify-center gap-2"
                             style={{ backgroundColor: `${themeColor}1A`, color: themeColor, borderColor: `${themeColor}33` }}
                           >
                              <ShieldCheck size={14} /> INITIALIZE KYC
                           </button>
                         </div>
                       )}
                  </div>
                )}
             </div>

             {/* Recent Settlements */}
             <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-lg p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: themeColor }} />
                   <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">Recent Records</h3>
                </div>
                 <div className="space-y-4">
                   {withdrawals && withdrawals.length > 0 ? (
                      withdrawals.slice(0, 3).map((withdrawal, i) => (
                         <div key={withdrawal._id || i} className="flex justify-between items-center p-5 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                                  withdrawal.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                  withdrawal.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                  'bg-red-500/10 text-red-500 border-red-500/20'
                               }`}>
                                  {withdrawal.status === 'SUCCESS' ? <CheckCircle size={16} /> : <History size={16} />}
                               </div>
                               <div>
                                  <p className="text-base font-black text-white tracking-tight">Rs {Number(withdrawal.amount).toLocaleString()}</p>
                                  <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mt-1">
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
                      <div className="py-16 text-center bg-white/[0.02] rounded-lg border border-dashed border-white/10">
                         <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.2em]">No Records Found</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Verification Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
             <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-lg overflow-hidden shadow-2xl animate-scale-in relative">
                <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10">
                   <div className="flex items-center gap-4">
                     <div className="w-1.5 h-8 rounded-full shadow-[0_0_10px_rgba(0,193,135,0.3)]" style={{ backgroundColor: themeColor }} />
                     <h3 className="text-xl font-black font-inter uppercase tracking-tight text-white">Vault Access</h3>
                   </div>
                  <button onClick={() => setShowVerifyModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg text-neutral-500 hover:text-white transition-all">
                     <X size={20} />
                  </button>
               </div>

               <div className="p-8 space-y-8 relative z-10">
                  {withdrawStep === 0 ? (
                    <div className="space-y-6">
                       <div className="text-center space-y-4 mb-8">
                          <div className="w-20 h-20 rounded-lg flex items-center justify-center mx-auto border transition-all"
                                style={{ backgroundColor: `${themeColor}1A`, color: themeColor, borderColor: `${themeColor}33`, boxShadow: `0 0 40px ${themeColor}1A` }}>
                             <Lock size={36} />
                          </div>
                          <p className="text-[11px] text-neutral-500 font-black uppercase tracking-[0.2em]">Authenticating Secure Node</p>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Confirm Identity Password</label>
                          <input 
                            type="password"
                            className="w-full bg-black border border-white/5 rounded-lg px-6 py-5 text-lg focus:outline-none focus:border-[#00C187]/30 text-white font-black"
                            placeholder="G求G求G求G求G求G求G求G求"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                          />
                       </div>
                        <button 
                          onClick={handleVerify}
                          disabled={verifying}
                          className="w-full py-5 text-black rounded-lg font-black uppercase tracking-[0.2em] text-[12px] transition-all transform active:scale-95 shadow-2xl"
                          style={{ backgroundColor: themeColor, boxShadow: `0 10px 40px ${themeColor}33` }}
                        >
                           {verifying ? "Authenticating..." : "Open Vault"}
                        </button>
                    </div>
                  ) : withdrawStep === 1 ? (
                    <div className="space-y-8 animate-scale-in">
                       <div className="bg-white/[0.02] p-8 rounded-lg border border-white/5 relative overflow-hidden group">
                          <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-4 relative z-10">Confirmed Liquidity</p>
                          <div className="flex items-center gap-3 relative z-10">
                             <span className="text-4xl font-black" style={{ color: themeColor }}>Rs</span>
                             <span className="text-4xl font-black text-white">{numericTotalCoins.toLocaleString()}</span>
                          </div>
                       </div>
                        <button 
                          onClick={handleProceedToAmount}
                          className="w-full py-5 text-black rounded-lg font-black uppercase tracking-[0.2em] text-[12px] transition-all transform active:scale-95 shadow-2xl"
                          style={{ backgroundColor: themeColor, boxShadow: `0 10px 40px ${themeColor}33` }}
                        >
                           Initialize Transfer
                        </button>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-scale-in">
                       <div className="space-y-8">
                          <div className="space-y-2">
                             <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] ml-1">Total Pot Available</p>
                             <div className="flex items-center gap-2">
                                <span className="text-2xl font-black" style={{ color: themeColor }}>Rs</span>
                                <span className="text-2xl font-black text-white/30">{numericTotalCoins.toLocaleString()}</span>
                             </div>
                          </div>

                          <div className="space-y-3 p-6 bg-white/[0.03] rounded-lg border border-white/5">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: themeColor }}>Release Volume</p>
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

                          <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                             <div className="space-y-1">
                                <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Post-Release</p>
                                <p className="text-lg font-black transition-colors" style={{ color: numericTotalCoins - withdrawAmount < 0 ? '#ef4444' : themeColor }}>
                                   Rs {(numericTotalCoins - withdrawAmount).toLocaleString()}
                                </p>
                             </div>
                             <span className="text-[8px] text-neutral-700 font-black uppercase tracking-widest bg-white/5 px-3 py-1 rounded-md border border-white/5">NODE LIMIT: 3L</span>
                          </div>
                       </div>
                        <button 
                          onClick={handlePayoutRequest}
                          className="w-full py-5 text-black rounded-lg font-black uppercase tracking-[0.2em] text-[12px] transition-all transform active:scale-95 shadow-2xl"
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

export default VenueBanking;

