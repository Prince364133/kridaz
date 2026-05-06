import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const MobileHeader = () => {
  const { user, isLoggedIn } = useSelector((state) => state.auth);
  const [location, setLocation] = useState("Detecting...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectLocation = () => {
      if (!navigator.geolocation) {
        setLocation("Location not supported");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await res.json();
            const city = data.city || data.locality || "Unknown Location";
            setLocation(city);
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
            setLocation("Location Error");
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocation("Location Denied");
          setLoading(false);
        }
      );
    };

    // detectLocation(); // DISABLED for privacy (manual entry only)
    setLocation("Set Location");
    setLoading(false);
  }, []);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-[100] w-full bg-black/80 backdrop-blur-2xl border-b border-white/10 px-6 py-4 flex items-center justify-between transition-all duration-300">
      {/* Left: Logo and Name */}
      <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform">
        <div className="relative group">
          <img 
            src="/logo.png" 
            alt="TurfSpot" 
            className="h-10 w-auto brightness-110 group-hover:brightness-125 transition-all"
          />
          <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
        </div>
      </Link>

      {/* Right: User and Location */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-white/90 text-sm font-bold truncate max-w-[120px]">
            {isLoggedIn ? user?.name : "Guest Player"}
          </span>
          <div className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse shadow-[0_0_8px_#84CC16]" />
        </div>
        
        <div className="flex items-center gap-1.5 text-white/50">
          {loading ? (
            <Loader2 size={12} className="animate-spin text-primary" />
          ) : (
            <MapPin size={12} className="text-[#84CC16]" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[100px]">
            {location}
          </span>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
