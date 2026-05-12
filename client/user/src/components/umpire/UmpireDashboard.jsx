import React from "react";
import {
 Trophy,
 Calendar,
 Star,
 DollarSign,
 Zap,
 MapPin,
 BarChart as BarChartIcon,
 CheckCircle2,
} from "lucide-react";
import StatCard from "../admin/Dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import useUmpireDashboard from "@hooks/owner/useUmpireDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";
import { useNavigate } from "react-router-dom";

export default function UmpireDashboard() {
 const { dashboardData, loading, error } = useUmpireDashboard();
 const navigate = useNavigate();

 if (loading) return <DashboardSkeleton />;
 if (error) {
 return (
 <div className="flex flex-col justify-center items-center min-h-[60vh] text-white text-center">
 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
 <p className="font-bold text-xl uppercase tracking-wider text-primary">System Offline</p>
 <button
 onClick={() => window.location.reload()}
 className="mt-6 px-8 py-3 border border-primary/50 text-primary font-bold uppercase rounded-xl hover:bg-primary/10 transition-all"
 >
 Retry Link
 </button>
 </div>
 );
 }

 const {
 matchesOfficiated = 0,
 upcomingMatches = 0,
 officialRating = 0,
 earnings = 0,
 matchEngagement = [],
 upcomingAssignments = [],
 } = dashboardData;

 return (
 <div className="h-full custom-scrollbar">
 <div className="p-4 md:p-10 space-y-6 md:space-y-12 animate-fade-in pt-2 pb-24 md:pb-12 max-w-[1600px] mx-auto">

 {/* Primary Stats — all real data, 0 when empty */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
 <StatCard title="Matches Officiated" value={matchesOfficiated} icon={Trophy} />
 <StatCard title="Upcoming Matches" value={upcomingMatches} icon={Calendar} />
 <StatCard title="Official Rating" value={officialRating} icon={Star} />
 <StatCard title="Earnings" value={earnings} icon={DollarSign} prefix="₹" />
 </div>

 {/* Scoring Center */}
 <div className="p-8 md:p-10 bg-gradient-to-br from-[#111] to-[#050505] rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
 <Zap size={120} className="text-primary" />
 </div>
 <div className="relative z-10">
 <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-2">
 Scoring Center
 </h2>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">
 Official Match Scoring Applications
 </p>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {/* Cricket Scoring — navigates to matches list */}
 <div
 className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-primary/30 transition-all group/app cursor-pointer"
 onClick={() => navigate("/umpire/matches")}
 >
 <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 group-hover/app:bg-primary group-hover/app:text-black transition-all text-primary">
 <Zap size={24} />
 </div>
 <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
 Cricket Scoring
 </h3>
 <p className="text-xs text-gray-500 leading-relaxed mb-4">
 Official ball-by-ball scoring engine with real-time sync and player analytics.
 </p>
 <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
 Launch App <CheckCircle2 size={12} />
 </div>
 </div>

 {/* Placeholder for future sports */}
 <div className="p-6 bg-white/[0.01] rounded-3xl border border-white/5 opacity-40 cursor-not-allowed">
 <div className="w-12 h-12 bg-gray-500/10 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
 <Star size={24} className="text-gray-500" />
 </div>
 <h3 className="text-lg font-black uppercase tracking-tight text-gray-500 mb-2">
 Football Scoring
 </h3>
 <p className="text-xs text-gray-600 leading-relaxed">Coming Soon</p>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
 {/* Match Volume Chart */}
 <div className="lg:col-span-2 p-6 md:p-10 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 relative transition-all hover:border-[#84CC16]/20 group">
 <div className="flex justify-between items-center mb-8 md:mb-12">
 <div>
 <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
 Match Engagement
 </h2>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
 Monthly Assignment Analytics
 </p>
 </div>
 <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-[#84CC16]/30 transition-colors">
 <BarChartIcon size={20} className="text-[#84CC16]" />
 </div>
 </div>

 <div className="h-[300px] md:h-[400px] w-full flex items-center justify-center border border-white/5 border-dashed rounded-[2rem] overflow-hidden">
 {matchEngagement.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={matchEngagement} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
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
 cursor={{ fill: "#ffffff05" }}
 contentStyle={{
 backgroundColor: "#000",
 border: "1px solid rgba(132,204,22,0.2)",
 borderRadius: "16px",
 boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
 }}
 itemStyle={{ color: "#84CC16", fontWeight: "bold" }}
 />
 <Bar dataKey="matches" fill="#84CC16" radius={[6, 6, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <div className="text-center space-y-3 opacity-30">
 <BarChartIcon size={32} className="mx-auto" />
 <span className="text-[10px] font-black uppercase tracking-[0.3em]">
 No match data yet
 </span>
 </div>
 )}
 </div>
 </div>

 {/* Upcoming Assignments */}
 <div className="p-8 md:p-10 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 flex flex-col transition-all hover:border-[#84CC16]/20 group">
 <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-8">
 Upcoming Assignments
 </h2>
 <div className="flex-1 space-y-5 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
 {upcomingAssignments.length > 0 ? (
 upcomingAssignments.map((match, i) => (
 <div
 key={i}
 className="p-5 md:p-6 bg-white/[0.02] rounded-[1.5rem] border border-white/5 group/item hover:bg-white/[0.05] transition-all relative"
 >
 <div className="absolute top-6 right-6">
 <Zap
 size={14}
 className="text-[#84CC16] opacity-30 group-hover/item:opacity-100 transition-opacity"
 />
 </div>
 <h4 className="text-base font-bold text-white mb-3 uppercase tracking-tight leading-tight pr-6">
 {match.match}
 </h4>
 <div className="space-y-2">
 <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
 <Calendar size={12} className="text-[#84CC16]" /> {match.time}
 </div>
 <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
 <MapPin size={12} className="text-[#84CC16]" /> {match.venue}
 </div>
 <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
 <span className="text-[9px] font-black text-[#84CC16] uppercase tracking-[0.2em]">
 Role: {match.role}
 </span>
 <div className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20 py-20">
 <Zap size={48} className="text-gray-600" />
 <span className="text-[10px] font-black uppercase tracking-[0.3em]">
 No upcoming assignments
 </span>
 </div>
 )}
 </div>
 <button className="mt-10 w-full h-14 border border-white/10 hover:border-[#84CC16]/50 hover:bg-[#84CC16]/5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all text-gray-400 hover:text-white">
 Review Protocols
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
