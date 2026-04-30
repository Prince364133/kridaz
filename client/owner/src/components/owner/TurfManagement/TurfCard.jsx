import { Link } from "react-router-dom";
import { Edit2, Trash2, Clock, MapPin, Tag, Star, LayoutDashboard } from "lucide-react";

const TurfCard = ({ turf, onEdit }) => {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden group hover:border-primary transition-all duration-300 h-full flex flex-col shadow-2xl relative">
      <Link to={`/partner/turf/${turf._id}`} className="block h-48 relative overflow-hidden">
        <img
          src={turf.image}
          alt={turf.name}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <div className="px-6 py-3 bg-primary text-black font-black uppercase italic tracking-tighter rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-transform flex items-center gap-2">
              <LayoutDashboard size={16} strokeWidth={3} />
              Open Command Center
           </div>
        </div>
        <div className="absolute top-4 right-4 bg-primary text-black font-bold px-3 py-1 rounded-xl shadow-lg text-sm">
          ₹{turf.pricePerHour}/H
        </div>
      </Link>
      
      <div className="p-6 flex flex-col flex-grow">
        <Link to={`/partner/turf/${turf._id}`} className="block group">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h2 className="text-2xl font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                 {turf.name}
               </h2>
               <div className="flex items-center text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                 <MapPin size={10} className="mr-1 text-primary" />
                 {turf.location}
               </div>
             </div>
             <div className="flex items-center bg-[#1a1a1a] px-3 py-1 rounded-xl">
               <Star size={12} className="text-primary mr-1 fill-primary" />
               <span className="text-xs font-bold text-white">
                 {turf.avgRating ? turf.avgRating.toFixed(1) : "NEW"}
               </span>
             </div>
           </div>
        </Link>

        <p className="text-gray-400 text-sm line-clamp-2 mb-6">
          {turf.description}
        </p>

        <div className="mt-auto">
          <div className="flex flex-wrap gap-2 mb-6">
            {turf.sportTypes.map((sport, index) => (
              <span key={index} className="px-3 py-1 bg-[#1a1a1a] text-gray-500 border border-gray-800 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                {sport}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 pt-4">
            <div className="flex items-center text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              <Clock size={12} className="mr-2 text-primary" />
              {turf.openTime} - {turf.closeTime}
            </div>
            <button
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold px-6 py-2 rounded-xl transition-all text-xs uppercase flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                onEdit(turf);
              }}
            >
              <Edit2 size={12} />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default TurfCard;
