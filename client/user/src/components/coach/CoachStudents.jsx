import React from "react";
import { Users, Mail, Phone, ExternalLink, ShieldCheck } from "lucide-react";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function CoachStudents() {
 const { dashboardData, loading } = useCoachDashboard();

 if (loading) return <DashboardSkeleton />;

 const trainees = dashboardData?.trainees || [];

 return (
 <div className="space-y-8 animate-fade-in">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
 <div className="space-y-1">
 <h1 className="text-5xl font-black uppercase tracking-tight text-white">
 Student <span className="text-primary">Roster</span>
 </h1>
 <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Manage your athletes and trainees</p>
 </div>
 </div>

 {trainees.length === 0 ? (
 <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#0A0A0A] rounded-[32px] border border-white/5 border-dashed p-12 text-center">
 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
 <Users size={32} className="text-white/20" />
 </div>
 <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Roster Empty</h3>
 <p className="text-gray-500 text-sm max-w-xs mx-auto">You haven't added any students yet. Once athletes subscribe to your coaching, they will appear here.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {trainees.map((student) => (
 <div key={student._id} className="group relative bg-[#0D0D0D] border border-white/5 rounded-[24px] p-6 hover:border-primary/30 transition-all duration-500">
 <div className="flex items-center gap-4 mb-6">
 <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
 {student.avatar ? (
 <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
 ) : (
 <span className="text-2xl font-black text-primary">{student.name.charAt(0)}</span>
 )}
 </div>
 <div>
 <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{student.name}</h3>
 <div className="flex items-center gap-1 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
 <ShieldCheck size={12} className="text-primary" />
 Verified Athlete
 </div>
 </div>
 </div>

 <div className="space-y-3 mb-6">
 <div className="flex items-center gap-3 text-sm text-gray-400">
 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
 <Mail size={14} className="text-primary" />
 </div>
 {student.email}
 </div>
 <div className="flex items-center gap-3 text-sm text-gray-400">
 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
 <Phone size={14} className="text-primary" />
 </div>
 {student.phone}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <button className="py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
 View Profile
 </button>
 <button className="py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10">
 Message
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
