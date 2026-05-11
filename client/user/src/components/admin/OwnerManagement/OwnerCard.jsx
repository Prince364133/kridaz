import React from "react";
import { User, Mail, Phone, Calendar, Fingerprint, ChevronRight, ShieldCheck, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

const OwnerCard = ({ owner }) => {
  const navigate = useNavigate();
  const ownerId = owner._id?.slice(-8).toUpperCase() || "N/A";

  return (
    <div 
      onClick={() => navigate(`/admin/owners/${owner._id}/turf`)}
      className="group relative bg-[#000000] border border-[#2D2D2D] rounded-[12px] p-4 lg:px-8 lg:py-5 transition-all duration-500 hover:border-[#CCFF00]/40 shadow-xl overflow-hidden cursor-pointer"
    >
      {/* Interaction Highlight */}
      <div className="absolute inset-y-0 left-0 w-1 bg-[#CCFF00] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 shadow-[0_0_15px_#CCFF00]" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Partner Profile */}
        <div className="lg:col-span-4 flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-[#CCFF00]/5 blur-lg rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-11 h-11 rounded-[10px] bg-[#CCFF00]/10 flex items-center justify-center text-[18px] font-black text-[#CCFF00] uppercase border border-[#CCFF00]/20 shadow-[0_0_15px_rgba(204,255,0,0.05)] group-hover:scale-105 transition-transform duration-500">
              {owner.name?.[0] || "U"}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-black text-white uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors truncate font-open-sans">
              {owner.name}
            </h3>
            <p className="text-[9px] font-black text-[#878C9F] uppercase tracking-[0.2em] mt-0.5">
              PARTNER ID: <span className="text-white/40">{ownerId}</span>
            </p>
          </div>
        </div>

        {/* Operational Email */}
        <div className="lg:col-span-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#CCFF00] transition-colors border border-white/5 group-hover:border-[#CCFF00]/20">
            <Mail size={14} />
          </div>
          <span className="text-[12px] font-bold text-white/60 truncate group-hover:text-white transition-colors">
            {owner.email}
          </span>
        </div>

        {/* Contact Number */}
        <div className="lg:col-span-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#CCFF00] transition-colors border border-white/5 group-hover:border-[#CCFF00]/20">
            <Phone size={14} />
          </div>
          <span className="text-[12px] font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-tight">
            {owner.phone || "UNPUBLISHED"}
          </span>
        </div>

        {/* Security Status */}
        <div className="lg:col-span-2 flex items-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#CCFF00]/5 border border-[#CCFF00]/10 rounded-full group-hover:bg-[#CCFF00]/10 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00] animate-pulse" />
            <span className="text-[9px] font-black text-[#CCFF00] uppercase tracking-widest">Clear / Verified</span>
          </div>
        </div>

        {/* Action */}
        <div className="lg:col-span-1 flex justify-end">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-[#CCFF00] group-hover:text-black transition-all border border-white/5 group-hover:border-[#CCFF00]">
            <ChevronRight size={16} />
          </div>
        </div>
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

export default OwnerCard;
