import React from "react";
import { Video, PlayCircle, Plus, Layout } from "lucide-react";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function CoachMasterclass() {
 const { loading } = useCoachDashboard();

 if (loading) return <DashboardSkeleton />;

 return (
 <div className="space-y-8 animate-fade-in">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
 <div className="space-y-1">
 <h1 className="text-5xl font-black uppercase tracking-tight text-white">
 Digital <span className="text-primary">Masterclass</span>
 </h1>
 <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Virtual training and recorded content</p>
 </div>
 
 <button className="px-6 py-3 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-[0.98] transition-all">
 <Plus size={16} />
 <span>New Upload</span>
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {/* Placeholder for content - Keeping it aesthetic since we don't have video model yet */}
 {[1, 2, 3].map((i) => (
 <div key={i} className="group relative bg-[#0D0D0D] border border-white/5 rounded-[32px] overflow-hidden hover:border-primary/30 transition-all duration-500">
 <div className="aspect-video bg-white/5 flex items-center justify-center relative">
 <div className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
 <PlayCircle size={32} className="text-white/40 group-hover:text-primary transition-colors" />
 </div>
 <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tutorial #{i}</span>
 </div>
 </div>
 <div className="p-6 space-y-4">
 <div className="space-y-2">
 <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">Advanced Batting Techniques</h3>
 <p className="text-gray-500 text-xs line-clamp-2">Master the art of professional batting with this comprehensive drill sequence.</p>
 </div>
 <div className="flex justify-between items-center pt-4 border-t border-white/5">
 <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
 <Layout size={12} />
 <span>425 Views</span>
 </div>
 <span className="text-[10px] font-black text-primary">DRAFT</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
