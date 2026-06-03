import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createPortal } from "react-dom";
import { X, ArrowLeft, Crosshair, MapPin, ArrowRight } from "lucide-react";
import { closeLocationSidebar, setUserLocation, setLocationStatus } from "@redux/slices/uiSlice";
import { motion, AnimatePresence } from "framer-motion";

const POPULAR_AREAS = [
  "Mylapore",
  "Velachery",
  "Thoraipakkam",
  "Sholinganallur",
  "Ramapuram",
  "Porur",
  "Nungambakkam",
  "Nolambur"
];

const LocationSidebar = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.ui.locationSidebar?.isOpen);
  const userLocation = useSelector((state) => state.ui.userLocation);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch(closeLocationSidebar());
  };

  const handleDetectLocation = () => {
    setIsDetecting(true);
    dispatch(setLocationStatus("detecting"));
    if (!navigator.geolocation) {
      dispatch(setLocationStatus("denied"));
      setIsDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let city = "";
        let state = "";
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
          const data = await res.json();
          city = data.city || data.locality || "";
          state = data.principalSubdivision || "";
        } catch (error) {
          console.warn("Reverse geocoding failed:", error);
        }
        dispatch(setUserLocation({ lat, lng, city, state }));
        dispatch(setLocationStatus("granted"));
        setIsDetecting(false);
        handleClose();
      },
      () => {
        dispatch(setLocationStatus("denied"));
        setIsDetecting(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSelectArea = (area) => {
    dispatch(setUserLocation({ lat: null, lng: null, city: area, state: "Tamil Nadu" }));
    dispatch(setLocationStatus("granted"));
    handleClose();
  };

  const sidebarContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:flex-row sm:justify-start">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sidebar Panel */}
      <motion.div
        initial={isMobile ? { y: "100%" } : { x: "-100%" }}
        animate={isMobile ? { y: 0 } : { x: 0 }}
        exit={isMobile ? { y: "100%" } : { x: "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-h-[90dvh] sm:max-h-none sm:h-full sm:w-[400px] bg-[#161616] flex flex-col shadow-2xl sm:border-r border-white/5 rounded-t-[24px] sm:rounded-none"
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-5 pb-4">
          <button 
            onClick={handleClose}
            className="text-white hover:text-white/70 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white tracking-tight">Set Location</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-2 flex flex-col gap-8 no-scrollbar">
          
          {/* Current Location Button */}
          <button
            onClick={handleDetectLocation}
            className="w-full flex items-center justify-between bg-[#242424] hover:bg-[#2A2A2A] transition-colors rounded-xl p-4 border border-white/5 group"
          >
            <div className="flex items-center gap-4">
              <Crosshair size={22} className="text-[#BFF367]" />
              <span className="text-[16px] font-bold text-white">
                {isDetecting ? "Detecting..." : "Use Current Location"}
              </span>
            </div>
            <ArrowRight size={20} className="text-white/40 group-hover:text-white transition-colors group-hover:translate-x-1" />
          </button>

          {/* Popular Areas Section */}
          <div className="flex flex-col">
            <h3 className="text-[12px] font-bold text-white/50 uppercase tracking-[0.1em] mb-4">
              Popular Areas in Chennai
            </h3>
            <div className="flex flex-col gap-2">
              {POPULAR_AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => handleSelectArea(area)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-white/60" />
                  </div>
                  <span className="text-[15px] font-bold text-white/90">
                    {area}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && sidebarContent}
    </AnimatePresence>,
    document.body
  );
};

export default LocationSidebar;
