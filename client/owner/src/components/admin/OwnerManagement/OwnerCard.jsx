// src/components/OwnerViewer/OwnerCard.jsx
import React from "react";
import { User, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

const OwnerCard = ({ owner }) => {
  return (
    <div className="group relative bg-[#111111] notched-corner border border-white/5 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(113,179,0,0.1)] p-6 space-y-6">
      {/* Profile Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">Officer Identification</p>
          <h3 className="text-2xl font-display font-black italic uppercase text-white tracking-tight leading-tight group-hover:text-primary transition-colors">
            {owner.name}
          </h3>
        </div>
        <div className="bg-white/5 notched-corner p-3">
          <User className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
          <Mail size={14} className="text-primary" />
          <span>{owner.email}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
          <Phone size={14} className="text-primary" />
          <span>{owner.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
          <Calendar size={14} className="text-primary" />
          <span>ENLISTED: {format(parseISO(owner.createdAt), "dd.MM.yyyy")}</span>
        </div>
      </div>

      {/* Action Section */}
      <div className="pt-4 flex justify-end">
        <Link 
          to={`/admin/owners/${owner._id}/turf`} 
          className="group/btn relative inline-flex items-center gap-2 bg-primary text-black font-display font-black italic uppercase text-xs py-3 px-6 notched-corner transition-transform hover:scale-105 active:scale-95"
        >
          <MapPin className="h-4 w-4" />
          Arena Assets
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]"></div>
        </Link>
      </div>
    </div>
  );
};

export default OwnerCard;
