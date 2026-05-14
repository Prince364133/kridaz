import React from "react";
import { Users, Mail, Phone, ExternalLink, ShieldCheck } from "lucide-react";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function CoachStudents() {
  const { dashboardData, loading } = useCoachDashboard();

  if (loading) return <DashboardSkeleton />;

  const trainees = dashboardData?.trainees || [];

  return (
    <div className="space-y-8 animate-fade-in font-open-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white font-inter">
            Student <span className="text-[#CCFF00]">Roster</span>
          </h1>
          <p className="text-[#999999] text-xs font-semibold uppercase tracking-wider font-inter mt-1">Manage your athletes and trainees</p>
        </div>
      </div>

      {trainees.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#000000] rounded-[8px] border border-dashed border-[#2D2D2D] p-12 text-center shadow-[var(--shadow-2)]">
          <div className="w-20 h-20 bg-[#2D2D2D]/30 rounded-[6px] flex items-center justify-center mb-6">
            <Users size={32} className="text-[#2D2D2D]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider font-inter mb-2">Roster Empty</h3>
          <p className="text-[11px] text-[#444] font-inter max-w-xs mx-auto">You haven't added any students yet. Once athletes subscribe to your coaching, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainees.map((student) => (
            <div key={student._id} className="group relative bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 hover:border-[#CCFF00]/30 transition-all duration-500 shadow-[var(--shadow-2)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[6px] bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center overflow-hidden">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#CCFF00] font-inter">{student.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#CCFF00] transition-colors font-inter tracking-tight">{student.name}</h3>
                  <div className="flex items-center gap-1 text-[#878C9F] text-[10px] uppercase tracking-wider font-medium font-inter">
                    <ShieldCheck size={12} className="text-[#CCFF00]" />
                    Verified Athlete
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-[13px] text-[#878C9F] font-inter">
                  <div className="w-8 h-8 rounded-[6px] bg-[#2D2D2D]/30 flex items-center justify-center border border-[#2D2D2D]">
                    <Mail size={14} className="text-[#CCFF00]" />
                  </div>
                  {student.email}
                </div>
                <div className="flex items-center gap-3 text-[13px] text-[#878C9F] font-inter">
                  <div className="w-8 h-8 rounded-[6px] bg-[#2D2D2D]/30 flex items-center justify-center border border-[#2D2D2D]">
                    <Phone size={14} className="text-[#CCFF00]" />
                  </div>
                  {student.phone}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="py-2.5 bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 text-[#CCFF00] text-[10px] font-bold uppercase tracking-wider rounded-[6px] transition-all font-inter border border-[#CCFF00]/20">
                  View Profile
                </button>
                <button className="py-2.5 bg-transparent hover:bg-white/5 text-[#999999] hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-[6px] transition-all border border-[#2D2D2D] font-inter">
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
