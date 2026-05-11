import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, Phone, MapPin, IndianRupee, Search, ChevronRight, Zap, Briefcase } from "lucide-react";
import useProfessionals from "../../../hooks/admin/useProfessionals";

const ProfessionalManagement = ({ role }) => {
  const { 
    professionals, 
    loading, 
    searchTerm, 
    handleSearch 
  } = useProfessionals(role);

  const navigate = useNavigate();

  const handleCardClick = (id) => {
    navigate(`/admin/professionals/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6 lg:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
      <div className="space-y-12">
        {/* Header Section */}
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="relative">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#CCFF00] rounded-full shadow-[0_0_20px_rgba(204,255,0,0.4)]"></div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              Manage <span className="text-[#CCFF00]">{role === "coach" ? "Coaches" : "Umpires"}</span>
            </h1>
            <p className="admin-subheading mt-4 ml-1">
              Active Professional Roster • System Telemetry
            </p>
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#CCFF00] transition-colors w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${role}s by name or email...`}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-[12px] pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/50 hover:border-white/20 transition-all font-inter shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus:shadow-[0_0_20px_rgba(204,255,0,0.1)]"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CCFF00]"></div>
          </div>
        ) : (
          /* Professional List Table */
          <div className="space-y-6">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-[#0d0d0d] border border-[#2D2D2D] rounded-[12px] text-[10px] font-black text-[#878C9F] uppercase tracking-[0.2em] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              <div className="col-span-4">{role} Profile</div>
              <div className="col-span-3">Contact Email</div>
              <div className="col-span-2">Contact Number</div>
              <div className="col-span-2 text-center">Expertise / XP</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {professionals.length === 0 ? (
              <div className="relative p-20 rounded-[16px] border border-[#2D2D2D] bg-[#000000] text-center overflow-hidden">
                <div className="absolute inset-0 bg-[#CCFF00]/5 blur-[100px]" />
                <div className="relative z-10 space-y-4">
                  <p className="text-2xl font-black text-white uppercase tracking-tighter">No {role}s Found</p>
                  <p className="admin-subheading text-[#999999]">The system ledger for {role}s is currently empty.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {professionals.map((prof) => (
                  <div 
                    key={prof._id} 
                    onClick={() => navigate(`/admin/professionals/${prof._id}`)}
                    className="group relative bg-[#000000] border border-[#2D2D2D] rounded-[12px] p-4 lg:px-8 lg:py-5 transition-all duration-500 hover:border-[#CCFF00]/40 shadow-xl overflow-hidden cursor-pointer"
                  >
                    {/* Interaction Highlight */}
                    <div className="absolute inset-y-0 left-0 w-1 bg-[#CCFF00] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 shadow-[0_0_15px_#CCFF00]" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
                      {/* Profile */}
                      <div className="lg:col-span-4 flex items-center gap-5">
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 bg-[#CCFF00]/5 blur-lg rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative w-11 h-11 rounded-[10px] bg-[#CCFF00]/10 flex items-center justify-center text-[18px] font-black text-[#CCFF00] uppercase border border-[#CCFF00]/20 shadow-[0_0_15px_rgba(204,255,0,0.05)] group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                            {prof.profilePicture ? (
                              <img src={prof.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              prof.name?.[0]
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-black text-white uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors truncate font-open-sans">
                            {prof.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]" />
                            <span className="text-[8px] font-black text-[#CCFF00] uppercase tracking-[0.2em]">Active {role}</span>
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="lg:col-span-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#CCFF00] transition-colors border border-white/5 group-hover:border-[#CCFF00]/20">
                          <Mail size={14} />
                        </div>
                        <span className="text-[12px] font-bold text-white/60 truncate group-hover:text-white transition-colors">
                          {prof.email}
                        </span>
                      </div>

                      {/* Phone */}
                      <div className="lg:col-span-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#CCFF00] transition-colors border border-white/5 group-hover:border-[#CCFF00]/20">
                          <Phone size={14} />
                        </div>
                        <span className="text-[12px] font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-tight">
                          {prof.phone || "UNPUBLISHED"}
                        </span>
                      </div>

                      {/* Expertise */}
                      <div className="lg:col-span-2 flex flex-col items-center">
                        <span className="text-[11px] font-black text-white uppercase tracking-tighter group-hover:text-[#CCFF00] transition-colors">
                          {prof.businessDetails?.specialization || "GENERALIST"}
                        </span>
                        <span className="text-[8px] font-bold text-[#878C9F] uppercase tracking-widest mt-0.5">
                          XP: {prof.businessDetails?.experience || "N/A"}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="lg:col-span-1 flex justify-end">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-[#CCFF00] group-hover:text-black transition-all border border-white/5 group-hover:border-[#CCFF00]">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 group/item">
    <div className="w-8 h-8 rounded-[6px] bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 group-hover/item:border-[#CCFF00]/20 group-hover/item:text-[#CCFF00] transition-all">
      <Icon size={14} strokeWidth={1.5} />
    </div>
    <div className="min-w-0">
      <p className="text-[8px] font-bold text-[#878C9F] uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[11px] font-bold text-white/90 group-hover/item:text-white transition-colors truncate">{value}</p>
    </div>
  </div>
);

const MetricBlock = ({ label, value }) => (
  <div className="flex flex-col items-center p-2 rounded-[8px] bg-white/[0.02] border border-white/5 hover:bg-[#CCFF00]/5 hover:border-[#CCFF00]/10 transition-all group/metric">
    <span className="text-[7px] font-black text-[#878C9F] uppercase tracking-widest mb-1 group-hover/metric:text-[#CCFF00]/60">{label}</span>
    <span className="text-[11px] font-black text-white group-hover/metric:text-[#CCFF00]">{value}</span>
  </div>
);

export default ProfessionalManagement;
