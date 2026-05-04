// src/components/OwnerViewer/OwnerCard.jsx
import React from "react";
import { User, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

const OwnerCard = ({ owner }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/admin/owners/${owner._id}/turf`)}
      className="group relative bg-[#111] rounded-2xl border border-white/10 transition-all duration-300 hover:border-[#84CC16]/50 hover:shadow-[0_0_30px_rgba(132,204,22,0.1)] p-6 space-y-6 cursor-pointer"
    >
      {/* Profile Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#84CC16] uppercase tracking-widest">Registered Owner</p>
          <h3 className="text-xl font-bold uppercase text-white tracking-tight leading-tight group-hover:text-[#84CC16] transition-colors">
            {owner.name}
          </h3>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <User className="h-6 w-6 text-[#84CC16]" />
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
          <Mail size={14} className="text-[#84CC16]" />
          <span>{owner.email}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
          <Phone size={14} className="text-[#84CC16]" />
          <span>{owner.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
          <Calendar size={14} className="text-[#84CC16]" />
          <span>Joined: {format(parseISO(owner.createdAt), "dd MMM yyyy")}</span>
        </div>
      </div>
    </div>
  );
};

export default OwnerCard;
