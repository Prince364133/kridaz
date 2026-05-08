import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, ChevronLeft, ChevronRight, Zap, Heart } from "lucide-react";

const TurfCard = ({ turf, featured = false, distance = "1.2km Away" }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();

  const to = `/turf/${turf._id}`;
  const images = turf.images?.length > 0 ? turf.images : [turf.image];
  const rating = turf.rating ?? 4.8;
  const price = turf.pricePerHour ?? 800;
  
  const nextImage = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setCurrentImageIndex((p) => (p + 1) % images.length); 
  };
  const prevImage = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setCurrentImageIndex((p) => (p - 1 + images.length) % images.length); 
  };

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div
      onClick={() => navigate(to)}
      className="group relative h-[400px] w-full rounded-[2rem] overflow-hidden cursor-pointer bg-[#0d0d0d] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* ── Background Image ── */}
      <div className="absolute inset-0">
        <img
          src={images[currentImageIndex] || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
          alt={turf.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Darkening overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* ── Heart Icon (Top Right) ── */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={toggleWishlist}
          className="p-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 transition-all duration-300 group/heart"
        >
          <Heart 
            size={20} 
            className={`transition-all duration-300 ${
              isWishlisted ? "fill-red-500 text-red-500 scale-110" : "text-white group-hover/heart:scale-110"
            }`} 
          />
        </button>
      </div>

      {/* ── Featured Badge ── */}
      {featured && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-[#4ADE80] px-3 py-1 rounded-full shadow-lg">
          <Zap size={10} className="text-black fill-black" />
          <span className="text-[9px] font-black text-black uppercase tracking-wider">Featured</span>
        </div>
      )}

      {/* ── Carousel Controls ── */}
      {images.length > 1 && (
        <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
          <button onClick={prevImage} className="p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextImage} className="p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Bottom Content Area with Blur ── */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-10 z-20 overflow-hidden">
        {/* The Blur Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-[2px]" />
        
        <div className="relative z-10 space-y-4">
          {/* Name & Distance */}
          <div className="space-y-0.5">
            <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
              {turf.name}
            </h3>
            <p className="text-sm font-medium text-white/80">
              {distance || "1.2km Away"}
            </p>
          </div>

          {/* Pricing & Rating Row */}
          <div className="flex items-center justify-between items-end pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#4ADE80]">₹{price}</span>
              <span className="text-sm font-medium text-white/90">/ hr</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#4ADE80]">
              <Star size={18} className="fill-current" />
              <span className="text-lg font-bold">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default TurfCard;
