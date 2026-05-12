import React from "react";
import { Calendar, Plus, Clock, Users, ArrowRight, Video } from "lucide-react";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function CoachSessions() {
 const { dashboardData, loading } = useCoachDashboard();

 if (loading) return <DashboardSkeleton />;

 const sessions = dashboardData?.sessions || [];

 return (
 <div className="space-y-8 animate-fade-in">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
 <div className="space-y-1">
 <h1 className="text-5xl font-black uppercase tracking-tight text-white">
 Training <span className="text-primary">Sessions</span>
 </h1>
 <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Scheduled classes and private training</p>
 </div>
 <button className="px-6 py-3 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-[0.98] transition-all">
 <Plus size={16} /> New Session
 </button>
 </div>

 {sessions.length === 0 ? (
 <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#0A0A0A] rounded-[32px] border border-white/5 border-dashed p-12 text-center">
 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
 <Calendar size={32} className="text-white/20" />
 </div>
 <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">No Sessions Scheduled</h3>
 <p className="text-gray-500 text-sm max-w-xs mx-auto">Your training calendar is currently empty. Click "New Session" to start scheduling.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4">
 {sessions.map((session) => (
 <div key={session._id} className="group relative bg-[#0D0D0D] border border-white/5 rounded-[24px] p-6 hover:border-primary/30 transition-all duration-500">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
 <div className="flex gap-6 flex-1">
 <div className="flex flex-col items-center justify-center w-20 h-20 bg-white/5 rounded-2xl border border-white/10 text-center">
 <span className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">
 {new Date(session.date).toLocaleString('default', { month: 'short' })}
 </span>
 <span className="text-2xl font-black text-white leading-none">
 {new Date(session.date).getDate()}
 </span>
 </div>

 <div className="space-y-3">
 <div className="flex items-center gap-3">
 <div className={`px-3 py-1 rounded-full border ${session.type === 'Private' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
 <span className="text-[10px] font-bold uppercase tracking-widest">{session.type}</span>
 </div>
 <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
 <Clock size={14} className="text-primary" />
 {session.time}
 </div>
 </div>
 
 <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">{session.name}</h3>
 
 <div className="flex flex-wrap gap-6 text-sm text-gray-400">
 <div className="flex items-center gap-2">
 <Users size={16} className="text-primary" />
 {session.students?.length || 0} Registered Students
 </div>
 <div className="flex items-center gap-2">
 <Video size={16} className="text-primary" />
 Interactive Coaching
 </div>
 </div>
 </div>
 </div>

 <div className="w-full md:w-auto flex flex-col items-stretch gap-3">
 <button className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2">
 Manage Session <ArrowRight size={14} />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
