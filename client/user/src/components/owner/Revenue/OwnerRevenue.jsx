import React, { useState } from "react";
import { 
 IndianRupee, TrendingUp, Calendar, Download, 
 CreditCard, Clock, CheckCircle2,
 Wallet, Landmark, X, AlertCircle, ShieldCheck,
 AlertOctagon, CheckCircle, Hourglass
} from "lucide-react";
import useOwnerRevenue from "../../../hooks/owner/useOwnerRevenue";
import useOwnerWallet from "../../../hooks/owner/useOwnerWallet";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import toast from "react-hot-toast";

export default function OwnerRevenue() {
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
 toast.error("Minimum withdrawal amount is Rs 500");
 return;
 }
 const success = await requestWithdrawal(parseFloat(withdrawAmount), bankDetails);
 if (success) {
 setShowWithdrawModal(false);
 setWithdrawAmount("");
 }
 };

 const { balances, inProgressBookings, recentTransactions } = revenueData || {};

 return (
 <div className="h-full custom-scrollbar bg-[#000000] text-white">
 <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
 
 {/* Header */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
 <div>
 <div className="flex items-center gap-3">
 <IndianRupee className="text-[#CCFF00]" size={32} />
 <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] tracking-tight uppercase leading-none">Revenue Engine</h1>
 </div>
 <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-11">Financial lifecycle, disputes & withdrawals</p>
 </div>
 <div className="flex items-center gap-3 w-full md:w-auto">
 <button 
 onClick={() => setShowWithdrawModal(true)}
 className="flex items-center justify-center gap-2 px-6 py-3 bg-[#CCFF00] text-black border border-[#CCFF00] hover:bg-[#b3ff00] rounded-[8px] text-[13px] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)] w-full md:w-auto"
 >
 <Wallet size={18} />
 Withdraw
 </button>
 <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#000000] hover:bg-[#111111] border border-[#2D2D2D] rounded-[8px] text-[13px] font-bold uppercase tracking-widest transition-all shadow-[var(--shadow-2)] w-full md:w-auto">
 <Download size={18} />
 Statement
 </button>
 </div>
 </div>

 {/* Top Stat Cards (6 Cards) */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
 
 <div className="bg-[#000000] border border-[#CCFF00]/30 rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(204,255,0,0.05)] transition-all duration-500">
 <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-full flex items-center justify-center mb-4 text-[#CCFF00]">
 <CheckCircle2 size={20} />
 </div>
 <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">Usable Balance</p>
 <h3 className="text-3xl font-bold font-['Open_Sans'] text-[#CCFF00]">Rs {(balances?.usable || 0).toLocaleString()}</h3>
 <p className="text-[8px] text-[#878C9F] mt-2 uppercase font-bold tracking-widest">Ready for Withdrawal</p>
 </div>

 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
 <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 text-amber-500">
 <Hourglass size={20} />
 </div>
 <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">In Progress Balance</p>
 <h3 className="text-3xl font-bold font-['Open_Sans'] text-amber-500">Rs {(balances?.inProgress || 0).toLocaleString()}</h3>
 <p className="text-[8px] text-[#444] mt-2 uppercase font-bold tracking-widest">Escrow / Review Window</p>
 </div>

 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-red-500/30 transition-all duration-500">
 <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
 <AlertOctagon size={20} />
 </div>
 <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">Dispute Balance</p>
 <h3 className="text-3xl font-bold font-['Open_Sans'] text-red-500">Rs {(balances?.dispute || 0).toLocaleString()}</h3>
 <p className="text-[8px] text-[#444] mt-2 uppercase font-bold tracking-widest">Frozen under review</p>
 </div>

 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] transition-all duration-500">
 <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F]">
 <TrendingUp size={20} />
 </div>
 <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">Total Lifetime Revenue</p>
 <h3 className="text-3xl font-bold font-['Open_Sans'] text-white">Rs {(balances?.totalRevenue || 0).toLocaleString()}</h3>
 </div>

 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] transition-all duration-500">
 <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F]">
 <Landmark size={20} />
 </div>
 <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">Total Withdrawn</p>
 <h3 className="text-3xl font-bold font-['Open_Sans'] text-white">Rs {(balances?.withdrawn || 0).toLocaleString()}</h3>
 </div>

 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] transition-all duration-500">
 <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-500">
 <Calendar size={20} />
 </div>
 <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">Pending Settlements</p>
 <h3 className="text-3xl font-bold font-['Open_Sans'] text-white">Rs {(balances?.pendingSettlements || 0).toLocaleString()}</h3>
 <p className="text-[8px] text-[#444] mt-2 uppercase font-bold tracking-widest">Future Bookings</p>
 </div>

 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-8">
 
 {/* In Progress Bookings (Review Window) */}
 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[12px] p-8 shadow-2xl flex flex-col max-h-[500px]">
 <div className="flex justify-between items-center mb-8 border-b border-[#2D2D2D] pb-6">
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
 <h2 className="text-[13px] font-bold text-white uppercase tracking-[4px] flex items-center gap-2">
 Review Window (Escrow)
 </h2>
 </div>
 </div>
 
 <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
 <div className="space-y-4">
 {inProgressBookings && inProgressBookings.length > 0 ? (
 inProgressBookings.map((booking) => (
 <div key={booking._id} className="p-4 bg-[#050505] rounded-[8px] border border-[#2D2D2D] flex items-center justify-between">
 <div>
 <p className="text-sm font-bold text-white uppercase">{booking.turf?.name || 'Arena'}</p>
 <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-1">
 Auto-settles: {new Date(booking.reviewWindowEndsAt).toLocaleString()}
 </p>
 </div>
 <div className="text-right">
 <p className="text-lg font-bold text-white tracking-tighter">Rs {booking.ownerRevenue}</p>
 </div>
 </div>
 ))
 ) : (
 <div className="py-20 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <CheckCircle size={40} />
 <p className="text-[10px] font-bold uppercase tracking-[4px]">No bookings in review</p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Recent Financial Transactions */}
 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[12px] p-8 shadow-2xl flex flex-col max-h-[500px]">
 <div className="flex justify-between items-center mb-8 border-b border-[#2D2D2D] pb-6">
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-6 bg-[#CCFF00] rounded-full" />
 <h2 className="text-[13px] font-bold text-white uppercase tracking-[4px] flex items-center gap-2">
 Recent Movements
 </h2>
 </div>
 </div>
 
 <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
 <div className="space-y-4">
 {recentTransactions && recentTransactions.length > 0 ? (
 recentTransactions.map((tx) => {
 let colorClass = "text-white";
 let sign = "";
 if (tx.type === "SETTLEMENT" || tx.type === "DISPUTE_RELEASE") {
 colorClass = "text-[#CCFF00]";
 sign = "+";
 } else if (tx.type === "WITHDRAWAL") {
 colorClass = "text-red-500";
 sign = "-";
 } else if (tx.type === "DISPUTE_FREEZE") {
 colorClass = "text-amber-500";
 sign = "🥶";
 }
 return (
 <div key={tx._id} className="p-4 bg-[#050505] rounded-[8px] border border-[#2D2D2D] flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-white uppercase tracking-wider">{tx.type.replace(/_/g, ' ')}</p>
 <p className="text-[9px] text-[#878C9F] font-bold uppercase tracking-[2px] mt-1">
 {new Date(tx.createdAt).toLocaleDateString()}
 </p>
 </div>
 <div className="text-right">
 <p className={`text-lg font-bold ${colorClass} tracking-tighter`}>{sign} Rs {tx.amount}</p>
 </div>
 </div>
 );
 })
 ) : (
 <div className="py-20 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <AlertCircle size={40} />
 <p className="text-[10px] font-bold uppercase tracking-[4px]">Zero Financial Movements</p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 </div>

 {/* Withdrawal Modal */}
 {showWithdrawModal && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[16px] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
 <div className="p-6 border-b border-[#2D2D2D] flex justify-between items-center">
 <div className="flex items-center gap-3">
 <div className="w-1 h-5 bg-[#CCFF00] rounded-full" />
 <h3 className="text-xl font-bold font-['Open_Sans'] uppercase tracking-tight">Withdraw Funds</h3>
 </div>
 <button onClick={() => setShowWithdrawModal(false)} className="w-8 h-8 flex items-center justify-center bg-[#111] border border-[#2D2D2D] rounded-full text-[#878C9F] hover:text-white transition-all">
 <X size={16} />
 </button>
 </div>
 
 <form onSubmit={handleWithdrawSubmit} className="p-8 space-y-8">
 <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/10 rounded-[12px] p-6 flex items-start gap-4">
 <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00] shrink-0">
 <Wallet size={20} />
 </div>
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[3px]">Usable Balance</p>
 <p className="text-3xl font-bold tracking-tight text-white font-['Open_Sans']">Rs {(balances?.usable || 0).toLocaleString()}</p>
 <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
 <ShieldCheck size={10} />
 Minimum threshold: Rs 500
 </p>
 </div>
 </div>

 <div className="space-y-6">
 <div className="space-y-3">
 <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] ml-1">Quantum of Withdrawal</label>
 <div className="relative">
 <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333]" size={16} />
 <input 
 type="number"
 required
 min="500"
 max={balances?.usable || 0}
 value={withdrawAmount}
 onChange={(e) => setWithdrawAmount(e.target.value)}
 className="w-full bg-[#050505] border border-[#2D2D2D] rounded-[12px] pl-10 pr-4 py-4 text-white focus:outline-none focus:border-[#CCFF00]/50 transition-all font-bold text-2xl placeholder-[#111]"
 placeholder="0"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 gap-5">
 <div className="space-y-2">
 <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[2px] ml-1">Account Holder</label>
 <input 
 type="text" required
 value={bankDetails.accountName}
 onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
 className="w-full bg-[#050505] border border-[#2D2D2D] rounded-[10px] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00]/50 transition-all placeholder-[#111]"
 placeholder="Full Name"
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[2px] ml-1">Account Sequence</label>
 <input 
 type="text" required
 value={bankDetails.accountNumber}
 onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
 className="w-full bg-[#050505] border border-[#2D2D2D] rounded-[10px] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00]/50 transition-all placeholder-[#111]"
 placeholder="Bank Account Number"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[2px] ml-1">IFSC Vector</label>
 <input 
 type="text" required
 value={bankDetails.ifscCode}
 onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
 className="w-full bg-[#050505] border border-[#2D2D2D] rounded-[10px] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00]/50 transition-all uppercase placeholder-[#111]"
 placeholder="ABCD0123456"
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[2px] ml-1">Institution</label>
 <input 
 type="text" required
 value={bankDetails.bankName}
 onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
 className="w-full bg-[#050505] border border-[#2D2D2D] rounded-[10px] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00]/50 transition-all placeholder-[#111]"
 placeholder="Bank Name"
 />
 </div>
 </div>
 </div>
 </div>

 <button 
 type="submit"
 disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) > (balances?.usable || 0)}
 className="w-full py-5 bg-[#CCFF00] hover:bg-[#b3ff00] text-black rounded-[12px] font-black uppercase tracking-[4px] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-[0_15px_30px_rgba(204,255,0,0.15)] active:scale-[0.98]"
 >
 {submitting ? 'Processing Audit...' : 'Execute Withdrawal'}
 </button>
 </form>
 </div>
 </div>
 )}

 </div>
 </div>
 );
}
