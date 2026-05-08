import { Link, useNavigate } from "react-router-dom";
import { Edit2, Trash2, Clock, MapPin, Tag, Star, LayoutDashboard, Zap } from "lucide-react";

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
        
        {/* Pricing Badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 text-white font-bold px-3 py-1 rounded-full text-[10px] tracking-tight font-outfit shadow-xl">
          ₹{turf.pricePerHour}<span className="text-white/40 font-normal ml-0.5">/Hr</span>
        </div>

        {/* Visibility Badge */}
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 backdrop-blur-md border ${
          turf.isActive 
          ? 'bg-[#CCFF00]/20 border-[#CCFF00]/30 text-[#CCFF00]' 
          : 'bg-black/60 border-white/10 text-[#878C9F]'
        }`}>
           <Zap size={8} className={turf.isActive ? "fill-[#CCFF00]" : ""} />
           {turf.isActive ? "Visible" : "Hidden"}
        </div>
      </Link>
      
      <div className="p-4 flex flex-col flex-grow relative">
        <Link to={`/partner/turf/${turf._id}`} className="block group/title">
           <div className="flex justify-between items-start mb-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white uppercase tracking-tight group-hover/title:text-[#CCFF00] transition-colors font-outfit">
                  {turf.name}
                </h2>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${
                     turf.status === 'approved' ? 'bg-[#CCFF00]/10 border-[#CCFF00]/20 text-[#CCFF00]' :
                     turf.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                     'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                  }`}>
                     {turf.status}
                  </div>
                  <span className="text-[10px] text-[#444] font-medium uppercase tracking-widest">•</span>
                  <div className="flex items-center text-[#878C9F] text-[9px] font-bold uppercase tracking-widest">
                    {turf.location}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center bg-[#111] px-2 py-0.5 rounded-[4px] border border-[#2D2D2D]">
                <Star size={9} className="text-[#CCFF00] mr-1 fill-[#CCFF00]" />
                <span className="text-[9px] font-bold text-white font-outfit">
                  {turf.avgRating ? turf.avgRating.toFixed(1) : "NEW"}
                </span>
              </div>
           </div>
        </Link>

        <p className="text-[#878C9F] text-[11px] leading-relaxed line-clamp-2 mb-4 opacity-60">
          {turf.description}
        </p>

        <div className="mt-auto space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {turf.sportTypes.map((sport, index) => (
              <span key={index} className="px-2 py-0.5 bg-[#111111] text-[#878C9F] border border-[#2D2D2D] rounded-[3px] text-[8px] font-bold uppercase tracking-[1px]">
                {sport}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#2D2D2D]/50">
            <div className="flex items-center text-[#878C9F] text-[8px] font-bold uppercase tracking-widest">
              <Clock size={10} className="mr-1.5 text-[#CCFF00]/40" />
              {turf.openTime} - {turf.closeTime}
            </div>

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
                <Zap size={12} className={turf.isActive ? "fill-[#CCFF00]" : ""} />
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
