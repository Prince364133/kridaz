import React, { useState } from "react";
import { 
  IndianRupee, TrendingUp, Calendar, Download, 
  CreditCard, Clock, CheckCircle2,
  Wallet, Landmark, X, AlertCircle, ShieldCheck,
  AlertOctagon, CheckCircle, Hourglass, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import useOwnerRevenue from "@hooks/owner/useOwnerRevenue";
import useOwnerWallet from "@hooks/owner/useOwnerWallet";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

/**
 * OwnerRevenue Rs � Financial intelligence and earnings portal.
 * Fully rebranded for the Scorer Portal with Teal Green (#00C187) and Inter font.
 * Layout optimized: 6 cards in one line.
 */

export default function OwnerRevenue() {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#55DEE8";
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
      toast.error("Minimum withdrawal threshold is Rs 500", {
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: themeColor }} />
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight font-inter uppercase leading-none">
              <span className="text-white">{portalTitle.split(" ")[0]}</span>{" "}
              <span style={{ color: themeColor }}>{portalTitle.split(" ")[1]}</span>
            </h1>
            <p className="text-[#878C9F] text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">Financial lifecycle, settlement audits & withdrawals</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 text-black rounded-lg text-[11px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-2xl"
            style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}33` }}
          >
            <Wallet size={18} />
            Withdrawal Request
          </button>
          <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-[6px] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl text-neutral-400 hover:text-white">
            <Download size={18} />
            Data Export
          </button>
        </div>
      </div>

      {/* Financial Matrix (6 Cards in one line) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-5 flex flex-col relative overflow-hidden transition-all duration-500 shadow-2xl group hover:border-white/10">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-5 border border-white/10 bg-white/[0.05] group-hover:border-[#00C187]/30 transition-all shadow-inner" style={{ color: themeColor }}>
             <CheckCircle2 size={18} />
          </div>
          <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Usable Assets</p>
          <h3 className="text-2xl font-black font-inter tracking-tighter" style={{ color: themeColor }}>Rs {(balances?.usable || 0).toLocaleString()}</h3>
          <p className="text-[7px] text-neutral-700 mt-3 uppercase font-black tracking-widest">Liquid / Available</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-2xl hover:border-amber-500/20 transition-all duration-500 group">
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-5 border border-white/10 group-hover:border-amber-500/30 transition-all text-amber-500 shadow-inner">
             <Hourglass size={18} />
          </div>
          <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Review Pipeline</p>
          <h3 className="text-2xl font-black font-inter tracking-tighter text-amber-500">Rs {(balances?.inProgress || 0).toLocaleString()}</h3>
          <p className="text-[7px] text-neutral-700 mt-3 uppercase font-black tracking-widest">Escrow Window</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-2xl hover:border-red-500/20 transition-all duration-500 group">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mb-5 border border-white/10 group-hover:border-red-500/30 transition-all text-red-500 shadow-inner">
             <AlertOctagon size={18} />
          </div>
          <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Disputed Assets</p>
          <h3 className="text-2xl font-black font-inter tracking-tighter text-red-500">Rs {(balances?.dispute || 0).toLocaleString()}</h3>
          <p className="text-[7px] text-neutral-700 mt-3 uppercase font-black tracking-widest">Frozen Assets</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10 group">
          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-5 border border-white/10 group-hover:border-white/20 transition-all text-neutral-500 shadow-inner">
             <TrendingUp size={18} />
          </div>
          <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Lifetime Total</p>
          <h3 className="text-2xl font-black font-inter tracking-tighter text-white">Rs {(balances?.totalRevenue || 0).toLocaleString()}</h3>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10 group">
          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-5 border border-white/10 group-hover:border-white/20 transition-all text-neutral-500 shadow-inner">
             <Landmark size={18} />
          </div>
          <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Total Dispatched</p>
          <h3 className="text-2xl font-black font-inter tracking-tighter text-white">Rs {(balances?.withdrawn || 0).toLocaleString()}</h3>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-500 group hover:border-blue-500/20">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-5 border border-white/10 group-hover:border-blue-500/30 transition-all text-blue-500 shadow-inner">
             <Calendar size={18} />
          </div>
          <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Future Total</p>
          <h3 className="text-2xl font-black font-inter tracking-tighter text-white">Rs {(balances?.pendingSettlements || 0).toLocaleString()}</h3>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 relative z-10">
        
        {/* Review Pipeline List */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-8 lg:p-10 shadow-2xl flex flex-col max-h-[600px] group overflow-hidden relative">
           <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                 <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    Escrow Pipeline
                 </h2>
              </div>
              <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Active Reviews</span>
           </div>
           
           <div className="overflow-y-auto no-scrollbar flex-1 pr-2 relative z-10">
              <div className="space-y-6">
                 {inProgressBookings && inProgressBookings.length > 0 ? (
                   inProgressBookings.map((booking) => (
                     <div key={booking._id} className="p-6 bg-white/[0.02] rounded-[8px] border border-white/5 flex items-center justify-between hover:border-amber-500/20 transition-all shadow-lg group/item">
                        <div className="space-y-1.5">
                           <p className="text-[14px] font-black text-white uppercase tracking-tight">{booking.turf?.name || 'Arena Node'}</p>
                           <div className="flex items-center gap-2">
                             <Clock size={12} className="text-amber-500/50" />
                             <p className="text-[10px] text-amber-500/80 font-black uppercase tracking-widest">
                               Release: {new Date(booking.reviewWindowEndsAt).toLocaleDateString()}
                             </p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-white tracking-tighter">Rs {booking.ownerRevenue}</p>
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
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-8 lg:p-10 shadow-2xl flex flex-col max-h-[600px] group overflow-hidden relative">
           <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 rounded-full shadow-[0_0_10px_rgba(0,193,135,0.3)]" style={{ backgroundColor: themeColor }} />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
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
                       <div key={tx._id} className="p-6 bg-white/[0.02] rounded-[8px] border border-white/5 flex items-center justify-between hover:border-white/10 transition-all shadow-lg">
                          <div className="space-y-1.5">
                             <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-white/5 rounded-[8px] border border-white/5" style={{ color: colorStyle?.color || 'inherit' }}>{icon}</span>
                                <p className="text-[12px] font-black text-white uppercase tracking-wider">{tx.type.replace(/_/g, ' ')}</p>
                             </div>
                             <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1 ml-9">
                               {new Date(tx.createdAt).toLocaleDateString()}
                             </p>
                          </div>
                           <div className="text-right">
                              <p className={`text-2xl font-black tracking-tighter ${colorClass}`} style={colorStyle || {}}>{sign} Rs {tx.amount}</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
           <div className="bg-[#0A0A0A] border border-white/10 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in relative">
               <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 rounded-full shadow-[0_0_10px_rgba(0,193,135,0.3)]" style={{ backgroundColor: themeColor }} />
                    <h3 className="text-xl font-black font-inter uppercase tracking-tight text-white">Fund Withdrawal</h3>
                  </div>
                 <button onClick={() => setShowWithdrawModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg text-neutral-500 hover:text-white transition-all">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleWithdrawSubmit} className="p-8 space-y-8 relative z-10 h-[500px] overflow-y-auto no-scrollbar pb-10">
                  <div className="rounded-[8px] p-6 flex items-start gap-5 border border-white/5 bg-white/[0.02]" style={{ borderColor: `${themeColor}20` }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}>
                       <Wallet size={24} />
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: themeColor }}>Available Capital</p>
                       <p className="text-4xl font-black tracking-tighter text-white font-inter">Rs {(balances?.usable || 0).toLocaleString()}</p>
                       <div className="flex items-center gap-2 mt-2 text-[8px] text-neutral-500 font-black uppercase tracking-widest font-inter">
                          <ShieldCheck size={12} style={{ color: themeColor }} />
                          Min: Rs 500
                       </div>
                    </div>
                  </div>

                 <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Withdrawal Quantum</label>
                       <div className="relative group">
                          <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-[#00C187] transition-colors" size={20} />
                          <input 
                            type="number"
                            required
                            min="500"
                            max={balances?.usable || 0}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-lg pl-14 pr-6 py-5 text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black text-3xl placeholder-neutral-800 shadow-inner"
                            placeholder="0.00"
                          />
                       </div>
                    </div>

                    <div className="space-y-6 bg-white/[0.02] p-6 rounded-[8px] border border-white/5">
                       <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-4 text-center">Settlement Credentials</p>
                       
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Account Holder</label>
                          <input 
                            type="text" required
                            value={bankDetails.accountName}
                            onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                            className="w-full bg-black border border-white/5 rounded-lg px-5 py-4 text-[13px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black placeholder-neutral-800"
                            placeholder="Full Legal Name"
                          />
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Account Sequence</label>
                          <input 
                            type="text" required
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                            className="w-full bg-black border border-white/5 rounded-lg px-5 py-4 text-[13px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black placeholder-neutral-800"
                            placeholder="Primary Account Number"
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">IFSC Vector</label>
                             <input 
                               type="text" required
                               value={bankDetails.ifscCode}
                               onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                               className="w-full bg-black border border-white/5 rounded-lg px-5 py-4 text-[13px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black uppercase placeholder-neutral-800"
                               placeholder="IFSC CODE"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Institution</label>
                             <input 
                               type="text" required
                               value={bankDetails.bankName}
                               onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                               className="w-full bg-black border border-white/5 rounded-lg px-5 py-4 text-[13px] text-white focus:outline-none focus:border-[#00C187]/30 transition-all font-black placeholder-neutral-800"
                               placeholder="Bank Name"
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                  <div className="sticky bottom-0 left-0 right-0 pt-6 bg-[#0A0A0A]">
                    <button 
                        type="submit"
                        disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) > (balances?.usable || 0)}
                        className="w-full py-5 text-black rounded-lg font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-2xl active:scale-95 font-inter text-[11px]"
                        style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}4d` }}
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
