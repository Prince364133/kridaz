import React from "react";
import { Users, Calendar, Video, TrendingUp, Zap, Award, Target, Layout } from "lucide-react";
import StatCard from "../admin/Dashboard/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function CoachDashboard() {
  const { dashboardData, loading, error } = useCoachDashboard();

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-primary">Intelligence Unavailable</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 border border-primary/50 text-primary font-bold uppercase rounded-xl hover:bg-primary/10 transition-all">Try Again</button>
      </div>
    );
  }

  const {
    activeTrainees,
    totalSessions,
    liveStreamMins,
    performanceIndex,
    studentProgress,
    upcomingSessions
  } = dashboardData;

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-fade-in pt-4 pb-24 md:pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
            <Target size={14} className="animate-pulse" />
            <span>Coach Status: Active</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            Training <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Professional Performance Management</p>
        </div>
        
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-black rounded-xl border border-white/5 flex items-center gap-2">
            <Award size={16} className="text-primary" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified Instructor</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Active Trainees" value={activeTrainees} icon={Users} />
        <StatCard title="Total Sessions" value={totalSessions} icon={Calendar} />
        <StatCard title="Live Stream Mins" value={liveStreamMins} icon={Video} />
        <StatCard title="Performance Index" value={performanceIndex} icon={TrendingUp} prefix="+" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Graph */}
        <div className="lg:col-span-2 p-4 md:p-8 bg-[#0A0A0A] rounded-2xl border border-white/5 relative group">
          <div className="flex justify-between items-center mb-6 md:mb-10">
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">Student Progress</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Aggregate Achievement Metrics</p>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
               <TrendingUp className="text-primary" size={16} />
            </div>
          </div>
          
          <div className="h-[250px] md:h-[300px] w-full flex items-center justify-center border border-white/5 border-dashed rounded-2xl">
            {studentProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentProgress}>
                  <defs>
                    <linearGradient id="coachColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#84CC16" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#84CC16" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#000', border: '1px solid rgba(132,204,22,0.2)', borderRadius: '12px'}}
                    itemStyle={{color: '#84CC16'}}
                  />
                  <Area type="monotone" dataKey="value" stroke="#84CC16" strokeWidth={3} fill="url(#coachColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2">
                <Layout size={24} className="text-white/10 mx-auto" />
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Telemetry Required</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Roster */}
        <div className="p-6 md:p-8 bg-[#0A0A0A] rounded-2xl border border-white/5 flex flex-col">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white mb-6">Upcoming Sessions</h2>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px]">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((op, i) => (
                <div key={i} className="p-4 bg-white/[0.02] border-l-2 border-primary group hover:bg-white/[0.05] transition-all rounded-r-xl">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-gray-400">{op.time}</span>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{op.type}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{op.name}</h4>
                  <p className="text-[10px] font-medium text-gray-500 uppercase">{op.student}</p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-20 py-10">
                 <Calendar size={32} />
                 <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">No pending <br />assignments</span>
              </div>
            )}
          </div>
          <button className="mt-8 w-full py-3 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-[0.98] transition-all shadow-lg shadow-primary/10">
            Schedule Session
          </button>
        </div>
      </div>
    </div>
  );
}
