import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  Star,
  TrendingUp,
  Activity,
  MapPin,
  Users2,
  ChevronRight,
  Zap,
  Info,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  BarChart2,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import { useSelector } from "react-redux";
import useOwnerDashboard from "@hooks/owner/useOwnerDashboard";
import DashboardSkeleton from "./DashboardSkeleton";
import OccupancyHeatmap from "./OccupancyHeatmap";
import PeakHoursChart from "./PeakHoursChart";

const OwnerDashboard = () => {
  const { dashboardData, loading, error } = useOwnerDashboard();
  const { role, user } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#BFF367" : "#BFF367";
  const dashboardTitle = isScorer ? "SCORER Dashboard" : "Dashboard Overview";

  const [timeFilter, setTimeFilter] = useState("Month");
  const [revenueFilter, setRevenueFilter] = useState("Month");
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-red-500">Connection Interrupted</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 border border-red-500/50 text-red-500 font-bold uppercase rounded-[8px] hover:bg-red-500/10 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    totalBookings = 0,
    totalReviews = 0,
    averageRating = 0,
    totalRevenue = 0,
    totalTurfs = 0,
    bookingsPerTurfDay = [],
    bookingsPerTurfWeek = [],
    bookingsPerTurfMonth = [],
    revenueOverTimeRaw = [],
    revenueByVenue = [],
    occupancyHeatmap = [],
    venueHealth = {},
    recentBookings = [],
    utilization = 0,
    activeUsers = 0,
  } = dashboardData;

  // Only use real data ΓÇô no hardcoded fallbacks
  const pieDataMap = {
    Day: bookingsPerTurfDay,
    Week: bookingsPerTurfWeek,
    Month: bookingsPerTurfMonth,
  };

  const revenueDataMap = {
    Day: (dashboardData.revenueTrendDay || []).map(i => ({
      date: `${String(i.id || i._id).padStart(2, '0')}:00`,
      revenue: i.revenue
    })),
    Week: (dashboardData.revenueTrendWeek || []).map(i => ({
      date: new Date(i.id || i._id).toLocaleDateString("en-US", { weekday: "short" }),
      revenue: i.revenue,
    })),
    Month: (dashboardData.revenueTrendMonth || []).map(i => ({
      date: new Date(i.id || i._id).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      revenue: i.revenue,
    })),
  };

  const COLORS = [themeColor, "#10B981", "#3B82F6", "#6366F1", "#F59E0B", "#EF4444"];

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const currentPieData = pieDataMap[timeFilter] || [];
  const currentRevenueData = revenueDataMap[revenueFilter] || [];

  return (
    <div className="h-full custom-scrollbar bg-[#000000]">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 lg:space-y-10 animate-fade-in pt-0 pb-24 h-full relative">
        <div className="space-y-8 lg:space-y-10 relative z-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/5">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                {getTimeGreeting()}, <span style={{ color: themeColor }}>{user?.name || "PARTNER"}</span>
              </h2>
            </div>
          </div>

          {/* Stats Grid ΓÇô 6 Cards (all real data, no hardcoded fallbacks) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
            <StatsCard title="Total Bookings" value={totalBookings} icon={Calendar} themeColor={themeColor} />
            <StatsCard title="Total Revenue" value={totalRevenue} prefix="Rs " icon={TrendingUp} themeColor={themeColor} />
            <StatsCard title="Utilization Rate" value={utilization} suffix="%" icon={Activity} themeColor={themeColor} />
            <StatsCard title="Active Grounds" value={totalTurfs} icon={MapPin} themeColor={themeColor} />
            <StatsCard title="Average Rating" value={Number(averageRating)} icon={Star} themeColor={themeColor} />
            <StatsCard title="Total Reviews" value={totalReviews} icon={Users2} themeColor={themeColor} />
          </div>

          {/* Main Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* Booking Performance */}
            <div className="lg:col-span-6">
              <ChartCard
                title="Booking Performance"
                subtitle="Revenue trends over time"
                action={
                  <div className="flex items-center gap-2 bg-[#2D2D2D] p-1 rounded-[6px]">
                    {["Weekly", "Monthly"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setRevenueFilter(filter === "Weekly" ? "Week" : "Month")}
                        className={`px-4 py-1.5 rounded-[4px] text-[11px] font-normal uppercase tracking-wider transition-all font-inter ${ (revenueFilter === "Week" && filter === "Weekly") || (revenueFilter === "Month" && filter === "Monthly") ? "bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black" : "text-[#999999] hover:text-[#FFFFFF]" }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                }
              >
                {currentRevenueData.length > 0 && currentRevenueData.some((d) => d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={currentRevenueData}>
                      <defs>
                        <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={themeColor} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                      <XAxis dataKey="date" stroke="#999999" fontSize={10} tickLine={false} axisLine={false} font-family="Inter" />
                      <YAxis stroke="#999999" fontSize={10} tickLine={false} axisLine={false} font-family="Inter" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#151617", border: "1px solid #2D2D2D", borderRadius: "8px", padding: "12px" }}
                        itemStyle={{ color: themeColor, fontSize: "12px", textTransform: "uppercase", fontFamily: "Inter" }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke={themeColor} strokeWidth={2} fillOpacity={1} fill="url(#colorPerf)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState height={300} icon={BarChart2} message="No revenue data yet" sub="Start accepting bookings to see trends" />
                )}
              </ChartCard>
            </div>

            {/* Revenue Split */}
            <div className="lg:col-span-6">
              <ChartCard title="Revenue Split" subtitle="Distribution by sport category">
                {revenueByVenue.length > 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px]">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={revenueByVenue}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {revenueByVenue.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#151617", border: "1px solid #2D2D2D", borderRadius: "8px" }}
                          itemStyle={{ textTransform: "uppercase", fontSize: "10px", color: themeColor, fontFamily: "Inter" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-1 gap-2 mt-4 w-full px-2">
                      {revenueByVenue.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-[9px] font-medium text-[#999999] uppercase tracking-wider">{item.name}</span>
                          </div>
                          <span className="text-[9px] font-semibold text-white">Rs {item.value?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState height={300} icon={Package} message="No category data yet" sub="Revenue split will appear after bookings" />
                )}
              </ChartCard>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            <div className="lg:col-span-8 space-y-8">
              <OccupancyHeatmap />

              {/* Recent Bookings */}
              <div className="bg-[#000000] p-6 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter" style={{ fontFamily: "'Open Sans', sans-serif" }}>Recent Bookings</h2>
                    <p className="text-[#999999] uppercase mt-1 global-subheading font-inter font-light">Manage active sessions</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]" size={14} />
                      <input
                        type="text"
                        placeholder="Filter player..."
                        className="bg-[#2D2D2D] border border-[#404040] rounded-[6px] py-2 pl-9 pr-4 text-[14px] text-white focus:outline-none transition-all font-inter"
                        style={{ '--tw-ring-color': themeColor }}
                      />
                    </div>
                  </div>
                </div>

                {recentBookings.length > 0 ? (
                  <>
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#2D2D2D]">
                            <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Player</th>
                            <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Sport / Ground</th>
                            <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Status</th>
                            <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Payment</th>
                            <th className="pb-4 text-[12px] font-medium text-[#999999] uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D2D2D]/30">
                          {recentBookings.slice(0, 5).map((booking, i) => (
                            <tr key={i} className="group hover:bg-[#2D2D2D]/20 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-[4px] bg-[#2D2D2D] flex items-center justify-center text-[12px] font-semibold text-white uppercase border border-[#404040]">
                                    {booking?.user?.name?.[0] || booking?.guestDetails?.name?.[0] || "G"}
                                  </div>
                                  <div>
                                    <p className="text-[14px] font-semibold text-white uppercase tracking-tight">
                                      {booking?.user?.name || booking?.guestDetails?.name || "Guest"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <div>
                                  <p className="text-[14px] font-semibold text-white uppercase tracking-tight">{booking?.turf?.category || "-"}</p>
                                  <p className="text-[12px] font-normal text-[#999999] uppercase">{booking?.turf?.name || "-"}</p>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className={`px-3 py-1 text-[12px] font-medium uppercase tracking-wider rounded-[12px] border ${ booking?.status === "CANCELLED" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-[#4CAF50]/15 text-[#4CAF50] border-[#4CAF50]/30" }`}>
                                  {booking?.status || "Confirmed"}
                                </span>
                              </td>
                              <td className="py-4">
                                <p className="text-[14px] font-semibold text-white tracking-tight">Rs {booking?.totalPrice || "0"}</p>
                              </td>
                              <td className="py-4 text-right">
                                <button className="p-2 text-[#878C9F] transition-colors" style={{ color: themeColor }}>
                                  <ExternalLink size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-8 pt-6 border-t border-[#2D2D2D] flex items-center justify-between">
                      <p className="text-[12px] font-normal text-[#999999] uppercase tracking-widest">
                        Showing {Math.min(5, recentBookings.length)} of {totalBookings} bookings
                      </p>
                      <Link to="/venue-owner/bookings" className="text-[13px] font-normal uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all font-inter" style={{ color: themeColor }}>
                        View All <ChevronRight size={14} />
                      </Link>
                    </div>
                  </>
                ) : (
                  <EmptyState height={200} icon={Calendar} message="No bookings yet" sub="Your first booking will appear here" />
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="space-y-6 lg:space-y-8 h-full flex flex-col">
                <PeakHoursChart />

                {/* Live Feed */}
                <div className="bg-[#000000] p-6 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[14px] font-black text-white uppercase tracking-wider" style={{ fontFamily: "'Open Sans', sans-serif" }}>Live Feed</h2>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[10px] font-medium uppercase tracking-widest animate-pulse border"
                         style={{ backgroundColor: `${themeColor}1A`, color: themeColor, borderColor: `${themeColor}33` }}>
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: themeColor }} /> Live
                    </div>
                  </div>

                  {recentBookings.length > 0 ? (
                    <div className="space-y-6">
                      {recentBookings.slice(0, 3).map((booking, i) => (
                        <div key={i} className="flex gap-4 group cursor-pointer">
                          <div className="mt-1 p-2 rounded-[6px] bg-[#2D2D2D] group-hover:scale-110 transition-transform" style={{ color: themeColor }}>
                            <CheckCircle2 size={14} />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-white uppercase tracking-tight transition-colors" style={{ color: themeColor }}>
                              Booking {booking?.status === "CANCELLED" ? "Cancelled" : "Confirmed"}
                            </p>
                            <p className="text-[12px] text-[#999999] mt-0.5">
                              {booking?.user?.name || booking?.guestDetails?.name || "Guest"} booked {booking?.turf?.name || "a ground"}
                            </p>
                            <p className="text-[10px] font-medium text-[#878C9F] uppercase mt-1 flex items-center gap-1">
                              <Clock size={10} /> Rs {booking?.totalPrice || 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3 opacity-40">
                      <Zap size={32} className="text-gray-600" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">No activity yet</p>
                      <p className="text-[10px] text-gray-600">Live events will appear here</p>
                    </div>
                  )}

                  <Link to="/venue-owner/bookings" className="w-full mt-8 py-3 bg-transparent border border-[#2D2D2D] hover:text-white text-[#999999] text-[13px] font-normal uppercase tracking-widest rounded-[6px] transition-all font-inter flex items-center justify-center"
                        style={{ '--hover-bg': `${themeColor}1A`, '--hover-color': themeColor }}>
                    View Full Activity History
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ΓöÇΓöÇ Empty State Helper ΓöÇΓöÇ
const EmptyState = ({ height, icon: Icon, message, sub }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 text-center rounded-[8px] border border-dashed border-[#2D2D2D]"
    style={{ height }}
  >
    <Icon size={32} className="text-[#2D2D2D]" />
    <p className="text-[13px] font-semibold text-[#555] uppercase tracking-wider">{message}</p>
    {sub && <p className="text-[11px] text-[#444]">{sub}</p>}
  </div>
);

// ΓöÇΓöÇ Stats Card (no hardcoded trend badges) ΓöÇΓöÇ
const StatsCard = ({ title, value, prefix = "", suffix = "", icon: Icon, themeColor }) => {
  return (
    <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden group transition-all duration-500 min-h-[140px] shadow-[var(--shadow-2)]"
         style={{ borderColor: '#2D2D2D' }}>
      <Icon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
      <div className="flex items-center justify-between mb-5">
        <div className="w-10 h-10 rounded-[6px] flex items-center justify-center transition-all shadow-sm"
             style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}>
          <Icon size={20} />
        </div>
      </div>
      <div className="space-y-2 relative z-10">
        <h3 className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] font-inter">{title}</h3>
        <div className="text-2xl font-semibold text-white tracking-tight flex items-baseline gap-1 font-inter">
          {prefix && <span className="text-lg text-white/40 font-normal">{prefix}</span>}
          <CountUp end={Number(value) || 0} duration={2} separator="," decimals={(Number(value) || 0) % 1 === 0 ? 0 : 1} />
          {suffix && <span className="text-lg text-white/40 font-normal">{suffix}</span>}
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, action, className = "h-full" }) => (
  <div className={`bg-[#000000] p-6 lg:p-8 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] relative overflow-hidden group flex flex-col ${className}`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 blur-[60px] group-hover:bg-[#BFF367]/10 transition-colors"></div>
    <div className="flex flex-col gap-2 mb-6 relative z-10 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-white tracking-tighter leading-none mb-2 uppercase" style={{ fontFamily: "'Open Sans', sans-serif" }}>{title}</h2>
          <p className="text-[#999999] tracking-normal uppercase global-subheading font-inter font-light">{subtitle}</p>
        </div>
        {action && <div className="z-20 self-start sm:self-auto">{action}</div>}
      </div>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

export default OwnerDashboard;

