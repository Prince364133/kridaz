import { Link, useNavigate } from "react-router-dom";
import { Edit2, Trash2, Clock, MapPin, Tag, Star, LayoutDashboard, Zap } from "lucide-react";

const TurfCard = ({ turf, onEdit, onDelete, onToggleVisibility }) => {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden group hover:border-primary transition-all duration-300 h-full flex flex-col shadow-2xl relative">
      <Link to={`/partner/turf/${turf._id}`} className="block h-48 relative overflow-hidden">
        <img
          src={turf.image}
          alt={turf.name}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.target.onerror = null; e.target.src = "/banner-2.png"; }}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <div className="px-6 py-3 bg-primary text-black font-black uppercase italic tracking-tighter rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-transform flex items-center gap-2">
              View Arena Details
           </div>
        </div>
        <div className="absolute top-4 right-4 bg-primary text-black font-bold px-3 py-1 rounded-xl shadow-lg text-sm">
          ₹{turf.pricePerHour}/H
        </div>
        {/* Visibility Badge */}
        <div className={`absolute top-4 left-4 px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 ${turf.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
           <Zap size={8} className={turf.isActive ? "fill-white" : ""} />
           {turf.isActive ? "Visible" : "Hidden"}
        </div>
      </Link>
      
      <div className="p-6 flex flex-col flex-grow">
        <Link to={`/partner/turf/${turf._id}`} className="block group">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h2 className="text-2xl font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                 {turf.name}
               </h2>
               <div className="flex gap-2 mt-2">
                 <div className="flex items-center text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                   <MapPin size={10} className="mr-1 text-primary" />
                   {turf.location}
                 </div>
                 <div className={`px-2 py-0.5 border rounded-lg text-[8px] font-black uppercase tracking-widest ${
                    turf.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                    turf.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                 }`}>
                    {turf.status}
                 </div>
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

        <div className="mt-auto space-y-4">
          <div className="flex flex-wrap gap-2">
            {turf.sportTypes.map((sport, index) => (
              <span key={index} className="px-3 py-1 bg-[#1a1a1a] text-gray-500 border border-gray-800 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                {sport}
              </span>
            ))}
          </div>

          <div className="flex items-center text-gray-500 text-[10px] font-bold uppercase tracking-widest">
            <Clock size={12} className="mr-2 text-primary" />
            {turf.openTime} - {turf.closeTime}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-800">
            <button
              onClick={onEdit}
              className="bg-[#1a1a1a] border border-gray-800 hover:border-primary text-white p-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 group/btn"
            >
              <Edit2 size={14} className="group-hover/btn:text-primary transition-colors" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Edit</span>
            </button>

            <button
              onClick={onToggleVisibility}
              className={`p-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 border ${
                turf.isActive 
                ? "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20" 
                : "bg-gray-500/10 border-gray-500/20 text-gray-400 hover:bg-gray-500/20"
              }`}
            >
              <Zap size={14} className={turf.isActive ? "fill-green-500" : ""} />
              <span className="text-[8px] font-black uppercase tracking-tighter">{turf.isActive ? "Online" : "Offline"}</span>
            </button>

            <button
              onClick={onDelete}
              className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 p-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
            >
              <Trash2 size={14} />
              <span className="text-[8px] font-black uppercase tracking-tighter">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default TurfCard;
