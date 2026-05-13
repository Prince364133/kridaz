import React from "react";
import { Video, PlayCircle, Plus, Layout } from "lucide-react";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function CoachMasterclass() {
  const { loading } = useCoachDashboard();

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 animate-fade-in font-open-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white font-inter">
            Digital <span className="text-[#CCFF00]">Masterclass</span>
          </h1>
          <p className="text-[#999999] text-xs font-semibold uppercase tracking-wider font-inter mt-1">Virtual training and recorded content</p>
        </div>
        
        <button className="px-6 py-2.5 bg-[#CCFF00] text-black rounded-[6px] font-bold uppercase text-[11px] tracking-widest flex items-center gap-2 hover:scale-[0.98] transition-all font-inter shadow-[var(--shadow-2)]">
          <Plus size={16} />
          <span>New Upload</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for content - Keeping it aesthetic since we don't have video model yet */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="group relative bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden hover:border-[#CCFF00]/30 transition-all duration-500 shadow-[var(--shadow-2)]">
             <div className="aspect-video bg-[#2D2D2D]/30 flex items-center justify-center relative">
                <div className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-[#2D2D2D] group-hover:scale-110 transition-transform">
                   <PlayCircle size={32} className="text-[#878C9F] group-hover:text-[#CCFF00] transition-colors" />
                </div>
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-[4px] border border-[#2D2D2D]">
                   <span className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider font-inter">Tutorial #{i}</span>
                </div>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-2">
                   <h3 className="text-lg font-bold text-white group-hover:text-[#CCFF00] transition-colors font-inter tracking-tight">Advanced Batting Techniques</h3>
                   <p className="text-[#999999] text-[13px] line-clamp-2 font-open-sans">Master the art of professional batting with this comprehensive drill sequence.</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-[#2D2D2D]">
                   <div className="flex items-center gap-2 text-[10px] font-medium text-[#878C9F] uppercase tracking-wider font-inter">
                      <Layout size={12} />
                      <span>425 Views</span>
                   </div>
                   <span className="text-[10px] font-bold text-[#CCFF00] font-inter uppercase tracking-wider">DRAFT</span>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
