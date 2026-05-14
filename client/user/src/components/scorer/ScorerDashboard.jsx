import React, { useState, useEffect } from "react";
import {
  Trophy,
  Calendar,
  Star,
  DollarSign,
  Zap,
  MapPin,
  BarChart2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  TrendingUp,
  Activity
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link, useNavigate } from "react-router-dom";
import CountUp from "react-countup";
import { useSelector } from "react-redux";
import useScorerDashboard from "@hooks/owner/useScorerDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

const ACCENT = "#00C187";

const ScorerDashboard = () => {
  const { dashboardData, loading, error } = useScorerDashboard();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white">
        <div className="w-16 h-16 border-4 border-[#00C187] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-[#00C187]">Connection Interrupted</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 border border-[#00C187]/50 text-[#00C187] font-bold uppercase rounded-xl hover:bg-[#00C187]/10 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    matchesScored = 0,
    upcomingMatches = 0,
    officialRating = 0,
    earnings = 0,
    matchEngagement = [],
    upcomingAssignments = [],
    scorer
  } = dashboardData;

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="h-full custom-scrollbar bg-[#000000] font-inter">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 lg:space-y-10 animate-fade-in pt-0 pb-24 h-full relative max-w-[1600px] mx-auto">
        <div className="space-y-8 lg:space-y-10 relative z-10">

          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
            <div className="space-y-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight font-inter">
                Scorer <span className="text-[#00C187]">Dashboard</span>
              </h1>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider font-inter">
                {getTimeGreeting()}, {user?.name || "Scorer"} • Tracking Every Moment
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-6 py-4 rounded-2xl backdrop-blur-xl">
              <div className="w-12 h-12 bg-[#00C187]/10 rounded-xl flex items-center justify-center text-[#00C187]">
                <Calendar size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-lg font-bold leading-none font-inter">
                  {currentTime.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <p className="text-[#00C187] text-[10px] font-semibold uppercase tracking-widest opacity-80 font-inter">
                  {currentTime.toLocaleDateString("en-US", { weekday: "long" })} •{" "}
                  {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Scorer Profile Section */}
          <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 group hover:border-[#00C187]/30 transition-all duration-500 shadow-[var(--shadow-2)]">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[8px] overflow-hidden border border-[#2D2D2D] group-hover:border-[#00C187]/50 transition-all shadow-sm">
                <img 
                  src={user?.profilePicture || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=300&h=300&fit=crop"} 
                  alt="Scorer" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#00C187]/10 rounded-[6px] border border-[#00C187]/20 flex items-center justify-center text-[#00C187] shadow-sm">
                <Activity size={20} />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-inter">
                  {user?.name}
                </h2>
                <span className="px-3 py-1 bg-[#00C187]/10 text-[#00C187] text-xs font-semibold uppercase tracking-wider rounded-[6px] self-center md:self-start border border-[#00C187]/20 font-inter">
                  Certified Scorer
                </span>
              </div>
              
              <p className="text-[#999999] text-[13px] font-medium max-w-2xl font-inter">
                Official Digital Match Official • Real-time Data Analytics Specialist
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                <span className="px-3 py-1 bg-[#2D2D2D] text-[#999999] text-[10px] font-medium uppercase tracking-wider rounded-[4px] border border-[#404040] font-inter">
                  Cricket
                </span>
                <span className="px-3 py-1 bg-[#2D2D2D] text-[#999999] text-[10px] font-medium uppercase tracking-wider rounded-[4px] border border-[#404040] font-inter">
                  Ball-by-Ball
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8 pl-8 border-l border-[#2D2D2D]">
              <div className="text-center font-inter">
                <p className="text-xs font-medium text-[#878C9F] uppercase tracking-wider mb-1">Official Rating</p>
                <div className="flex items-center gap-1 text-white font-bold text-2xl tracking-tight">
                  {officialRating || "0.0"} <span className="text-[#00C187] text-xl">★</span>
                </div>
              </div>
              <div className="text-center font-inter">
                <p className="text-xs font-medium text-[#878C9F] uppercase tracking-wider mb-1">Matches</p>
                <p className="text-white font-bold text-2xl tracking-tight">{matchesScored}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <StatsCard title="Matches Scored" value={matchesScored} icon={Trophy} />
            <StatsCard title="Upcoming Matches" value={upcomingMatches} icon={Calendar} />
            <StatsCard title="Official Rating" value={officialRating} icon={Star} suffix="/5" />
            <StatsCard title="Total Earnings" value={earnings} prefix="₹ " icon={DollarSign} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Scoring Engagement Chart */}
            <div className="lg:col-span-8">
              <ChartCard
                title="Scoring Engagement"
                subtitle="Monthly Assignment Analytics"
                action={
                  <div className="p-2 bg-[#2D2D2D] rounded-[6px] border border-[#404040]">
                    <TrendingUp className="text-[#00C187]" size={16} />
                  </div>
                }
              >
                {matchEngagement.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={matchEngagement} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScorerEng" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00C187" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#00C187" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        stroke="#999999"
                        fontSize={10}
                        fontFamily="Inter"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        stroke="#999999"
                        fontSize={10}
                        fontFamily="Inter"
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#151617", border: "1px solid #2D2D2D", borderRadius: "8px", padding: "12px" }}
                        itemStyle={{ color: "#00C187", fontSize: "12px", textTransform: "uppercase", fontFamily: "Inter" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="matches"
                        stroke="#00C187"
                        strokeWidth={2}
                        fill="url(#colorScorerEng)"
                        fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState height={300} icon={BarChart2} message="No engagement data yet" sub="Analytics will appear as you score matches" />
                )}
              </ChartCard>
            </div>

            {/* Upcoming Assignments */}
            <div className="lg:col-span-4">
              <div className="bg-[#000000] p-6 lg:p-8 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] h-full flex flex-col group transition-all hover:border-[#00C187]/20">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight font-inter">
                      Upcoming Matches
                    </h2>
                    <p className="text-xs font-medium text-[#999999] uppercase tracking-wider mt-1 font-inter">
                      Assigned Schedule
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {upcomingAssignments.length > 0 ? (
                    upcomingAssignments.map((match, i) => (
                      <div
                        key={i}
                        className="p-4 bg-[#2D2D2D]/30 border-l-2 border-[#00C187] hover:bg-[#2D2D2D]/60 transition-all rounded-r-[6px]"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[11px] font-semibold text-[#878C9F] uppercase tracking-wider font-inter">
                            {match.time}
                          </span>
                          <span className="px-2 py-0.5 bg-[#00C187]/10 text-[#00C187] text-[9px] font-bold uppercase tracking-widest rounded-[4px] border border-[#00C187]/20 font-inter">
                            {match.gameType}
                          </span>
                        </div>
                        <h4 className="text-[14px] font-semibold text-white mb-1 uppercase tracking-tight leading-tight pr-2 font-inter">
                          {match.match}
                        </h4>
                        <p className="text-[11px] font-medium text-[#999999] uppercase tracking-wider flex items-center gap-1.5 font-inter">
                          <MapPin size={12} /> {match.venue}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState height={200} icon={Calendar} message="No upcoming matches" sub="Check the schedule for new assignments" />
                  )}
                </div>
                <button 
                  onClick={() => navigate("/scorer/matches")}
                  className="mt-6 w-full py-3 bg-transparent border border-[#2D2D2D] hover:bg-[#00C187]/10 hover:text-[#00C187] hover:border-[#00C187]/30 text-[#999999] text-[13px] font-normal uppercase tracking-widest rounded-[6px] transition-all font-inter"
                >
                  View Full Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Empty State Helper ──
const EmptyState = ({ height, icon: Icon, message, sub }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 text-center rounded-[8px] border border-dashed border-[#2D2D2D] font-inter"
    style={{ height }}
  >
    <Icon size={32} className="text-[#2D2D2D]" />
    <p className="text-[13px] font-semibold text-[#555] uppercase tracking-wider">{message}</p>
    {sub && <p className="text-[11px] text-[#444]">{sub}</p>}
  </div>
);

// ── Stats Card ──
const StatsCard = ({ title, value, prefix = "", suffix = "", icon: Icon }) => {
  return (
    <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden group hover:border-[#00C187]/30 transition-all duration-500 min-h-[140px] shadow-[var(--shadow-2)] font-inter">
      <Icon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
      <div className="flex items-center justify-between mb-5">
        <div className="w-10 h-10 bg-[#00C187]/10 rounded-[6px] text-[#00C187] flex items-center justify-center transition-all shadow-sm">
          <Icon size={20} />
        </div>
      </div>
      <div className="space-y-2 relative z-10">
        <h3 className="text-xs font-medium text-[#878C9F] uppercase tracking-wider">{title}</h3>
        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1">
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
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C187]/5 blur-[60px] group-hover:bg-[#00C187]/10 transition-colors"></div>
    <div className="flex flex-col gap-2 mb-6 relative z-10 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-none mb-2 font-inter">{title}</h2>
          <p className="text-xs text-[#999999] tracking-normal font-inter">{subtitle}</p>
        </div>
        {action && <div className="z-20 self-start sm:self-auto">{action}</div>}
      </div>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

export default ScorerDashboard;
