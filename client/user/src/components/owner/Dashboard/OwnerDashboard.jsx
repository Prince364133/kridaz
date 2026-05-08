import React, { useState } from "react";
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
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  Calendar, 
  Star, 
  TrendingUp, 
  Building,
  Users,
  ChevronRight,
  ArrowUpRight,
  Activity,
  MapPin,
  Users2,
  ShieldCheck,
  Zap,
  Info,
  ExternalLink,
  Clock,
  CheckCircle2,
  Search
} from "lucide-react";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import { useSelector } from "react-redux";
import useOwnerDashboard from "@hooks/owner/useOwnerDashboard";
import DashboardSkeleton from "./DashboardSkeleton";

const OwnerDashboard = () => {
  const { dashboardData, loading, error } = useOwnerDashboard();
  const user = useSelector((state) => state.auth.user);

  const [timeFilter, setTimeFilter] = useState("Month");
  const [revenueFilter, setRevenueFilter] = useState("Month");

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
    bookingsPerTurfDay = [],
    bookingsPerTurfWeek = [],
    bookingsPerTurfMonth = [],
    revenueOverTimeRaw = [],
    revenueByCategory = [],
    occupancyHeatmap = [],
    venueHealth = {},
    recentBookings = [],
    utilization,
    activeUsers
  } = dashboardData;

  const pieDataMap = {
    Day: bookingsPerTurfDay.length > 0 ? bookingsPerTurfDay : [
      { name: "Main Arena", value: 0 },
      { name: "East Turf", value: 0 },
      { name: "Indoor Court", value: 0 },
      { name: "Mini Ground", value: 0 },
    ],
    Week: bookingsPerTurfWeek.length > 0 ? bookingsPerTurfWeek : [
      { name: "Main Arena", value: 0 },
      { name: "East Turf", value: 0 },
      { name: "Indoor Court", value: 0 },
      { name: "Mini Ground", value: 0 },
    ],
    Month: bookingsPerTurfMonth.length > 0 ? bookingsPerTurfMonth : [
      { name: "Main Arena", value: 0 },
      { name: "East Turf", value: 0 },
      { name: "Indoor Court", value: 0 },
      { name: "Mini Ground", value: 0 },
    ],
  };

  const revenueDataMap = {
    Day: [
      { date: "06:00", revenue: 0 },
      { date: "09:00", revenue: 0 },
      { date: "12:00", revenue: 0 },
      { date: "15:00", revenue: 0 },
      { date: "18:00", revenue: 0 },
      { date: "21:00", revenue: 0 },
    ],
    Week: revenueOverTimeRaw.length > 0 ? revenueOverTimeRaw.map(i => ({ 
      date: new Date(i._id).toLocaleDateString('en-US', { weekday: 'short' }), 
      revenue: i.revenue 
    })) : [
      { date: "Mon", revenue: 0 },
      { date: "Tue", revenue: 0 },
      { date: "Wed", revenue: 0 },
      { date: "Thu", revenue: 0 },
      { date: "Fri", revenue: 0 },
      { date: "Sat", revenue: 0 },
      { date: "Sun", revenue: 0 },
    ],
    Month: [
      { date: "Week 1", revenue: 0 },
      { date: "Week 2", revenue: 0 },
      { date: "Week 3", revenue: 0 },
      { date: "Week 4", revenue: 0 },
    ],
  };

  const COLORS = ["#84CC16", "#10B981", "#3B82F6", "#6366F1"];

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="h-full custom-scrollbar bg-[#000000]">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 lg:space-y-10 animate-fade-in pt-0 pb-24 h-full relative">
        
        <div className="space-y-8 lg:space-y-10 relative z-10">
          
          {/* New Stats Grid - 6 Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
            <StatsCard 
              title="Total Bookings"
              value={totalBookings}
              icon={Calendar}
              trend="+12.5%"
            />
            <StatsCard 
              title="Total Revenue"
              value={totalRevenue}
              prefix="₹"
              icon={TrendingUp}
              trend="+8.2%"
            />
            <StatsCard 
              title="Utilization Rate"
              value={utilization || 78}
              suffix="%"
              icon={Activity}
              trend="+4.1%"
            />
            <StatsCard 
              title="Active Grounds"
              value={totalTurfs || 1}
              icon={MapPin}
              trend="Stable"
            />
            <StatsCard 
              title="Average Rating"
              value={averageRating || 4.9}
              icon={Star}
              trend="+0.2"
            />
            <StatsCard 
              title="Repeat Customers"
              value={42}
              suffix="%"
              icon={Users2}
              trend="-2.4%"
              trendNegative
            />
          </div>

          {/* Main Analytics Row: 3 Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Booking Performance */}
            <div className="lg:col-span-6">
              <ChartCard 
                title="Booking Performance" 
                subtitle="Weekly operational trends"
                action={
                  <div className="flex items-center gap-2 bg-[#2D2D2D] p-1 rounded-[6px]">
                    {["Weekly", "Monthly"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setRevenueFilter(filter === "Weekly" ? "Week" : "Month")}
                        className={`px-4 py-1.5 rounded-[4px] text-[11px] font-normal uppercase tracking-wider transition-all font-[Arial] ${
                          (revenueFilter === "Week" && filter === "Weekly") || (revenueFilter === "Month" && filter === "Monthly")
                            ? "bg-[#CCFF00] text-black" 
                            : "text-[#999999] hover:text-[#FFFFFF]"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueDataMap[revenueFilter]}>
                    <defs>
                      <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                    <XAxis dataKey="date" stroke="#999999" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#999999" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#151617', border: '1px solid #2D2D2D', borderRadius: '8px', padding: '12px' }}
                      itemStyle={{ color: '#CCFF00', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'Inter' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#CCFF00" strokeWidth={2} fillOpacity={1} fill="url(#colorPerf)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Revenue Split */}
            <div className="lg:col-span-3">
              <ChartCard title="Revenue Split" subtitle="Distribution by category">
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={revenueByCategory.length > 0 ? revenueByCategory : [
                          { name: "Football", value: 36 },
                          { name: "Cricket", value: 24 },
                          { name: "Badminton", value: 24 },
                          { name: "Tennis", value: 16 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {(revenueByCategory.length > 0 ? revenueByCategory : [{},{},{},{}]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#CCFF00" : index === 1 ? "#BFFF00" : index === 2 ? "#ADEB00" : "#878C9F"} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#151617', border: '1px solid #2D2D2D', borderRadius: '8px' }}
                        itemStyle={{ textTransform: 'uppercase', fontSize: '10px', color: '#CCFF00', fontFamily: 'Inter' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="grid grid-cols-1 gap-2 mt-4 w-full px-2">
                    {(revenueByCategory.length > 0 ? revenueByCategory.slice(0, 4) : [
                      { name: "Football", value: 36 },
                      { name: "Cricket", value: 24 },
                      { name: "Badminton", value: 24 },
                      { name: "Tennis", value: 16 },
                    ]).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: idx === 0 ? "#CCFF00" : idx === 1 ? "#BFFF00" : idx === 2 ? "#ADEB00" : "#878C9F" }} />
                          <span className="text-[9px] font-medium text-[#999999] uppercase tracking-wider">{item.name}</span>
                        </div>
                        <span className="text-[9px] font-semibold text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Venue Health */}
            <div className="lg:col-span-3">
              <ChartCard 
                title="Venue Health" 
                subtitle="Optimization Score"
                action={
                  <div className="w-8 h-8 bg-[#CCFF00]/10 text-[#CCFF00] rounded-[6px] flex items-center justify-center border border-[#CCFF00]/20">
                    <ShieldCheck size={18} />
                  </div>
                }
              >
                <div className="flex flex-col h-full">
                  {/* Gauge */}
                  <div className="flex-1 flex flex-col items-center justify-center py-2">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="54" fill="none" stroke="currentColor" strokeWidth="10" className="text-[#1A1A1A]" />
                        <circle 
                          cx="64" 
                          cy="64" 
                          r="54" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="10" 
                          strokeDasharray={340} 
                          strokeDashoffset={340 - (340 * (venueHealth.score || 82)) / 100} 
                          className="text-[#CCFF00] transition-all duration-1000 ease-out" 
                          strokeLinecap="round"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(204, 255, 0, 0.4))' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-semibold text-white tracking-tight">{venueHealth.score || 82}%</span>
                        <span className="text-[9px] font-medium text-[#CCFF00] uppercase tracking-[1px]">Optimized</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {[
                      { label: "Profile Comp.", value: `${venueHealth.profileComp || 95}%` },
                      { label: "Response Rate", value: `${venueHealth.responseRate || 98}%` },
                      { label: "Satisfaction", value: `${venueHealth.satisfaction || 4.8}/5` },
                      { label: "Cancellation", value: `${venueHealth.cancellation || 1.2}%` },
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#151617] p-2.5 rounded-[6px] border border-[#2D2D2D]/50">
                        <p className="text-[8px] font-normal text-[#878C9F] uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-[12px] font-semibold text-white tracking-tight">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button className="w-full mt-5 py-2.5 bg-transparent border border-[#CCFF00]/30 hover:border-[#CCFF00] hover:bg-[#CCFF00]/5 text-[#CCFF00] text-[11px] font-medium uppercase tracking-[0.15em] rounded-[6px] transition-all flex items-center justify-center gap-2 group">
                    Improve Your Score
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </ChartCard>
            </div>

          </div>

          {/* Row: Heatmap and Feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Occupancy Heatmap */}
            <div className="lg:col-span-8">
              <ChartCard 
                title="Occupancy Heatmap" 
                subtitle="Live peak hour identification"
                className="h-auto"
                action={
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-[2px] bg-[#2D2D2D]" />
                      <span className="text-[10px] text-[#999999] font-medium uppercase tracking-wider">Low</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-[2px] bg-[#CCFF00]" />
                      <span className="text-[10px] text-[#999999] font-medium uppercase tracking-wider">Peak</span>
                    </div>
                  </div>
                }
              >
                <div className="overflow-x-auto no-scrollbar pt-4">
                  <div className="min-w-[700px] space-y-2">
                    {/* Hours Header */}
                    <div className="flex gap-1 mb-4 ml-10">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="flex-1 text-center text-[8px] font-medium text-[#999999] uppercase tracking-wider">
                          {i.toString().padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                    {/* Days Rows */}
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div key={day} className="flex items-center gap-1">
                        <div className="w-10 text-[10px] font-medium text-[#878C9F] uppercase tracking-wider">{day}</div>
                        <div className="flex-1 flex gap-1">
                          {Array.from({ length: 24 }).map((_, hour) => {
                            const data = occupancyHeatmap.find(d => d.day === day && d.hour === hour);
                            const intensity = data ? Math.min(1, data.value / 10) : 0;
                            return (
                              <div 
                                key={hour} 
                                className="flex-1 h-8 rounded-[2px] transition-all duration-500 hover:scale-110 cursor-pointer"
                                style={{ 
                                  backgroundColor: intensity > 0 ? `rgba(204, 255, 0, ${0.1 + intensity * 0.9})` : 'rgba(45, 45, 45, 0.3)',
                                  boxShadow: intensity > 0.7 ? '0 0 10px rgba(204, 255, 0, 0.15)' : 'none'
                                }}
                                title={`${day}, ${hour}:00 - ${data?.value || 0} Bookings`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Sidebar Feed */}
            <div className="lg:col-span-4">
              
              {/* Live Feed */}
              <div className="bg-[#000000] p-6 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[14px] font-semibold text-white uppercase tracking-wider">Live Feed</h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] rounded-full text-[10px] font-medium uppercase tracking-widest animate-pulse border border-[#CCFF00]/20">
                    <span className="w-1 h-1 bg-[#CCFF00] rounded-full" /> Live
                  </div>
                </div>
                
                <div className="space-y-6">
                  {[
                    { icon: Zap, title: "New booking received", desc: "Arjun K booked Ground 1 for 2 hours.", time: "2 mins ago", color: "text-[#CCFF00]" },
                    { icon: Info, title: "Ground 2 at capacity", desc: "90% occupancy reached for evening slots.", time: "15 mins ago", color: "text-[#0000EE]" },
                    { icon: CheckCircle2, title: "Payment successful", desc: "₹2,400 received for Booking #8003.", time: "45 mins ago", color: "text-[#4CAF50]" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group cursor-pointer">
                      <div className={`mt-1 p-2 rounded-[6px] bg-[#2D2D2D] ${item.color} group-hover:scale-110 transition-transform`}><item.icon size={14} /></div>
                      <div>
                        <p className="text-[14px] font-semibold text-white uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">{item.title}</p>
                        <p className="text-[12px] text-[#999999] mt-0.5">{item.desc}</p>
                        <p className="text-[10px] font-medium text-[#878C9F] uppercase mt-1 flex items-center gap-1"><Clock size={10} /> {item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-8 py-3 bg-transparent border border-[#2D2D2D] hover:bg-[#CCFF00]/10 hover:text-[#CCFF00] text-[#999999] text-[13px] font-normal uppercase tracking-widest rounded-[6px] transition-all font-[Arial]">
                  View Full Activity History
                </button>
              </div>
            </div>
          </div>

          {/* Row: Bookings and Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Recent Bookings Table */}
            <div className="lg:col-span-8">
              <div className="bg-[#000000] p-6 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-semibold text-white uppercase tracking-tight">Recent Bookings</h2>
                    <p className="text-[12px] font-normal text-[#999999] uppercase tracking-widest mt-1">Manage active sessions</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]" size={14} />
                      <input 
                        type="text" 
                        placeholder="Filter player..." 
                        className="bg-[#2D2D2D] border border-[#404040] rounded-[6px] py-2 pl-9 pr-4 text-[14px] text-white focus:outline-none focus:border-[#CCFF00] transition-all font-inter"
                      />
                    </div>
                    <button className="w-10 h-10 bg-[#2D2D2D] text-[#999999] rounded-[6px] flex items-center justify-center hover:text-white transition-colors border border-[#404040]"><Activity size={18} /></button>
                  </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#2D2D2D]">
                        <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Player</th>
                        <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Sport / Ground</th>
                        <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Timing</th>
                        <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Status</th>
                        <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Payment</th>
                        <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D2D2D]/30">
                      {(recentBookings.length > 0 ? recentBookings.slice(0, 5) : [{},{},{},{},{}]).map((booking, i) => (
                        <tr key={i} className="group hover:bg-[#2D2D2D]/20 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-[4px] bg-[#2D2D2D] flex items-center justify-center text-[12px] font-semibold text-white uppercase border border-[#404040]">
                                {booking?.user?.name?.[0] || "U"}
                              </div>
                              <div>
                                <p className="text-[14px] font-semibold text-white uppercase tracking-tight">{booking?.user?.name || "Player Name"}</p>
                                <p className="text-[12px] font-normal text-[#999999]">B00{i+1}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div>
                              <p className="text-[14px] font-semibold text-white uppercase tracking-tight">{booking?.turf?.category || "Football"}</p>
                              <p className="text-[12px] font-normal text-[#999999] uppercase">{booking?.turf?.name || "Ground Name"}</p>
                            </div>
                          </td>
                          <td className="py-4">
                            <div>
                              <p className="text-[14px] font-semibold text-white tracking-tight">18:00 - 19:00</p>
                              <p className="text-[12px] font-medium text-[#CCFF00] uppercase">Today</p>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="px-3 py-1 bg-[#4CAF50]/15 text-[#4CAF50] text-[12px] font-medium uppercase tracking-wider rounded-[12px] border border-[#4CAF50]/30">Confirmed</span>
                          </td>
                          <td className="py-4">
                            <div>
                              <p className="text-[14px] font-semibold text-white tracking-tight">₹1,500</p>
                              <p className="text-[12px] font-medium text-[#4CAF50] uppercase">Paid</p>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <button className="p-2 text-[#878C9F] hover:text-[#CCFF00] transition-colors"><ExternalLink size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-8 pt-6 border-t border-[#2D2D2D] flex items-center justify-between">
                  <p className="text-[12px] font-normal text-[#999999] uppercase tracking-widest">Showing 5 of {totalBookings} bookings</p>
                  <button className="text-[13px] font-normal text-[#CCFF00] uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all font-[Arial]">
                    View All Transactions <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Insights Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-[#000000] p-6 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[80px]" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-[#CCFF00]/10 text-[#CCFF00] rounded-[6px] border border-[#CCFF00]/20"><Zap size={20} /></div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-white uppercase tracking-wider">Smart Insights</h2>
                    <p className="text-[10px] font-normal text-[#878C9F] uppercase tracking-widest">AI Powered Recommendations</p>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {[
                    { icon: TrendingUp, title: "Offer weekday discounts", desc: "Boost Monday-Thursday morning bookings by 20% with a 'Early Bird' promo.", action: "Create Offer" },
                    { icon: Activity, title: "Boost Ground 3 visibility", desc: "This ground has 40% lower occupancy than others this month.", action: "Promote Now" },
                  ].map((item, i) => (
                    <div key={i} className="bg-[#2D2D2D]/20 p-4 rounded-[6px] border border-[#2D2D2D] hover:bg-[#2D2D2D]/40 transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 rounded-[6px] bg-[#CCFF00]/10 text-[#CCFF00] group-hover:scale-110 transition-transform"><item.icon size={14} /></div>
                        <div className="flex-1">
                          <p className="text-[14px] font-semibold text-white uppercase tracking-tight">{item.title}</p>
                          <p className="text-[12px] text-[#999999] mt-1 leading-relaxed">{item.desc}</p>
                          <button className="mt-3 text-[12px] font-normal text-[#CCFF00] uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors font-[Arial]">
                            {item.action} <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Metrics */}
          <div className="pt-8 lg:pt-16 border-t border-[#2D2D2D] flex flex-col sm:flex-row gap-4 justify-between items-center pb-8 opacity-40">
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-medium uppercase tracking-widest">System Status: Optimized</span>
               <div className="h-4 w-[1px] bg-[#2D2D2D] hidden sm:block" />
               <span className="text-[10px] font-medium uppercase tracking-widest">Business Intelligence Platform</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, prefix = "", suffix = "", icon: Icon, trend, trendNegative }) => {
  return (
    <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden group hover:border-[#CCFF00]/30 transition-all duration-500 min-h-[140px] shadow-[var(--shadow-2)]">
      {/* Background Watermark Icon */}
      <Icon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
      
      {/* Top Row: Icon and Trend */}
      <div className="flex items-center justify-between mb-5">
        <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[6px] text-[#CCFF00] flex items-center justify-center transition-all shadow-sm">
          <Icon size={20} />
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 ${
          trend === 'Stable' ? 'bg-blue-500/10 text-blue-400' : 
          trendNegative ? 'bg-red-500/10 text-red-400' : 'bg-[#CCFF00]/10 text-[#CCFF00]'
        }`}>
          {trend}
        </div>
      </div>

      {/* Middle: Title and Value */}
      <div className="space-y-2 relative z-10">
        <h3 className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px]">{title}</h3>
        <div className="text-2xl font-semibold text-white tracking-tight flex items-baseline gap-1">
          {prefix && <span className="text-lg text-white/40 font-normal">{prefix}</span>}
          <CountUp end={value} duration={2} separator="," decimals={value % 1 === 0 ? 0 : 1} />
          {suffix && <span className="text-lg text-white/40 font-normal">{suffix}</span>}
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, action, className = "h-full" }) => (
  <div className={`bg-[#000000] p-6 lg:p-8 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] relative overflow-hidden group flex flex-col ${className}`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[60px] group-hover:bg-[#CCFF00]/10 transition-colors"></div>
    <div className="flex flex-col gap-2 mb-6 relative z-10 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-[-0.3px] leading-none mb-2">
            {title}
          </h2>
          <p className="text-[12px] text-[#999999] tracking-normal">{subtitle}</p>
        </div>
        {action && <div className="z-20 self-start sm:self-auto">{action}</div>}
      </div>
    </div>
    <div className="flex-1 min-h-0">
      {children}
    </div>
  </div>
);

export default OwnerDashboard;
