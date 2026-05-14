import React, { useState } from "react";
import { 
  IndianRupee, TrendingUp, Calendar, Download, 
  CreditCard, Clock, CheckCircle2,
  Wallet, Landmark, X, AlertCircle, ShieldCheck,
  AlertOctagon, CheckCircle, Hourglass, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import useOwnerRevenue from "../../../hooks/owner/useOwnerRevenue";
import useOwnerWallet from "../../../hooks/owner/useOwnerWallet";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

/**
 * OwnerRevenue — Financial intelligence and earnings portal.
 * Fully rebranded for the Scorer Portal with Teal Green (#00C187) and Inter font.
 */

export default function OwnerRevenue() {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#CCFF00";
  const portalTitle = isScorer ? "Earnings Dossier" : "Revenue Engine";

  const { revenueData, loading: revenueLoading } = useOwnerRevenue();
  const { requestWithdrawal, submitting } = useOwnerWallet();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: ""
  });

  if (revenueLoading) return <DashboardSkeleton />;

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) < 500) {
      toast.error("Minimum withdrawal threshold is ₹500", {
        style: { background: "#000", color: "#fff", border: `1px solid ${themeColor}`, fontSize: "10px", fontWeight: "black" }
      });
      return;
    }
    const success = await requestWithdrawal(parseFloat(withdrawAmount), bankDetails);
    if (success) {
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      toast.success("Withdrawal request dispatched", {
        style: { background: "#000", color: "#fff", border: `1px solid ${themeColor}`, fontSize: "10px", fontWeight: "black" }
      });
    }
  };

  const { balances, inProgressBookings, recentTransactions } = revenueData || {};

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white font-inter pb-24">
      <div className="p-4 lg:px-10 lg:pt-10 lg:pb-12 space-y-12 animate-fade-in relative">
      
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-5">
             <div className="w-16 h-16 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner">
                <IndianRupee style={{ color: themeColor }} size={32} />
             </div>
             <h1 className="text-4xl lg:text-6xl font-black font-inter tracking-tighter uppercase leading-none">{portalTitle}</h1>
          </div>
          <p className="text-neutral-500 font-inter text-[10px] mt-2 ml-1 uppercase tracking-[0.4em] font-black">Financial lifecycle, settlement audits & withdrawals</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full xl:w-auto">
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center justify-center gap-3 px-10 py-5 text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-2xl"
            style={{ backgroundColor: themeColor, boxShadow: `0 15px 35px ${themeColor}33` }}
          >
            <Wallet size={20} />
            Withdrawal Request
          </button>
          <button className="flex items-center justify-center gap-3 px-10 py-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl text-neutral-400 hover:text-white">
            <Download size={20} />
            Data Export
          </button>
        </div>
      </div>

      {/* Financial Matrix (6 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        
        <div className="bg-black border rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden transition-all duration-500 shadow-2xl group"
             style={{ borderColor: `${themeColor}1A`, boxShadow: `0 20px 50px ${themeColor}0D` }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C187]/5 blur-3xl pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-white/5 bg-white/[0.02] group-hover:border-[#00C187]/30 transition-all shadow-inner" style={{ color: themeColor }}>
             <CheckCircle2 size={24} />
          </div>
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-2">Usable Assets</p>
          <h3 className="text-4xl font-black font-inter tracking-tighter" style={{ color: themeColor }}>₹{(balances?.usable || 0).toLocaleString()}</h3>
          <p className="text-[8px] text-neutral-800 mt-4 uppercase font-black tracking-widest">Liquid / Available for Dispatch</p>
        </div>

        <div className="bg-black border border-white/5 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl hover:border-amber-500/20 transition-all duration-500 group">
          <div className="w-14 h-14 bg-amber-500/5 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-amber-500/30 transition-all text-amber-500 shadow-inner">
             <Hourglass size={24} />
          </div>
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-2">Review Pipeline</p>
          <h3 className="text-4xl font-black font-inter tracking-tighter text-amber-500">₹{(balances?.inProgress || 0).toLocaleString()}</h3>
          <p className="text-[8px] text-neutral-800 mt-4 uppercase font-black tracking-widest">Escrow / Processing Window</p>
        </div>

        <div className="bg-black border border-white/5 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl hover:border-red-500/20 transition-all duration-500 group">
          <div className="w-14 h-14 bg-red-500/5 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-red-500/30 transition-all text-red-500 shadow-inner">
             <AlertOctagon size={24} />
          </div>
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-2">Disputed Assets</p>
          <h3 className="text-4xl font-black font-inter tracking-tighter text-red-500">₹{(balances?.dispute || 0).toLocaleString()}</h3>
          <p className="text-[8px] text-neutral-800 mt-4 uppercase font-black tracking-widest">Frozen pending resolution</p>
        </div>

        <div className="bg-black border border-white/5 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10 group">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-white/20 transition-all text-neutral-600 shadow-inner">
             <TrendingUp size={24} />
          </div>
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-2">Lifetime Accumulation</p>
          <h3 className="text-4xl font-black font-inter tracking-tighter text-white">₹{(balances?.totalRevenue || 0).toLocaleString()}</h3>
        </div>

        <div className="bg-black border border-white/5 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10 group">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-white/20 transition-all text-neutral-600 shadow-inner">
             <Landmark size={24} />
          </div>
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-2">Total Dispatched</p>
          <h3 className="text-4xl font-black font-inter tracking-tighter text-white">₹{(balances?.withdrawn || 0).toLocaleString()}</h3>
        </div>

        <div className="bg-black border border-white/5 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-500 group hover:border-blue-500/20">
          <div className="w-14 h-14 bg-blue-500/5 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-blue-500/30 transition-all text-blue-500 shadow-inner">
             <Calendar size={24} />
          </div>
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-2">Future Commitments</p>
          <h3 className="text-4xl font-black font-inter tracking-tighter text-white">₹{(balances?.pendingSettlements || 0).toLocaleString()}</h3>
          <p className="text-[8px] text-neutral-800 mt-4 uppercase font-black tracking-widest">Upcoming Assignments</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 relative z-10">
        
        {/* Review Pipeline List */}
        <div className="bg-black border border-white/5 rounded-[3rem] p-10 lg:p-12 shadow-2xl flex flex-col max-h-[600px] group overflow-hidden">
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />
           <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                 <h2 className="text-[14px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                    Escrow Pipeline
                 </h2>
              </div>
              <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Active Reviews</span>
           </div>
           
           <div className="overflow-y-auto no-scrollbar flex-1 pr-2 relative z-10">
              <div className="space-y-6">
                 {inProgressBookings && inProgressBookings.length > 0 ? (
                   inProgressBookings.map((booking) => (
                     <div key={booking._id} className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 flex items-center justify-between hover:border-amber-500/20 transition-all shadow-lg group/item">
                        <div className="space-y-1.5">
                           <p className="text-[15px] font-black text-white uppercase tracking-tight">{booking.turf?.name || 'Arena Node'}</p>
                           <div className="flex items-center gap-2">
                             <Clock size={12} className="text-amber-500/50" />
                             <p className="text-[10px] text-amber-500/80 font-black uppercase tracking-widest">
                               Release: {new Date(booking.reviewWindowEndsAt).toLocaleDateString()}
                             </p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-white tracking-tighter">₹{booking.ownerRevenue}</p>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="py-24 text-center">
                      <div className="flex flex-col items-center gap-6 opacity-20">
                         <CheckCircle size={56} className="text-neutral-400" />
                         <p className="text-[11px] font-black uppercase tracking-[0.5em] text-neutral-600">No assets in pipeline</p>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Transaction History */}
        <div className="bg-black border border-white/5 rounded-[3rem] p-10 lg:p-12 shadow-2xl flex flex-col max-h-[600px] group overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C187]/5 blur-3xl pointer-events-none" />
           <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 rounded-full shadow-[0_0_10px_rgba(0,193,135,0.5)]" style={{ backgroundColor: themeColor }} />
                  <h2 className="text-[14px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                     Transaction History
                  </h2>
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Audit Logs</span>
           </div>
           
           <div className="overflow-y-auto no-scrollbar flex-1 pr-2 relative z-10">
              <div className="space-y-6">
                 {recentTransactions && recentTransactions.length > 0 ? (
                   recentTransactions.map((tx) => {
                     let colorClass = "text-white";
                     let colorStyle = null;
                     let sign = "";
                     let icon = null;

                      if (tx.type === "SETTLEMENT" || tx.type === "DISPUTE_RELEASE") {
                        colorStyle = { color: themeColor };
                        sign = "+";
                        icon = <ArrowUpRight size={14} />;
                      } else if (tx.type === "WITHDRAWAL") {
                        colorClass = "text-red-500";
                        sign = "-";
                        icon = <ArrowDownLeft size={14} />;
                      } else if (tx.type === "DISPUTE_FREEZE") {
                        colorClass = "text-amber-500";
                        sign = "";
                        icon = <AlertOctagon size={14} />;
                      }

                     return (
                       <div key={tx._id} className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all shadow-lg">
                          <div className="space-y-1.5">
                             <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-white/5 rounded-lg border border-white/5" style={{ color: colorStyle?.color || 'inherit' }}>{icon}</span>
                                <p className="text-[12px] font-black text-white uppercase tracking-wider">{tx.type.replace(/_/g, ' ')}</p>
                             </div>
                             <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mt-1 ml-9">
                               {new Date(tx.createdAt).toLocaleDateString()}
                             </p>
                          </div>
                           <div className="text-right">
                              <p className={`text-2xl font-black tracking-tighter ${colorClass}`} style={colorStyle || {}}>{sign} ₹{tx.amount}</p>
                           </div>
                       </div>
                     );
                   })
                 ) : (
                   <div className="py-24 text-center">
                      <div className="flex flex-col items-center gap-6 opacity-20">
                         <AlertCircle size={56} className="text-neutral-400" />
                         <p className="text-[11px] font-black uppercase tracking-[0.5em] text-neutral-600">No financial audit logs</p>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>

      </div>

      {/* Withdrawal Control Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fade-in">
           <div className="bg-black border border-white/10 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,1)] animate-scale-in relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C187]/5 blur-[100px] pointer-events-none" />
               <div className="p-10 border-b border-white/5 flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-1.5 h-8 rounded-full shadow-[0_0_15px_rgba(0,193,135,0.5)]" style={{ backgroundColor: themeColor }} />
                    <h3 className="text-2xl font-black font-inter uppercase tracking-tighter text-white">Fund Withdrawal</h3>
                  </div>
                 <button onClick={() => setShowWithdrawModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl text-neutral-600 hover:text-white transition-all shadow-inner">
                    <X size={22} />
                 </button>
              </div>
              
              <form onSubmit={handleWithdrawSubmit} className="p-10 space-y-10 relative z-10 h-[600px] overflow-y-auto no-scrollbar pb-20">
                  <div className="rounded-[2rem] p-8 flex items-start gap-6 border border-white/5 shadow-2xl" style={{ backgroundColor: `${themeColor}08` }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}>
                       <Wallet size={28} />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: themeColor }}>Available Capital</p>
                       <p className="text-5xl font-black tracking-tighter text-white font-inter">₹{(balances?.usable || 0).toLocaleString()}</p>
                       <div className="flex items-center gap-2 mt-4 text-[9px] text-neutral-600 font-black uppercase tracking-widest font-inter">
                          <ShieldCheck size={14} style={{ color: themeColor }} />
                          Minimum Threshold: ₹500
                       </div>
                    </div>
                  </div>

                 <div className="space-y-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] ml-2">Withdrawal Quantum</label>
                       <div className="relative group">
                          <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-800 group-focus-within:text-[#00C187] transition-colors" size={24} />
                          <input 
                            type="number"
                            required
                            min="500"
                            max={balances?.usable || 0}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] pl-16 pr-8 py-7 text-white focus:outline-none focus:border-[#00C187]/50 transition-all font-black text-4xl placeholder-neutral-900 shadow-inner"
                            placeholder="0.00"
                          />
                       </div>
                    </div>

                    <div className="space-y-8 bg-white/[0.01] p-8 rounded-[2rem] border border-white/5 shadow-inner">
                       <p className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.5em] mb-4 text-center">Settlement Credentials</p>
                       
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Account Holder</label>
                          <input 
                            type="text" required
                            value={bankDetails.accountName}
                            onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                            className="w-full bg-black border border-white/5 rounded-2xl px-6 py-5 text-[14px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black placeholder-neutral-800 shadow-inner"
                            placeholder="Full Legal Name"
                          />
                       </div>
                       
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Account Sequence</label>
                          <input 
                            type="text" required
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                            className="w-full bg-black border border-white/5 rounded-2xl px-6 py-5 text-[14px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black placeholder-neutral-800 shadow-inner"
                            placeholder="Primary Account Number"
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">IFSC Vector</label>
                             <input 
                               type="text" required
                               value={bankDetails.ifscCode}
                               onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                               className="w-full bg-black border border-white/5 rounded-2xl px-6 py-5 text-[14px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black uppercase placeholder-neutral-800 shadow-inner"
                               placeholder="IFSC CODE"
                             />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Institution</label>
                             <input 
                               type="text" required
                               value={bankDetails.bankName}
                               onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                               className="w-full bg-black border border-white/5 rounded-2xl px-6 py-5 text-[14px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black placeholder-neutral-800 shadow-inner"
                               placeholder="Bank Name"
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                  <div className="sticky bottom-0 left-0 right-0 pt-10 bg-black">
                    <button 
                        type="submit"
                        disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) > (balances?.usable || 0)}
                        className="w-full py-6 text-black rounded-3xl font-black uppercase tracking-[0.4em] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-2xl active:scale-95 font-inter text-[12px]"
                        style={{ backgroundColor: themeColor, boxShadow: `0 15px 40px ${themeColor}66` }}
                    >
                        {submitting ? 'Authenticating Audit...' : 'Execute Settlement'}
                    </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      </div>
    </div>
  );
}
