import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { 
  Calendar, 
  Star, 
  TrendingUp, 
  Building,
  Users,
  ChevronRight,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import useOwnerDashboard from "@hooks/owner/useOwnerDashboard";
import DashboardSkeleton from "./DashboardSkeleton";
import StatCard from "../../admin/Dashboard/StatCard"; // Reuse the standard StatCard

const OwnerDashboard = () => {
  const { dashboardData, loading, error } = useOwnerDashboard();

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-red-500">Connection Interrupted</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 border border-red-500/50 text-red-500 font-bold uppercase rounded-xl hover:bg-red-500/10 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    totalBookings,
    totalReviews,
    averageRating,
    totalRevenue,
    totalTurfs,
    bookingsPerTurf,
    revenueOverTime,
    recentBookings = [],
    utilization,
    activeUsers
  } = dashboardData;

  const revenueChartData = (revenueOverTime || []).map((item) => ({
    date: item.name,
    revenue: item.revenue,
  }));

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 lg:p-10 bg-[#000] min-h-screen text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#84CC16]/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Stats Grid - High Impact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="TOTAL BOOKINGS" 
            value={totalBookings} 
            icon={Calendar} 
            className="bg-white/5 border-white/10 rounded-2xl"
          />
          <StatCard 
            title="AVG RATING" 
            value={averageRating || 0} 
            icon={Star} 
            suffix=" / 5"
            className="bg-white/5 border-white/10 rounded-2xl"
          />
          <StatCard
            title="TOTAL REVENUE"
            value={totalRevenue}
            icon={TrendingUp}
            prefix="₹"
            className="bg-[#84CC16]/5 border-[#84CC16]/20 text-[#84CC16] rounded-2xl"
          />
          <StatCard 
            title="UTILIZATION" 
            value={utilization || 0} 
            icon={Activity} 
            suffix="%"
            className="bg-white/5 border-white/10 rounded-2xl"
          />
        </div>

        {/* Intelligence Hub - Main View */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight leading-none mb-2">Recent Operations</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Live Booking Telemetry</p>
              </div>
              <Link to="/partner/bookings" className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-[#84CC16] uppercase tracking-widest hover:bg-[#84CC16] hover:text-black transition-all">
                View All Bookings
              </Link>
           </div>

           <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Athlete</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Arena</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Time Slot</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Date</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking) => (
                      <tr key={booking._id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#84CC16]/20 border border-[#84CC16]/50 flex items-center justify-center text-[#84CC16] text-[10px] font-bold rounded-lg uppercase">
                                {booking.user?.name?.substring(0, 2) || "PL"}
                              </div>
                              <span className="text-sm font-bold text-white group-hover:text-[#84CC16] transition-colors">{booking.user?.name || "Player"}</span>
                           </div>
                        </td>
                        <td className="p-6 text-sm text-gray-400 font-medium">{booking.turf?.name || "Venue"}</td>
                        <td className="p-6">
                           <div className="flex flex-col">
                              <span className="text-xs text-white font-bold tracking-tight">
                                {booking.timeSlot ? `${formatTime(booking.timeSlot.startTime)} - ${formatTime(booking.timeSlot.endTime)}` : "TBD"}
                              </span>
                           </div>
                        </td>
                        <td className="p-6">
                           <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                             {new Date(booking.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                           </span>
                        </td>
                        <td className="p-6 text-right">
                           <span className="text-sm font-bold text-[#84CC16]">₹{booking.totalPrice}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">
                        No recent operations detected
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Charts Section - HUD Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="BOOKING DISTRIBUTION" subtitle="Performance across venues">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={bookingsPerTurf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: '12px' }}
                  itemStyle={{ color: '#84CC16', textTransform: 'uppercase' }}
                  cursor={{ fill: 'rgba(132,204,22,0.05)' }}
                />
                <Bar dataKey="bookings" fill="#84CC16" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="REVENUE GROWTH" subtitle="Earnings over time">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84CC16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84CC16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: '12px' }}
                  itemStyle={{ color: '#84CC16', textTransform: 'uppercase' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#84CC16" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>


        {/* Footer Metrics */}
        <div className="pt-16 border-t border-white/5 flex flex-wrap gap-8 justify-between items-center pb-8 opacity-40">
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-bold uppercase tracking-widest">System Status: Optimized</span>
             <div className="h-4 w-[1px] bg-white/10" />
             <span className="text-[10px] font-bold uppercase tracking-widest">Business Intelligence Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-[#0A0A0A] p-10 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-40 h-40 bg-[#84CC16]/5 blur-[100px] group-hover:bg-[#84CC16]/10 transition-colors"></div>
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-white uppercase tracking-tight leading-none mb-3">{title}</h2>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">{subtitle}</p>
    </div>
    {children}
  </div>
);

export default OwnerDashboard;
