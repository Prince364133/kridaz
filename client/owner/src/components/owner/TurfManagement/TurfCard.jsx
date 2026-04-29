import React from "react";
import { Edit2, Trash2, Clock, MapPin, Tag, Star } from "lucide-react";

const TurfCard = ({ turf, onEdit }) => {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden group hover:border-primary transition-all duration-300 h-full flex flex-col shadow-2xl">
      <div className="relative overflow-hidden h-48">
        <img
          src={turf.image}
          alt={turf.name}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-primary text-black font-display italic px-3 py-1 rounded shadow-lg text-sm">
          ₹{turf.pricePerHour}/H
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-display font-black italic text-white uppercase tracking-tighter group-hover:text-primary transition-colors">
              {turf.name}
            </h2>
            <div className="flex items-center text-gray-500 text-[10px] font-mono uppercase tracking-widest mt-1">
              <MapPin size={10} className="mr-1 text-primary" />
              {turf.location}
            </div>
          </div>
          <div className="flex items-center bg-[#1a1a1a] px-2 py-1 rounded">
            <Star size={12} className="text-primary mr-1 fill-primary" />
            <span className="text-xs font-bold text-white">
              {turf.avgRating ? turf.avgRating.toFixed(1) : "NEW"}
            </span>
          </div>
        </div>

        <p className="text-gray-400 text-sm font-secondary line-clamp-2 mb-6">
          {turf.description}
        </p>

        <div className="mt-auto">
          <div className="flex flex-wrap gap-2 mb-6">
            {turf.sportTypes.map((sport, index) => (
              <span key={index} className="px-2 py-0.5 bg-[#1a1a1a] text-gray-500 border border-gray-800 rounded text-[10px] font-mono uppercase tracking-tighter">
                {sport}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 pt-4">
            <div className="flex items-center text-gray-500 font-mono text-[10px]">
              <Clock size={12} className="mr-2 text-primary" />
              {turf.openTime} - {turf.closeTime}
            </div>
            <button
              className="bg-white hover:bg-primary text-black font-display italic px-4 py-1.5 rounded transition-colors text-sm uppercase flex items-center gap-2"
              onClick={() => onEdit(turf)}
            >
              <Edit2 size={12} />
              MANAGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfCard;
