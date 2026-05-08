import React, { useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { 
  IndianRupee, TrendingUp, Calendar, Download, 
  CreditCard, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2
} from "lucide-react";
import useOwnerDashboard from "@hooks/owner/useOwnerDashboard";
import useOwnerBookings from "@hooks/owner/useOwnerBookings";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";

export default function OwnerRevenue() {
  const { dashboardData, loading: dashboardLoading } = useOwnerDashboard();
  const { bookings, loading: bookingsLoading } = useOwnerBookings();

  if (dashboardLoading || bookingsLoading) return <DashboardSkeleton />;

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

  // Revenue Over Time for Area Chart
  let revenueTrendData = [];
  if (dashboardData?.revenueOverTime && dashboardData.revenueOverTime.length > 0) {
    revenueTrendData = dashboardData.revenueOverTime.map(item => ({
      date: item._id, // Assuming date string
      amount: item.totalAmount
    }));
  } else {
    // Fallback Mock Data if insufficient
    revenueTrendData = [
      { date: "Mon", amount: 4000 },
      { date: "Tue", amount: 3000 },
      { date: "Wed", amount: 5000 },
      { date: "Thu", amount: 2780 },
      { date: "Fri", amount: 8900 },
      { date: "Sat", amount: 12000 },
      { date: "Sun", amount: 15000 },
    ];
  }

  // Recent Transactions
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
          <p className="text-[#878C9F] text-sm mt-1 uppercase tracking-widest text-[10px] font-bold">Financial analytics and transaction monitoring</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#2D2D2D] rounded-[8px] text-sm font-medium transition-colors w-full md:w-auto">
            <Calendar size={16} />
            This Month
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#CCFF00] hover:bg-[#b3ff00] text-black rounded-[8px] text-sm font-bold transition-colors w-full md:w-auto shadow-[0_0_15px_rgba(204,255,0,0.15)]">
            <Download size={18} />
            Statement
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <IndianRupee size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Total Revenue</p>
          <h3 className="text-3xl font-bold font-outfit text-white">₹{totalRevenue.toLocaleString()}</h3>
        </div>

        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <TrendingUp size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Today's Revenue</p>
          <h3 className="text-3xl font-bold font-outfit text-[#CCFF00]">₹{todaysRevenue.toLocaleString()}</h3>
        </div>

        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group opacity-80">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <Clock size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Pending Payouts</p>
          <h3 className="text-3xl font-bold font-outfit text-white">₹0</h3>
          <p className="text-[10px] text-[#444] mt-2 uppercase tracking-wider font-bold">All settlements cleared</p>
        </div>

        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group opacity-80">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <CreditCard size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Next Settlement</p>
          <h3 className="text-xl font-bold font-outfit text-white mt-2">N/A</h3>
          <p className="text-[10px] text-[#444] mt-2 uppercase tracking-wider font-bold">Standard payout cycle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6">
           <div className="flex justify-between items-start mb-6 border-b border-[#2D2D2D] pb-4">
              <div>
                 <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#CCFF00] rounded-full"></span>
                    Revenue Trajectory
                 </h2>
              </div>
           </div>
           
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={revenueTrendData}>
                 <defs>
                   <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                 <XAxis dataKey="date" stroke="#878C9F" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis stroke="#878C9F" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#111', borderColor: '#2D2D2D', borderRadius: '8px' }}
                   itemStyle={{ color: '#CCFF00', fontWeight: 'bold' }}
                   labelStyle={{ color: '#878C9F', fontSize: '12px' }}
                 />
                 <Area type="monotone" dataKey="amount" stroke="#CCFF00" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 flex flex-col">
           <div className="flex justify-between items-start mb-6 border-b border-[#2D2D2D] pb-4">
              <div>
                 <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Recent Transactions
                 </h2>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-[8px] border border-[#2D2D2D] hover:border-[#CCFF00]/30 transition-colors group">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                           <ArrowDownRight size={16} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white truncate max-w-[120px]">{tx.customer}</p>
                           <p className="text-[10px] text-[#878C9F] uppercase tracking-wider mt-0.5">{tx.date}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-bold text-[#CCFF00]">+₹{tx.amount}</p>
                        <p className="text-[9px] text-emerald-500 uppercase tracking-widest font-bold mt-0.5 flex items-center justify-end gap-1">
                           <CheckCircle2 size={10} /> {tx.status}
                        </p>
                     </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                   <Clock size={24} className="text-[#444] mb-2" />
                   <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">No recent transactions</p>
                </div>
              )}
           </div>
           
           <button className="w-full mt-4 py-3 bg-[#1A1A1A] border border-[#2D2D2D] text-[#878C9F] text-xs font-bold uppercase tracking-widest rounded-[8px] hover:text-white hover:border-white/20 transition-colors">
              View All Transactions
           </button>
        </div>

      </div>

    </div>
  );
}
