import React, { useMemo, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { 
  IndianRupee, TrendingUp, Calendar, Download, 
  CreditCard, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  Wallet, Landmark, Plus, X, AlertCircle, ShieldCheck
} from "lucide-react";
import useOwnerDashboard from "@hooks/owner/useOwnerDashboard";
import useOwnerBookings from "@hooks/owner/useOwnerBookings";
import useOwnerWallet from "@hooks/owner/useOwnerWallet";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import toast from "react-hot-toast";

const PendingBadge = ({ label = "Audit" }) => (
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-widest animate-pulse">
    <div className="w-1 h-1 rounded-full bg-amber-500" />
    {label}
  </span>
);

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

  // Analytics Data (Moved from Banking)
  const analyticsData = useMemo(() => {
    return [
      { name: 'Mon', coins: 400, lastWeek: 240 },
      { name: 'Tue', coins: 300, lastWeek: 139 },
      { name: 'Wed', coins: 200, lastWeek: 980 },
      { name: 'Thu', coins: 278, lastWeek: 390 },
      { name: 'Fri', coins: 189, lastWeek: 480 },
      { name: 'Sat', coins: 239, lastWeek: 380 },
      { name: 'Sun', coins: 349, lastWeek: 430 },
    ];
  }, []);

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-3">
             <IndianRupee className="text-[#CCFF00]" size={32} />
             <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] tracking-tight uppercase leading-none">Revenue Intelligence</h1>
          </div>
          <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-11">Financial analytics and withdrawal management</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#000000] hover:bg-[#111111] border border-[#2D2D2D] rounded-[8px] text-[13px] font-bold uppercase tracking-widest transition-all shadow-[var(--shadow-2)] w-full md:w-auto">
            <Download size={18} />
            Statement
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F]">
             <IndianRupee size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">Total Earnings</p>
          <h3 className="text-3xl font-bold font-['Open_Sans'] text-white">₹{walletData.balance.toLocaleString()}</h3>
        </div>

        <div className="bg-[#000000] border border-[#CCFF00]/30 rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(204,255,0,0.05)] transition-all duration-500">
          <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-full flex items-center justify-center mb-4 text-[#CCFF00]">
             <TrendingUp size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">Usable Balance</p>
          <h3 className="text-3xl font-bold font-['Open_Sans'] text-[#CCFF00]">₹{walletData.usableBalance.toLocaleString()}</h3>
        </div>

        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F]">
             <Clock size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">In Process</p>
          <h3 className="text-3xl font-bold font-['Open_Sans'] text-white">₹{walletData.reservedBalance.toLocaleString()}</h3>
          <p className="text-[8px] text-[#444] mt-2 uppercase font-bold tracking-widest">Pending Verification</p>
        </div>

        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F]">
             <CheckCircle2 size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[3px] mb-1">Payouts Cleared</p>
          <h3 className="text-3xl font-bold font-['Open_Sans'] text-white">
            ₹{withdrawals.filter(w => w.status === 'COMPLETED').reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
          </h3>
          <p className="text-[8px] text-[#CCFF00]/60 mt-2 uppercase font-bold tracking-widest">Successful Settlements</p>
        </div>
      </div>

      {/* Revenue Intelligence Chart (Centralized) */}
      <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 shadow-[var(--shadow-2)] relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-[#CCFF00]/5 blur-[80px] pointer-events-none group-hover:bg-[#CCFF00]/10 transition-colors" />
         <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
               <h3 className="text-[14px] font-bold text-white uppercase tracking-widest font-open-sans">Revenue Intelligence</h3>
               <p className="text-[11px] text-[#878C9F] font-inter uppercase tracking-widest mt-1">Daily Coin Accrual vs Last Week</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-[2px] bg-[#CCFF00]" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">This Week</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-[2px] bg-white/20" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Last Week</span>
               </div>
            </div>
         </div>

         <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={analyticsData}>
                  <defs>
                     <linearGradient id="colorCoins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D2D2D" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#878C9F', fontSize: 10, fontWeight: 'medium', textTransform: 'uppercase'}}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#000000', border: '1px solid #2D2D2D', borderRadius: '8px', padding: '12px'}}
                    itemStyle={{color: '#CCFF00', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', fontFamily: 'Inter'}}
                  />
                  <Area type="monotone" dataKey="lastWeek" stroke="#2D2D2D" strokeWidth={2} fill="transparent" />
                  <Area type="monotone" dataKey="coins" stroke="#CCFF00" strokeWidth={3} fillOpacity={1} fill="url(#colorCoins)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
        
        {/* Withdrawal History */}
        <div className="lg:col-span-2 bg-[#000000] border border-[#2D2D2D] rounded-[12px] p-8 shadow-2xl">
           <div className="flex justify-between items-center mb-8 border-b border-[#2D2D2D] pb-6">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-[#CCFF00] rounded-full" />
                 <h2 className="text-[13px] font-bold text-white uppercase tracking-[4px] flex items-center gap-2">
                    Withdrawal Registry
                 </h2>
              </div>
              <ShieldCheck size={18} className="text-[#2D2D2D]" />
           </div>
           
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-bold text-[#444] uppercase tracking-[3px] border-b border-[#2D2D2D]">
                       <th className="pb-4 px-2">Timestamp</th>
                       <th className="pb-4 px-2">Quantum</th>
                       <th className="pb-4 px-2">Status</th>
                       <th className="pb-4 px-2">Audit ID</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#2D2D2D]/30">
                    {withdrawals.length > 0 ? (
                      withdrawals.map((w) => (
                        <tr key={w._id} className="group hover:bg-white/[0.01] transition-all">
                           <td className="py-5 px-2 text-[#878C9F] text-xs font-bold uppercase tracking-wider">{new Date(w.createdAt).toLocaleDateString()}</td>
                           <td className="py-5 px-2">
                             <span className="text-sm font-bold text-white group-hover:text-[#CCFF00] transition-colors">₹{w.amount.toLocaleString()}</span>
                           </td>
                           <td className="py-5 px-2">
                              <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${
                                w.status === 'COMPLETED' ? 'bg-[#CCFF00]/5 border-[#CCFF00]/20 text-[#CCFF00]' :
                                w.status === 'PENDING' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' :
                                'bg-red-500/5 border-red-500/20 text-red-500'
                              }`}>
                                 {w.status}
                              </span>
                           </td>
                           <td className="py-5 px-2 text-[#333] font-mono text-[10px] tracking-tighter group-hover:text-[#666] transition-colors">{w.transactionId || 'AWAITING_SETTLEMENT'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-20 text-center">
                           <div className="flex flex-col items-center gap-4 opacity-20">
                              <AlertCircle size={40} />
                              <p className="text-[10px] font-bold uppercase tracking-[4px]">Zero Financial Movements</p>
                           </div>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[12px] p-8 flex flex-col shadow-2xl">
           <div className="flex items-center gap-3 mb-8 border-b border-[#2D2D2D] pb-6">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
              <h2 className="text-[13px] font-bold text-white uppercase tracking-[4px]">
                 Live Stream
              </h2>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="p-4 bg-[#050505] rounded-[8px] border border-[#2D2D2D] hover:border-[#CCFF00]/20 transition-all group">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-[#111] border border-[#2D2D2D] text-[#878C9F] flex items-center justify-center group-hover:border-[#CCFF00]/40 group-hover:text-[#CCFF00] transition-all">
                            <ArrowDownRight size={18} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">{tx.customer}</p>
                            <p className="text-[9px] text-[#444] font-bold uppercase tracking-[2px] mt-1">{tx.date}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-lg font-bold text-[#CCFF00] tracking-tighter">+₹{tx.amount}</p>
                         <p className="text-[8px] text-[#444] font-bold uppercase tracking-widest mt-1">Settled</p>
                      </div>
                   </div>
                </div>
              ))}
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
                       <p className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[3px]">Available Intelligence</p>
                       <p className="text-3xl font-bold tracking-tight text-white font-['Open_Sans']">₹{walletData.usableBalance.toLocaleString()}</p>
                       <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
                          <ShieldCheck size={10} />
                          Minimum threshold: ₹500
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
                            max={walletData.usableBalance}
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
                   disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) > walletData.usableBalance}
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
