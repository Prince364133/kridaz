import React from "react";
import { Trophy, Calendar, Star, DollarSign, Zap, Shield, MapPin, BarChart as BarChartIcon } from "lucide-react";
import StatCard from "../admin/Dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useUmpireDashboard from "@hooks/owner/useUmpireDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function UmpireDashboard() {
  const { dashboardData, loading, error } = useUmpireDashboard();

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-primary">System Offline</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 border border-primary/50 text-primary font-bold uppercase rounded-xl hover:bg-primary/10 transition-all">Retry Link</button>
      </div>
    );
  }

  const {
    matchesOfficiated,
    upcomingMatches,
    officialRating,
    earnings,
    matchEngagement,
    upcomingAssignments
  } = dashboardData;

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-fade-in pt-4 pb-24 md:pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
            <Shield size={14} className="animate-pulse" />
            <span>Official Status: Ready</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            Match <span className="text-primary">Management</span>
          </h1>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Integrity & Standards Control</p>
        </div>
        
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-black rounded-xl border border-white/5 flex items-center gap-2">
            <Trophy size={16} className="text-primary" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A-Grade Official</span>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Matches Officiated" value={matchesOfficiated} icon={Trophy} />
        <StatCard title="Upcoming Matches" value={upcomingMatches} icon={Calendar} />
        <StatCard title="Official Rating" value={officialRating} icon={Star} />
        <StatCard title="Earnings" value={earnings} icon={DollarSign} prefix="₹" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Volume Chart */}
        <div className="lg:col-span-2 p-4 md:p-8 bg-[#0A0A0A] rounded-2xl border border-white/5 relative">
          <div className="flex justify-between items-center mb-6 md:mb-10">
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">Match Engagement</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Monthly Assignment Analytics</p>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
               <BarChartIcon size={16} className="text-primary" />
            </div>
          </div>
          
          <div className="h-[250px] md:h-[300px] w-full flex items-center justify-center border border-white/5 border-dashed rounded-2xl">
            {matchEngagement.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={matchEngagement}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: '#ffffff05'}}
                    contentStyle={{backgroundColor: '#000', border: '1px solid rgba(132,204,22,0.2)', borderRadius: '12px'}}
                  />
                  <Bar dataKey="matches" fill="#84CC16" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2 opacity-20">
                <BarChartIcon size={24} className="mx-auto" />
                <span className="text-[9px] font-black uppercase tracking-widest">No activity data</span>
              </div>
            )}
          </div>
        </div>

        {/* Immediate Assignments */}
        <div className="p-6 md:p-8 bg-[#0A0A0A] rounded-2xl border border-white/5 flex flex-col">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white mb-6">Upcoming Assignments</h2>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px]">
            {upcomingAssignments.length > 0 ? (
              upcomingAssignments.map((match, i) => (
                <div key={i} className="p-4 md:p-5 bg-white/[0.02] rounded-xl border border-white/5 group hover:bg-white/[0.05] transition-all relative">
                  <div className="absolute top-4 right-4">
                    <Zap size={12} className="text-primary opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-tight leading-tight">{match.match}</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                      <Calendar size={10} /> {match.time}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                      <MapPin size={10} /> {match.venue}
                    </div>
                    <div className="mt-3 text-[9px] font-bold text-primary uppercase tracking-widest">Role: {match.role}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-20 py-10">
                 <Zap size={32} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Clear Roster</span>
              </div>
            )}
          </div>
          <button className="mt-8 w-full py-3 border border-white/10 hover:bg-white/5 rounded-xl font-bold uppercase text-xs tracking-widest transition-all">
            Review Protocols
          </button>
        </div>
      </div>
    </div>
  );
}
