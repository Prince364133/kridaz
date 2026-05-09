import React from "react";
import { MapPin, Clock, Star, Calendar, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Turf = ({ turf, onApprove, onReject }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/admin/turfs/${turf._id}`)}
      className="bms-card group flex flex-col relative cursor-pointer hover:border-[#CCFF00]/40 transition-all duration-500 overflow-hidden"
    >
      {/* ── Image ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: "220px" }}>
        <img
          src={turf.image}
          alt={turf.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { e.target.onerror = null; e.target.src = "/banner-2.png"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        
        {/* Price badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-[#CCFF00] text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
            ₹{turf.pricePerHour}/hr
          </span>
        </div>
        
        {/* Status badge */}
        <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            turf.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
            turf.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            turf.status === 'approved' ? 'bg-green-500' :
            turf.status === 'rejected' ? 'bg-red-500' :
            'bg-yellow-500'
          }`} />
          <span>{turf.status}</span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-6 gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-[0.2em]">Arena</span>
          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
            <Star size={10} className="text-[#CCFF00] fill-[#CCFF00]" />
            <span className="text-white text-[10px] font-bold tracking-tighter">{turf.avgRating || "NEW"}</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-display text-xl uppercase tracking-tighter text-white group-hover:text-[#CCFF00] transition-colors leading-none line-clamp-2">
            {turf.name}
          </h3>
          <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
            <MapPin size={10} className="text-[#CCFF00]" />
            <span className="truncate">{turf.location}</span>
          </div>
        </div>

        {turf.createdAt && (
          <div className="flex items-center gap-2 text-gray-600 text-[9px] font-black uppercase tracking-widest">
            <Calendar size={10} />
            <span>Operational since {format(new Date(turf.createdAt), "dd MMM yyyy")}</span>
          </div>
        )}

        {/* Admin Actions */}
        {turf.status === 'pending' && (
            <div className="grid grid-cols-2 gap-3 mt-2 pt-5 border-t border-white/5">
                <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(turf._id);
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-green-500/5 hover:bg-green-500/10 text-green-500 border border-green-500/10 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all"
                >
                    <Check size={12} />
                    Approve
                </button>
                <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject(turf._id);
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all"
                >
                    <X size={12} />
                    Reject
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Turf;

