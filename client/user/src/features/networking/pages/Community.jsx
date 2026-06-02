import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { Search, Loader2, X, MapPin, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { setUserLocation, setLocationStatus } from "@redux/slices/uiSlice";

import StoriesSection from "../components/StoriesSection";
import CommunityFeed from "../components/CommunityFeed";
import ReelsView from "../components/ReelsView";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };

const Community = ({ children, onSearchActive }) => {
  const { user, role, isLoggedIn } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAdmin = role === "admin" || role === "BMSP_ADMIN";

  const userLocation = useSelector((state) => state.ui?.userLocation);
  const locationStatus = useSelector((state) => state.ui?.locationStatus);

  const geoLoading = locationStatus === "detecting";
  const geoLabel = userLocation 
    ? (userLocation.city && userLocation.state 
        ? `${userLocation.city}, ${userLocation.state}` 
        : userLocation.city || userLocation.state || "Unknown")
    : null;

  const detectLocation = () => {
    dispatch(setLocationStatus("detecting"));
    if (!navigator.geolocation) {
      dispatch(setLocationStatus("denied"));
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
      },
      () => {
        dispatch(setLocationStatus("denied"));
      },
      { timeout: 8000 }
    );
  };

  // Filter / panel state
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "shots" ? "Reels" : "All";
  const [activeFilter, setActiveFilter] = useState(initialTab);
  const [activeSportFilter, setActiveSportFilter] = useState("");

  // Sync activeFilter if URL changes (e.g. from Home page click)
  useEffect(() => {
    if (searchParams.get("tab") === "shots") {
      setActiveFilter("Reels");
    } else if (activeFilter === "Reels") {
      setActiveFilter("All");
    }
  }, [searchParams.get("tab")]);

  // Sync URL when Shots/Reels view is toggled
  const handleSetActiveFilter = (filter) => {
    setActiveFilter(filter);
    if (filter === "Reels") {
      searchParams.set("tab", "shots");
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.delete("tab");
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  };

  // Disable body scroll when viewing Reels
  useEffect(() => {
    if (activeFilter === "Reels") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activeFilter]);

  // Search state
  const [feedSearchQuery, setFeedSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Notify parent of search state
  useEffect(() => {
    if (onSearchActive) {
      onSearchActive(debouncedSearchQuery.trim() !== "");
    }
  }, [debouncedSearchQuery, onSearchActive]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(feedSearchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [feedSearchQuery]);

  // Global Search Modal states
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!showGlobalSearch) return;
    const delayDebounceFn = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await axiosInstance.get("/api/user/players", { params: { search: searchQuery } });
        if (res.data?.success) {
          setSearchResults(res.data.players || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, showGlobalSearch]);

  return (
    <div className={`min-h-screen bg-[#050505] text-white pt-4 pb-12 ${activeFilter === "Reels" ? "px-0 md:px-4" : "px-2 md:px-4"} font-sans relative`}>
      {/* Global Search Modal */}
      <AnimatePresence>
        {showGlobalSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-32 bg-black/80 backdrop-blur-md"
            onClick={() => setShowGlobalSearch(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[8px] overflow-hidden shadow-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-[#111]">
                <Search size={20} className="text-[#BFF367]" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search players..."
                  className="flex-1 bg-transparent text-white text-[16px] outline-none placeholder:text-white/30 font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setShowGlobalSearch(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto no-scrollbar">
                {isSearching ? (
                  <div className="flex justify-center p-12">
                    <Loader2 size={32} className="text-[#BFF367] animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {searchResults.map((player) => (
                      <div
                        key={player._id}
                        onClick={() => {
                          setShowGlobalSearch(false);
                          navigate(`/profile/${player._id}`);
                        }}
                        className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-[8px] cursor-pointer transition-all group"
                      >
                        <div className="w-[46px] h-[46px] rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-bold text-white group-hover:text-[#BFF367] transition-colors truncate">{player.name}</div>
                          <div className="text-[12px] font-medium text-white/40 truncate">
                            @{player.username || player.name.toLowerCase().replace(/\s+/g, "")}
                          </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white/50 group-hover:border-[#BFF367] group-hover:text-[#BFF367] transition-all">
                          View Profile
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-12 text-center text-white/30 font-bold text-[13px] uppercase tracking-widest">No players found</div>
                ) : (
                  <div className="p-12 text-center text-white/30 font-bold text-[13px] uppercase tracking-widest">Type to start searching</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto w-full">
        <div className="grid grid-cols-1 gap-6">
          <div className={`max-w-3xl mx-auto w-full transition-all duration-300 flex flex-col ${activeFilter === "Reels" ? "h-[100dvh] sticky top-0 max-w-none" : "gap-1"}`}>
            {activeFilter === "Reels" ? (
              <ReelsView gateInteraction={gateInteraction} onBack={() => handleSetActiveFilter("All")} />
            ) : (
              <>
                {/* Desktop Location Header */}
                {isLoggedIn && (
                  <div className="hidden lg:flex flex-col items-start mt-4 mb-4 cursor-pointer group">
                    <svg width="0" height="0" className="absolute">
                      <linearGradient id="mapPinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60E5D0" />
                        <stop offset="100%" stopColor="#A2F86D" />
                      </linearGradient>
                    </svg>
                    <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.15em] mb-1">
                      YOUR LOCATION
                    </span>
                    <div className="flex items-center gap-2 mt-[2px]">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                          <g fill="none">
                            <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                            <path fill="url(#mapPinGradient)" d="M12 2a9 9 0 0 1 9 9c0 3.074-1.676 5.59-3.442 7.395a20.4 20.4 0 0 1-2.876 2.416l-.426.29l-.2.133l-.377.24l-.336.205l-.416.242a1.87 1.87 0 0 1-1.854 0l-.416-.242l-.52-.32l-.192-.125l-.41-.273a20.6 20.6 0 0 1-3.093-2.566C4.676 16.589 3 14.074 3 11a9 9 0 0 1 9-9m0 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6" />
                          </g>
                        </svg>
                      </div>
                      
                      {geoLoading ? (
                        <span className="text-[26px] font-medium text-white tracking-tight leading-none animate-pulse">
                          Locating...
                        </span>
                      ) : geoLabel ? (
                        <span className="text-[26px] font-medium text-white tracking-tight leading-none truncate max-w-[300px]">
                          {userLocation?.city || geoLabel.split(',')[0]}
                        </span>
                      ) : (
                        <button
                          onClick={detectLocation}
                          className="text-[26px] font-medium text-white tracking-tight leading-none hover:text-white/80 transition-colors"
                        >
                          Set Location
                        </button>
                      )}
                      
                      <ChevronDown size={20} className="text-white mt-1 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <StoriesSection user={user} isLoggedIn={isLoggedIn} isAdmin={isAdmin} gateInteraction={gateInteraction} />
                </div>

                <CommunityFeed
                  user={user}
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                  gateInteraction={gateInteraction}
                  activeFilter={activeFilter}
                  handleSetActiveFilter={handleSetActiveFilter}
                  activeSportFilter={activeSportFilter}
                  setActiveSportFilter={setActiveSportFilter}
                  debouncedSearchQuery={debouncedSearchQuery}
                >
                  {children}
                </CommunityFeed>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;



