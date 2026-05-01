import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Heart,
  Share2
} from "lucide-react";

const TurfCard = ({ turf, featured = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  
  const to = `/turf/${turf._id}`;
  const images = turf.images?.length > 0 ? turf.images : [turf.image];
  const rating = turf.rating ?? 4.5;
  const location = turf.location ?? "Location not specified";
  const category = turf.sportTypes?.[0] || "SPORTS";

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      onClick={() => navigate(to)}
      className="bg-[#0A0A0A] rounded-[2rem] border border-white/[0.05] overflow-hidden flex flex-col transition-all duration-500 hover:border-white/[0.1] hover:shadow-2xl hover:shadow-black/50 group h-full cursor-pointer"
    >
      
      {/* ── Image Section ────────────────────────────────── */}
      <div className="relative w-full h-[200px] overflow-hidden shrink-0 rounded-t-[2rem]">
        <img
          src={images[currentImageIndex] || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
          alt={turf.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-4 left-4 z-20 bg-[#84CC16] px-3 py-1 rounded-lg shadow-lg">
            <span className="text-[10px] font-black text-black uppercase">Featured</span>
          </div>
        )}

        {/* Carousel Controls */}
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-1.5 bg-black/40 hover:bg-[#84CC16] hover:text-black backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-1.5 bg-black/40 hover:bg-[#84CC16] hover:text-black backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* ── Content Section ────────────────────────────── */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1 group-hover:text-[#84CC16] transition-colors">
            {turf.name}
          </h3>
          <div className="flex items-center gap-1.5 opacity-50 mb-4">
            <MapPin size={12} className="text-[#84CC16]" />
            <span className="text-white text-[10px] font-bold truncate">{location}</span>
          </div>

          {/* Rating & Category Tag */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-[#84CC16] fill-[#84CC16]" />
              <span className="text-sm font-bold text-white">{rating.toFixed(1)}</span>
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-md border border-white/10 text-[9px] font-black uppercase text-white/60">
              {category}
            </div>
          </div>
          
          {/* Price */}
          <div className="text-[#84CC16] font-black text-base mt-auto pt-4">
            ₹{turf.pricePerHour}<span className="text-[10px] text-white/30 ml-1">/hr</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfCard;
