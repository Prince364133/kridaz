import { Link, useNavigate } from "react-router-dom";
import { Edit2, Trash2, Clock, MapPin, Tag, Star, LayoutDashboard, Eye, EyeOff } from "lucide-react";

const TurfCard = ({ turf, onEdit, onDelete, onToggleVisibility }) => {
  return (
    <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden group hover:border-[#CCFF00]/30 transition-all duration-500 h-full flex flex-col shadow-[var(--shadow-2)] relative">
      <Link to={`/partner/turf/${turf._id}`} className="block h-40 relative overflow-hidden">
        <img
          src={turf.image}
          alt={turf.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
          onError={(e) => { e.target.onerror = null; e.target.src = "/banner-2.png"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        

        {/* Status Icon Overlay (Top Right) */}
        {!turf.isActive && (
          <div className="absolute top-3 right-3 z-20 bg-black/80 backdrop-blur-md border border-red-500/50 text-red-500 p-1.5 rounded-full shadow-2xl" title="Venue Hidden">
            <EyeOff size={10} />
          </div>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-grow relative">
        <Link to={`/partner/turf/${turf._id}`} className="block group/title">
           <div className="flex justify-between items-start mb-3">
              <div className="space-y-1">
                <h2 className="text-[15px] font-bold text-white uppercase tracking-widest group-hover/title:text-[#CCFF00] transition-colors font-open-sans">
                  {turf.name}
                </h2>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest border ${
                     turf.status === 'approved' ? 'bg-[#CCFF00]/10 border-[#CCFF00]/20 text-[#CCFF00]' :
                     turf.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                     turf.status === 'decommissioned' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                     turf.status === 'deleted' ? 'bg-zinc-800 border-zinc-700 text-zinc-500' :
                     'bg-[#1A1A1A] border-[#2D2D2D] text-yellow-500'
                  }`}>
                     {turf.status}
                  </div>
                  <span className="text-[10px] text-[#444] font-medium uppercase tracking-widest">•</span>
                  <div className="flex items-center text-[#878C9F] text-[9px] font-bold uppercase tracking-widest">
                    {turf.status === 'decommissioned' ? (
                      <span className="text-orange-500/80 animate-pulse">Action Required: Re-apply</span>
                    ) : turf.location}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center bg-[#111] px-2 py-0.5 rounded-[4px] border border-[#2D2D2D]">
                <Star size={9} className="text-[#CCFF00] mr-1 fill-[#CCFF00]" />
                <span className="text-[9px] font-bold text-white font-open-sans">
                  {turf.avgRating ? turf.avgRating.toFixed(1) : "NEW"}
                </span>
              </div>
           </div>
        </Link>

        <p className="text-[#878C9F] font-inter text-[13px] leading-relaxed line-clamp-2 mb-4 h-[40px]">
          {turf.description || "No description provided for this venue."}
        </p>

        <div className="mt-auto space-y-4">
          <div className="flex flex-wrap gap-1.5">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#CCFF00]/5 border border-[#CCFF00]/20 rounded-[4px] text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">
                 Rs {turf.pricePerHour} <span className="opacity-40 font-normal">SETTLEMENT</span>
              </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#2D2D2D]/50">
             <button className="flex items-center gap-2 px-4 py-1.5 bg-[#CCFF00] hover:bg-white text-black rounded-[4px] text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_5px_15px_rgba(204,255,0,0.1)]">
                <Tag size={10} />
                Promotion
             </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onEdit}
                className="w-8 h-8 bg-[#111] border border-[#2D2D2D] hover:border-[#CCFF00]/40 text-[#878C9F] hover:text-[#CCFF00] rounded-[6px] transition-all flex items-center justify-center group/btn"
              >
                <Edit2 size={12} />
              </button>

              <button
                onClick={onToggleVisibility}
                className={`w-8 h-8 rounded-[6px] transition-all flex items-center justify-center border ${
                  turf.isActive 
                  ? "bg-[#CCFF00]/5 border-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/10" 
                  : "bg-black border-[#2D2D2D] text-[#444] hover:text-white"
                }`}
              >
                {turf.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>

              <button
                onClick={onDelete}
                className="w-8 h-8 bg-[#111] border border-[#2D2D2D] hover:border-red-500/40 text-[#878C9F] hover:text-red-500 rounded-[6px] transition-all flex items-center justify-center"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default TurfCard;
