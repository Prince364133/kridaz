import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  Zap,
  BarChart2
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
import CountUp from "react-countup";
import { useSelector } from "react-redux";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "@features/venue-owner/Dashboard/DashboardSkeleton";

const CoachDashboard = () => {
  const { dashboardData, loading, error } = useCoachDashboard();
  const user = useSelector((state) => state.auth.user);
  
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
    activeTrainees = 0,
    totalSessions = 0,
    performanceIndex = 0,
    studentProgress = [],
    upcomingSessions = [],
    totalRevenue = 0,
    coach
  } = dashboardData;

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="h-full custom-scrollbar bg-[#000000] font-open-sans">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 lg:space-y-10 animate-fade-in pt-0 pb-24 h-full relative">
        <div className="space-y-8 lg:space-y-10 relative z-10">

          {/* Dashboard Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 pb-2 border-b border-white/5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-[#55DEE8] rounded-full" />
                <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] text-white tracking-tight leading-none uppercase">
                  Coach <span className="text-[#55DEE8]">Dashboard</span>
                </h1>
              </div>
              <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-4">
                {getTimeGreeting()}, {user?.name || "Coach"} | Training Intelligence Feed
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-6 py-4 rounded-[8px] backdrop-blur-xl">
              <div className="w-12 h-12 bg-[#55DEE8]/10 rounded-[8px] flex items-center justify-center text-[#55DEE8]">
                <Calendar size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-lg font-bold leading-none font-inter">
                  {currentTime.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <p className="text-[#55DEE8] text-[10px] font-semibold uppercase tracking-widest opacity-80">
                  {currentTime.toLocaleDateString("en-US", { weekday: "long" })} Rs �{" "}
                  {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </p>
              </div>
            </div>
          </header>

          {/* Coach Profile Section (styled similarly to Venue design cards) */}
          {coach && (
            <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 group hover:border-[#55DEE8]/30 transition-all duration-500 shadow-[var(--shadow-2)]">
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[8px] overflow-hidden border border-[#2D2D2D] group-hover:border-[#55DEE8]/50 transition-all shadow-sm">
                  <img 
                    src={coach.profilePicture || "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=300&h=300&fit=crop"} 
                    alt="Coach" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#55DEE8]/10 rounded-[6px] border border-[#55DEE8]/20 flex items-center justify-center text-[#55DEE8] shadow-sm">
                  <Zap size={20} />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-inter">
                    {coach.name}
                  </h2>
                  <span className="px-3 py-1 bg-[#55DEE8]/10 text-[#55DEE8] text-xs font-semibold uppercase tracking-wider rounded-[6px] self-center md:self-start border border-[#55DEE8]/20 font-inter">
                    Pro Coach
                  </span>
                </div>
                
                <p className="text-[#999999] text-[13px] font-medium max-w-2xl">
                  {coach.businessDetails?.specialization || "Expert Sports Consultant"} Rs � {coach.businessDetails?.experience || "N/A"} Experience
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                  {coach.interests?.map((interest, i) => (
                    <span key={i} className="px-3 py-1 bg-[#2D2D2D] text-[#999999] text-[10px] font-medium uppercase tracking-wider rounded-[4px] border border-[#404040]">
                      {interest}
                    </span>
                  )) || (
                    <span className="px-3 py-1 bg-[#2D2D2D] text-[#999999] text-[10px] font-medium uppercase tracking-wider rounded-[4px] border border-[#404040]">
                      Cricket
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-8 pl-8 border-l border-[#2D2D2D]">
                <div className="text-center">
                  <p className="text-xs font-medium text-[#878C9F] uppercase tracking-wider mb-1 font-inter">Rating</p>
                  <div className="flex items-center gap-1 text-white font-bold text-2xl tracking-tight font-inter">
                    {coach.rating || "4.9"} <span className="text-[#55DEE8] text-xl">Rs �</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-[#878C9F] uppercase tracking-wider mb-1 font-inter">Reviews</p>
                  <p className="text-white font-bold text-2xl tracking-tight font-inter">{coach.numReviews || "120"}+</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <StatsCard title="Active Trainees" value={activeTrainees} icon={Users} />
            <StatsCard title="Total Sessions" value={totalSessions} icon={Calendar} />
            <StatsCard title="Performance Index" value={performanceIndex} icon={TrendingUp} />
            <StatsCard title="Total Earnings" value={totalRevenue} prefix="Rs " icon={Zap} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Student Progress Chart */}
            <div className="lg:col-span-8">
              <ChartCard
                title="Student Progress"
                subtitle="Aggregate Achievement Metrics"
                action={
                  <div className="p-2 bg-[#2D2D2D] rounded-[6px] border border-[#404040]">
                    <TrendingUp className="text-[#55DEE8]" size={16} />
                  </div>
                }
              >
                {studentProgress.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={studentProgress} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPerfCoach" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#55DEE8" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#55DEE8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        stroke="#999999"
                        fontSize={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        stroke="#999999"
                        fontSize={10}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#151617", border: "1px solid #2D2D2D", borderRadius: "8px", padding: "12px" }}
                        itemStyle={{ color: "#55DEE8", fontSize: "12px", textTransform: "uppercase", fontFamily: "Inter" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#55DEE8"
                        strokeWidth={2}
                        fill="url(#colorPerfCoach)"
                        fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState height={300} icon={BarChart2} message="No progress data yet" sub="Progress will appear as students complete sessions" />
                )}
              </ChartCard>
            </div>

            {/* Upcoming Sessions Roster */}
            <div className="lg:col-span-4">
              <div className="bg-[#000000] p-6 lg:p-8 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] h-full flex flex-col group transition-all hover:border-[#55DEE8]/20">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight font-inter">
                      Upcoming Sessions
                    </h2>
                    <p className="text-xs font-medium text-[#999999] uppercase tracking-wider mt-1 font-inter">
                      Your schedule
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map((op, i) => (
                      <div
                        key={i}
                        className="p-4 bg-[#2D2D2D]/30 border-l-2 border-[#55DEE8] hover:bg-[#2D2D2D]/60 transition-all rounded-r-[6px]"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[11px] font-semibold text-[#878C9F] uppercase tracking-wider">
                            {op.time}
                          </span>
                          <span className="px-2 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] text-[9px] font-bold uppercase tracking-widest rounded-[4px]">
                            {op.type}
                          </span>
                        </div>
                        <h4 className="text-[14px] font-semibold text-white mb-1 uppercase tracking-tight">
                          {op.name}
                        </h4>
                        <p className="text-[11px] font-medium text-[#999999] uppercase tracking-wider flex items-center gap-1.5">
                          <Users size={12} /> {op.student}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState height={200} icon={Calendar} message="No upcoming sessions" sub="Schedule a session to see it here" />
                  )}
                </div>
                <button className="mt-6 w-full py-3 bg-transparent border border-[#2D2D2D] hover:bg-[#55DEE8]/10 hover:text-[#55DEE8] hover:border-[#55DEE8]/30 text-[#999999] text-[13px] font-normal uppercase tracking-widest rounded-[6px] transition-all font-inter">
                  New Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rs �Rs � Empty State Helper Rs �Rs �
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

// Rs �Rs � Stats Card Rs �Rs �
const StatsCard = ({ title, value, prefix = "", suffix = "", icon: Icon }) => {
  return (
    <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden group hover:border-[#55DEE8]/30 transition-all duration-500 min-h-[140px] shadow-[var(--shadow-2)]">
      <Icon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
      <div className="flex items-center justify-between mb-5">
        <div className="w-10 h-10 bg-[#55DEE8]/10 rounded-[6px] text-[#55DEE8] flex items-center justify-center transition-all shadow-sm">
          <Icon size={20} />
        </div>
      </div>
      <div className="space-y-2 relative z-10">
        <h3 className="text-xs font-medium text-[#878C9F] uppercase tracking-wider font-inter">{title}</h3>
        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1 font-inter">
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
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#55DEE8]/5 blur-[60px] group-hover:bg-[#55DEE8]/10 transition-colors"></div>
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

export default CoachDashboard;
