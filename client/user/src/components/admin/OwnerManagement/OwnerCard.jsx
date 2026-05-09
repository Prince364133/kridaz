import React from "react";
import { User, Mail, Phone, Calendar, Fingerprint, ChevronRight, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

const OwnerCard = ({ owner }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/admin/owners/${owner._id}/turf`)}
      className="group relative bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden group hover:border-[#CCFF00]/30 transition-all duration-500 shadow-[var(--shadow-2)] cursor-pointer h-full"
    >
      {/* Background Icon Watermark */}
      <Fingerprint className="absolute -right-6 -top-6 w-32 h-32 text-white/[0.02] group-hover:text-white/[0.04] transition-colors rotate-12" />

      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#2D2D2D]/30 relative z-10">
        <div className="w-12 h-12 rounded-[4px] bg-[#2D2D2D] flex items-center justify-center text-[16px] font-bold text-[#CCFF00] uppercase border border-[#404040]">
          {owner.name?.[0] || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-[#CCFF00] uppercase tracking-[0.2em] mb-1">Authenticated Partner</p>
          <h3 className="text-[14px] font-semibold text-white uppercase tracking-tight truncate group-hover:text-[#CCFF00] transition-colors">
            {owner.name}
          </h3>
        </div>
        <div className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-[4px] p-2 group-hover:bg-[#CCFF00] group-hover:text-black transition-all">
          <ChevronRight size={14} />
        </div>
      </div>

      {/* Details Dossier */}
      <div className="space-y-4 flex-1 relative z-10">
        <div className="grid grid-cols-1 gap-2">
           <InfoRow icon={Mail} label="Operational Email" value={owner.email} />
           <InfoRow icon={Phone} label="Direct Contact" value={owner.phone} />
           <InfoRow icon={Calendar} label="Partner Since" value={format(parseISO(owner.createdAt), "dd MMM yyyy")} />
        </div>
      </div>

      {/* Edge Accents */}
      <div className="absolute top-0 left-0 w-[1px] h-0 group-hover:h-full bg-gradient-to-b from-[#CCFF00] to-transparent transition-all duration-700" />
      <div className="absolute bottom-0 right-0 w-0 group-hover:w-full h-[1px] bg-gradient-to-l from-[#CCFF00] to-transparent transition-all duration-700" />
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="bg-[#151617] p-3 rounded-[6px] border border-[#2D2D2D]/50 flex items-center gap-3 hover:border-[#CCFF00]/10 transition-colors">
    <div className="p-1.5 bg-[#CCFF00]/5 rounded-[4px] text-[#CCFF00]">
      <Icon size={12} />
    </div>
    <div className="min-w-0">
      <p className="text-[8px] font-normal text-[#878C9F] uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[12px] font-semibold text-white uppercase tracking-tight truncate">{value}</p>
    </div>
  </div>
);

export default OwnerCard;
