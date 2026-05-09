import React, { useMemo, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { 
  IndianRupee, TrendingUp, Calendar, Download, 
  CreditCard, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  Wallet, Landmark, Plus, X, AlertCircle
} from "lucide-react";
import useOwnerDashboard from "@hooks/owner/useOwnerDashboard";
import useOwnerBookings from "@hooks/owner/useOwnerBookings";
import useOwnerWallet from "@hooks/owner/useOwnerWallet";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import toast from "react-hot-toast";

export default function OwnerRevenue() {
  const { dashboardData, loading: dashboardLoading } = useOwnerDashboard();
  const { bookings, loading: bookingsLoading } = useOwnerBookings();
  const { walletData, withdrawals, loading: walletLoading, requestWithdrawal, submitting } = useOwnerWallet();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: ""
  });

  if (dashboardLoading || bookingsLoading || walletLoading) return <DashboardSkeleton />;

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) < 500) {
      toast.error("Minimum withdrawal amount is ₹500");
      return;
    }
    const success = await requestWithdrawal(parseFloat(withdrawAmount), bankDetails);
    if (success) {
      setShowWithdrawModal(false);
      setWithdrawAmount("");
    }
  };

  // Data processing
  const totalRevenue = dashboardData?.totalRevenue || 0;
  
  // Calculate today's revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysRevenue = bookings.reduce((sum, booking) => {
    const bookingDate = new Date(booking.bookingDate);
    if (bookingDate >= today) {
      return sum + (booking.totalAmount || 0);
    }
    return sum;
  }, 0);

  // Recent Transactions (Bookings)
  const recentTransactions = bookings.slice(0, 5).map(booking => ({
    id: booking._id,
    customer: booking.userId?.name || "Guest User",
    amount: booking.totalAmount,
    date: new Date(booking.bookingDate).toLocaleDateString(),
    status: booking.paymentStatus || "completed",
    turf: booking.turfId?.name || "Unknown Arena"
  }));

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in text-white font-inter bg-[#050505] min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <IndianRupee className="text-[#CCFF00]" size={28} />
             <h1 className="text-2xl md:text-3xl font-bold font-outfit tracking-tight">Revenue Dashboard</h1>
          </div>
          <p className="text-[#878C9F] text-sm mt-1 uppercase tracking-widest text-[10px] font-bold">Financial analytics and withdrawal management</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#CCFF00] hover:bg-[#b3ff00] text-black rounded-[8px] text-sm font-bold transition-all w-full md:w-auto shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Wallet size={18} />
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <IndianRupee size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Total Earnings</p>
          <h3 className="text-3xl font-bold font-outfit text-white">₹{walletData.balance.toLocaleString()}</h3>
        </div>

        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-full flex items-center justify-center mb-4 text-[#CCFF00] transition-colors">
             <TrendingUp size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Usable Balance</p>
          <h3 className="text-3xl font-bold font-outfit text-[#CCFF00]">₹{walletData.usableBalance.toLocaleString()}</h3>
        </div>

        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <Clock size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Pending Withdrawals</p>
          <h3 className="text-3xl font-bold font-outfit text-white">₹{walletData.reservedBalance.toLocaleString()}</h3>
        </div>

        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <CheckCircle2 size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Processed Payouts</p>
          <h3 className="text-3xl font-bold font-outfit text-white">
            ₹{withdrawals.filter(w => w.status === 'COMPLETED').reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Withdrawal History */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6">
           <div className="flex justify-between items-center mb-6 border-b border-[#2D2D2D] pb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <Landmark className="text-[#CCFF00]" size={16} />
                 Withdrawal History
              </h2>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest border-b border-[#2D2D2D]">
                       <th className="pb-3 px-2">Date</th>
                       <th className="pb-3 px-2">Amount</th>
                       <th className="pb-3 px-2">Status</th>
                       <th className="pb-3 px-2">Transaction ID</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#2D2D2D]">
                    {withdrawals.length > 0 ? (
                      withdrawals.map((w) => (
                        <tr key={w._id} className="text-sm hover:bg-white/[0.02] transition-colors">
                           <td className="py-4 px-2 text-[#878C9F]">{new Date(w.createdAt).toLocaleDateString()}</td>
                           <td className="py-4 px-2 font-bold">₹{w.amount.toLocaleString()}</td>
                           <td className="py-4 px-2">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                                w.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                                w.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-red-500/10 text-red-500'
                              }`}>
                                 {w.status}
                              </span>
                           </td>
                           <td className="py-4 px-2 text-[#555] font-mono text-xs">{w.transactionId || '---'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-10 text-center text-[#444] text-xs font-bold uppercase tracking-widest">No withdrawal history found</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 flex flex-col">
           <div className="flex justify-between items-start mb-6 border-b border-[#2D2D2D] pb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                 Recent Activity
              </h2>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-[8px] border border-[#2D2D2D]">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                         <ArrowDownRight size={16} />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-white truncate max-w-[120px]">{tx.customer}</p>
                         <p className="text-[10px] text-[#878C9F] uppercase tracking-wider mt-0.5">{tx.date}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-bold text-[#CCFF00]">+₹{tx.amount}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[#111] border border-[#2D2D2D] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-in-center">
              <div className="p-6 border-b border-[#2D2D2D] flex justify-between items-center bg-[#161616]">
                 <h3 className="text-xl font-bold font-outfit">Withdraw Funds</h3>
                 <button onClick={() => setShowWithdrawModal(false)} className="text-[#878C9F] hover:text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-6">
                 <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="text-[#CCFF00] shrink-0 mt-0.5" size={18} />
                    <div className="text-xs text-gray-300">
                       <p className="font-bold text-[#CCFF00] uppercase mb-1">Available for Withdrawal</p>
                       <p className="text-lg font-black tracking-tight text-white">₹{walletData.usableBalance.toLocaleString()}</p>
                       <p className="mt-1 opacity-60">Minimum withdrawal amount is ₹500.</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Amount to Withdraw (₹)</label>
                       <input 
                         type="number"
                         required
                         min="500"
                         max={walletData.usableBalance}
                         value={withdrawAmount}
                         onChange={(e) => setWithdrawAmount(e.target.value)}
                         className="w-full bg-[#050505] border border-[#2D2D2D] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00] transition-colors font-bold text-lg"
                         placeholder="0.00"
                       />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Account Holder Name</label>
                          <input 
                            type="text" required
                            value={bankDetails.accountName}
                            onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                            className="w-full bg-[#050505] border border-[#2D2D2D] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Account Number</label>
                          <input 
                            type="text" required
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                            className="w-full bg-[#050505] border border-[#2D2D2D] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">IFSC Code</label>
                             <input 
                               type="text" required
                               value={bankDetails.ifscCode}
                               onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                               className="w-full bg-[#050505] border border-[#2D2D2D] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-colors uppercase"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Bank Name</label>
                             <input 
                               type="text" required
                               value={bankDetails.bankName}
                               onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                               className="w-full bg-[#050505] border border-[#2D2D2D] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) > walletData.usableBalance}
                   className="w-full py-4 bg-[#CCFF00] hover:bg-[#b3ff00] text-black rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                 >
                    {submitting ? 'Processing Request...' : 'Submit Request'}
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
