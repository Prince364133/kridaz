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
  ArrowUpRight
} from "lucide-react";
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
        <p className="font-display font-black italic text-xl uppercase tracking-wider text-red-500">Telemetry Link Severed</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 border border-red-500/50 text-red-500 font-display font-black italic uppercase notched-corner hover:bg-red-500/10 transition-all"
        >
          Retry Link
        </button>
      </div>
    );
  }

  const {
    totalBookings,
    totalReviews,
    totalRevenue,
    totalTurfs,
    bookingsPerTurf,
    revenueOverTime,
  } = dashboardData;

  const revenueChartData = revenueOverTime.map((item) => ({
    date: new Date(item._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    revenue: item.revenue,
  }));

  return (
    <div className="p-6 lg:p-10 bg-[#000] min-h-screen text-white relative overflow-hidden">
      {/* Background HUD Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(#84CC16 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
      
      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Header Hero Section */}
        <div className="relative pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 notched-corner border border-primary/20 bg-primary/5 text-[10px] font-mono text-primary uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#84CC16]" />
              Sector Command: Active
            </div>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-end">
            <div className="space-y-6">
              <h1 className="text-7xl md:text-9xl font-display-heavy leading-[0.8] tracking-tighter italic">
                ARENA<br />
                <span className="text-primary">INTELLIGENCE</span>
              </h1>
              <p className="text-gray-500 font-mono text-sm tracking-tight border-l-2 border-primary/30 pl-6 py-2 max-w-md">
                Live operational telemetry and yield diagnostics for your sports empire. Monitor performance, scale sectors, and command your arena network.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-end">
              <div className="px-6 py-4 notched-corner bg-surface/50 border border-white/5 backdrop-blur-md">
                <p className="telemetry-label text-gray-500 mb-1">System Load</p>
                <div className="flex items-center gap-3">
                   <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-[78%]" />
                   </div>
                   <span className="font-mono text-xs text-primary">78%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - High Impact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="TOTAL MISSIONS" 
            value={totalBookings} 
            icon={Calendar} 
            className="bg-surface/30 border-white/5"
          />
          <StatCard 
            title="PLAYER INTEL" 
            value={totalReviews} 
            icon={Star} 
            className="bg-surface/30 border-white/5"
          />
          <StatCard
            title="TOTAL YIELD"
            value={totalRevenue}
            icon={TrendingUp}
            prefix="₹"
            className="bg-primary/5 border-primary/20 text-primary shadow-[0_0_50px_rgba(132,204,22,0.05)]"
          />
          <StatCard 
            title="ACTIVE SECTORS" 
            value={totalTurfs} 
            icon={Building} 
            className="bg-surface/30 border-white/5"
          />
        </div>

        {/* Charts Section - HUD Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="MISSION DISTRIBUTION" subtitle="Bookings per Arena">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={bookingsPerTurf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="monospace"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '0px' }}
                  itemStyle={{ color: '#84CC16', fontFamily: 'monospace', textTransform: 'uppercase' }}
                  cursor={{ fill: 'rgba(132,204,22,0.05)' }}
                />
                <Bar dataKey="bookings" fill="#84CC16" radius={[0, 0, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="REVENUE TRAJECTORY" subtitle="Yield Over Time">
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
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="monospace"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '0px' }}
                  itemStyle={{ color: '#84CC16', fontFamily: 'monospace', textTransform: 'uppercase' }}
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

        {/* Action Bento Grid - Premium Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-surface/30 p-10 notched-corner border border-white/5 flex flex-col justify-between group hover:border-primary/50 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <div className="text-[10px] font-mono text-primary uppercase tracking-[0.4em] mb-4">Strategic Growth</div>
              <h3 className="text-4xl md:text-5xl font-display-heavy italic mb-4 leading-none">EXPANSION PROTOCOL</h3>
              <p className="text-gray-500 text-sm max-w-md leading-relaxed">Scale your operation by deploying new arenas into the BMS network. Access advanced player traffic and automated revenue streams.</p>
            </div>
            <button className="mt-12 self-start flex items-center gap-3 font-display-heavy text-xl text-primary uppercase group-hover:gap-6 transition-all">
              Initiate Deployment <ArrowUpRight size={24} />
            </button>
          </div>
          
          <div className="bg-primary p-10 notched-corner flex flex-col justify-between group cursor-pointer hover:brightness-110 transition-all relative overflow-hidden shadow-[0_0_40px_rgba(132,204,22,0.1)]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px]" />
             <div className="w-14 h-14 bg-black flex items-center justify-center notched-corner mb-12 shadow-xl group-hover:-rotate-6 transition-transform">
                <Users className="text-primary" size={28} />
             </div>
             <div>
               <h3 className="text-4xl font-display-heavy text-black uppercase leading-[0.8] mb-3">PLAYER<br />FEEDBACK</h3>
               <p className="text-black/50 text-[10px] font-mono uppercase tracking-[0.3em]">Incoming Intel Analysis</p>
             </div>
             <ChevronRight className="self-end text-black group-hover:translate-x-3 transition-transform" size={32} />
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="pt-16 border-t border-white/5 flex flex-wrap gap-8 justify-between items-center pb-8">
          <div className="flex items-center gap-4">
             <span className="telemetry-label text-gray-700">OS_CORE: v2.4.8_STABLE</span>
             <div className="h-4 w-[1px] bg-white/5" />
             <span className="telemetry-label text-gray-700">LATENCY: 12ms</span>
          </div>
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-primary/20 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-[#111] p-8 notched-corner border border-white/5 shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] group-hover:bg-primary/10 transition-colors"></div>
    <div className="mb-8">
      <h2 className="text-2xl font-display italic font-black text-white uppercase tracking-tight leading-none mb-2">{title}</h2>
      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">{subtitle}</p>
    </div>
    {children}
  </div>
);

export default OwnerDashboard;
