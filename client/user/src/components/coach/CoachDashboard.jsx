import React from "react";
import { Users, Calendar, TrendingUp, Zap, Layout } from "lucide-react";
import StatCard from "../admin/Dashboard/StatCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function CoachDashboard() {
  const { dashboardData, loading, error } = useCoachDashboard();

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-primary">
          Intelligence Unavailable
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 border border-primary/50 text-primary font-bold uppercase rounded-xl hover:bg-primary/10 transition-all"
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
  } = dashboardData;

  return (
    <div className="h-full custom-scrollbar">
      <div className="p-4 md:p-10 space-y-6 md:space-y-12 animate-fade-in pt-2 pb-24 md:pb-12 max-w-[1600px] mx-auto">

        {/* Stats Grid — all real data */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Active Trainees" value={activeTrainees} icon={Users} />
          <StatCard title="Total Sessions" value={totalSessions} icon={Calendar} />
          <StatCard title="Performance Index" value={performanceIndex} icon={TrendingUp} />
          <StatCard title="Total Earnings" value={totalRevenue} icon={Zap} prefix="₹" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Student Progress Chart */}
          <div className="lg:col-span-2 p-6 md:p-10 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 relative group transition-all hover:border-[#84CC16]/20">
            <div className="flex justify-between items-center mb-8 md:mb-12">
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                  Student Progress
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                  Aggregate Achievement Metrics
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-[#84CC16]/30 transition-colors">
                <TrendingUp className="text-[#84CC16]" size={20} />
              </div>
            </div>

            <div className="h-[300px] md:h-[400px] w-full flex items-center justify-center border border-white/5 border-dashed rounded-[2rem] overflow-hidden">
              {studentProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studentProgress} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="coachColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#84CC16" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#84CC16" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#4b5563", fontSize: 10, fontWeight: "bold" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#4b5563", fontSize: 10, fontWeight: "bold" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#000",
                        border: "1px solid rgba(132,204,22,0.2)",
                        borderRadius: "16px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                      }}
                      itemStyle={{
                        color: "#84CC16",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        fontSize: "10px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#84CC16"
                      strokeWidth={4}
                      fill="url(#coachColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center space-y-3 opacity-30">
                  <Layout size={32} className="mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                    No progress data yet
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Progress will appear as students complete sessions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Sessions Roster */}
          <div className="p-8 md:p-10 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 flex flex-col group hover:border-[#84CC16]/20 transition-all">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-8">
              Upcoming Sessions
            </h2>
            <div className="flex-1 space-y-5 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((op, i) => (
                  <div
                    key={i}
                    className="p-5 bg-white/[0.02] border-l-4 border-[#84CC16] group/item hover:bg-white/[0.05] transition-all rounded-r-[1.5rem]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        {op.time}
                      </span>
                      <span className="px-2 py-1 bg-[#84CC16]/10 text-[#84CC16] text-[8px] font-black uppercase tracking-widest rounded-md">
                        {op.type}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mb-1 uppercase tracking-tight">
                      {op.name}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Users size={10} /> {op.student}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20 py-20">
                  <Calendar size={48} className="text-gray-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">
                    No upcoming <br /> sessions
                  </span>
                </div>
              )}
            </div>
            <button className="mt-10 w-full h-14 bg-[#84CC16] text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-[0.98] active:scale-95 transition-all shadow-xl shadow-[#84CC16]/10">
              New Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
