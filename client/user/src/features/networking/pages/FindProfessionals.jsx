import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { 
  Search, MapPin, Star, Users, User, Shield, Trophy, 
  Activity, CheckCircle, Filter, Loader2, Check, X, 
  Video, Dribbble, ChevronDown, Sparkles, Navigation, Zap
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchStates, fetchCities } from "@utils/locationService";
import { useSocket } from "@context/SocketContext";
import { 
  useCreateMatchRequestMutation, 
  useGetUserOnDemandBookingsQuery 
} from "../../../redux/api/professionalApi";

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };
const sports = ["ALL SPORTS", "CRICKET", "BADMINTON", "FOOTBALL", "TENNIS", "PICKLEBALL"];
const roles = ["All", "Coach", "Umpire", "Streamer", "Commentator", "Scorer", "Cheerleader"];

export default function FindProfessionals() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, user } = useSelector((state) => state.auth);

  // Browse State
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("ALL SPORTS");
  const [selectedRole, setSelectedRole] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  // Modal State
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Matchmaking Form State
  const [selectedGroundId, setSelectedGroundId] = useState("");
  const [customLocation, setCustomLocation] = useState({ latitude: "", longitude: "", address: "" });

  // Location Auto-Search State
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);
  const locationSearchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [selectedRoles, setSelectedRoles] = useState(() => {
    const validRoles = ["COACH", "UMPIRE", "STREAMER", "COMMENTATOR", "SCORER", "CHEERLEADER"];
    const queryRole = searchParams.get("role")?.toUpperCase();
    return queryRole && validRoles.includes(queryRole) ? [queryRole] : [];
  });
  const [budget, setBudget] = useState(1000);
  const [matchDate, setMatchDate] = useState("");
  const [matchStartTime, setMatchStartTime] = useState("");
  const [matchEndTime, setMatchEndTime] = useState("");
  const [expiresInSeconds, setExpiresInSeconds] = useState(40);
  const [grounds, setGrounds] = useState([]);
  const [loadingGrounds, setLoadingGrounds] = useState(false);

  // RTK Query Mutations & Queries
  const [createMatchRequest, { isLoading: isCreatingRequest }] = useCreateMatchRequestMutation();
  const { refetch: refetchBookings } = useGetUserOnDemandBookingsQuery(undefined, {
    skip: !isLoggedIn
  });
  const { socket } = useSocket();

  // Auto-open modal if ?role= query param exists
  useEffect(() => {
    const queryRole = searchParams.get("role")?.toUpperCase();
    if (queryRole && ["COACH", "UMPIRE", "STREAMER", "COMMENTATOR", "SCORER", "CHEERLEADER"].includes(queryRole)) {
      setShowMatchModal(true);
    }
  }, []);

  // Load States & Grounds
  useEffect(() => {
    loadStates();
    fetchGrounds();
  }, []);

  useEffect(() => {
    if (stateFilter !== "All") {
      loadCities(stateFilter);
    } else {
      setAvailableCities([]);
    }
    setCityFilter("All");
  }, [stateFilter]);

  useEffect(() => {
    fetchProfessionals();
  }, [selectedSport, selectedRole, cityFilter, stateFilter]);

  // Socket confirmation listener
  useEffect(() => {
    if (socket && isLoggedIn) {
      const handleMatchConfirmed = (data) => {
        toast.success(`Match Confirmed! ${data.professionalName} is assigned.`);
        if (data.otp && data.bookingId) {
          localStorage.setItem(`otp_${data.bookingId}`, data.otp);
        }
        refetchBookings();
      };

      socket.on("professional:match_confirmed", handleMatchConfirmed);
      return () => {
        socket.off("professional:match_confirmed", handleMatchConfirmed);
      };
    }
  }, [socket, isLoggedIn, refetchBookings]);

  const loadStates = async () => {
    try {
      const states = await fetchStates();
      setAvailableStates(states);
    } catch (error) {
      console.error("Error loading states:", error);
    }
  };

  const loadCities = async (state) => {
    try {
      const cities = await fetchCities(state);
      setAvailableCities(cities);
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  const fetchGrounds = async () => {
    try {
      setLoadingGrounds(true);
      const res = await axiosInstance.get("/api/user/turf/all");
      setGrounds(res.data.turfs || []);
    } catch (err) {
      console.error("Error loading grounds:", err);
    } finally {
      setLoadingGrounds(false);
    }
  };

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const params = {
        sport: selectedSport === "ALL SPORTS" ? "" : selectedSport,
        role: selectedRole === "All" ? "" : selectedRole.toLowerCase(),
        city: cityFilter === "All" ? "" : cityFilter,
        state: stateFilter === "All" ? "" : stateFilter,
        searchTerm
      };
      const res = await axiosInstance.get("/api/professional/list", { params });
      setProfessionals(res.data.professionals || []);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      toast.error("Failed to load professionals");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProfessionals();
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toString();
        const lon = pos.coords.longitude.toString();
        let address = "Current Geolocation Coordinates";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (data.display_name) address = data.display_name;
        } catch {}
        setCustomLocation({ latitude: lat, longitude: lon, address });
        setLocationQuery(address);
        setSelectedGroundId("custom");
        setShowLocationSearchModal(false);
        toast.success("Location detected!");
      },
      (err) => {
        toast.error("Failed to detect location: " + err.message);
      }
    );
  };

  const handleLocationSearch = useCallback((query) => {
    setLocationQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query || query.length < 3) {
      setLocationResults([]);
      setShowLocationDropdown(false);
      return;
    }
    setLocationSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=in&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setLocationResults(data || []);
        setShowLocationDropdown(data.length > 0);
      } catch {
        setLocationResults([]);
      } finally {
        setLocationSearching(false);
      }
    }, 400);
  }, []);

  const handleSelectLocation = (place) => {
    setCustomLocation({
      latitude: place.lat,
      longitude: place.lon,
      address: place.display_name
    });
    setLocationQuery(place.display_name);
    setShowLocationDropdown(false);
    setLocationResults([]);
    setShowLocationSearchModal(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationSearchRef.current && !locationSearchRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleRole = (roleVal) => {
    if (selectedRoles.includes(roleVal)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleVal));
    } else {
      setSelectedRoles([...selectedRoles, roleVal]);
    }
  };

  const handleRequestMatch = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to request matchmaking");
      navigate("/login");
      return;
    }

    if (!selectedGroundId && (!customLocation.latitude || !customLocation.longitude)) {
      toast.error("Please select a ground or capture custom geolocation");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    if (!matchDate || !matchStartTime || !matchEndTime) {
      toast.error("Please select date, start time, and end time for the match.");
      return;
    }

    const payload = {
      roles: selectedRoles,
      minBudget: 500,
      maxBudget: parseFloat(budget),
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      matchDate,
      matchStartTime,
      matchEndTime
    };

    if (selectedGroundId && selectedGroundId !== "custom") {
      payload.groundId = selectedGroundId;
    } else {
      payload.customLocation = {
        latitude: parseFloat(customLocation.latitude),
        longitude: parseFloat(customLocation.longitude),
        address: customLocation.address || "Custom Geocoded Location"
      };
    }

    try {
      const res = await createMatchRequest(payload).unwrap();
      if (res.success) {
        toast.success("Match request placed! Check your Booking History for updates.");
        setSelectedRoles([]);
        setSelectedGroundId("");
        setCustomLocation({ latitude: "", longitude: "", address: "" });
        setShowMatchModal(false);
        refetchBookings();
        navigate("/booking-history?subTab=professionals");
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to create match request");
    }
  };

  const getInitials = (name) => {
    return name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 px-6 md:px-10 font-sans">
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto pt-6 pb-6 text-center relative px-4">
        <h1 className="font-['Open_Sans'] font-extrabold text-6xl lg:text-[72px] uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] mb-2 leading-[0.9]">
          PROS DIRECTORY
        </h1>
        <p className="hidden md:block text-[16px] text-white/60 uppercase tracking-[0.15em] leading-relaxed" style={SUBHEADING_STYLE}>
          Coaching • Officiating • Scorers • Live Streaming
        </p>
      </div>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto">
        <div className="max-w-5xl mx-auto mb-12 px-4">
          <div className="w-full bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-[8px] p-1.5 shadow-2xl flex flex-col xl:flex-row items-stretch xl:items-center min-h-[56px] md:min-h-[64px] transition-all duration-500 hover:border-[#55DEE8]/30">
            {/* Search Input */}
            <div className="flex-[2] relative xl:border-r border-white/5 flex items-center px-4 py-3 md:py-0 min-h-[56px] md:min-h-full">
              <Search className="text-gray-500 mr-3" size={16} />
              <form onSubmit={handleSearch} className="w-full h-full flex items-center">
                <input 
                  className="w-full h-full bg-transparent text-white outline-none text-xs font-bold placeholder-gray-500 tracking-wide" 
                  placeholder="Search by name or specialty..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>

            <div className="flex flex-col sm:flex-row flex-[3] xl:flex-[2.4]">
              {/* Sport Filter */}
              <div className="flex-1 relative sm:border-r border-t sm:border-t-0 border-white/5 flex items-center group">
                <div className="absolute left-3 p-1.5 bg-white/5 rounded-lg pointer-events-none hidden sm:block">
                  <Dribbble size={14} className="text-gray-500" />
                </div>
                <select 
                  className="w-full h-full bg-transparent appearance-none text-[11px] font-bold text-white uppercase tracking-tight pl-4 sm:pl-11 pr-8 py-4 outline-none cursor-pointer"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                >
                  {sports.map(sport => (
                    <option className="bg-[#0a0a0a] text-white" key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Role Filter */}
              <div className="flex-1 relative border-t sm:border-t-0 border-white/5 flex items-center group xl:border-r">
                <div className="absolute left-3 p-1.5 bg-white/5 rounded-lg pointer-events-none hidden sm:block">
                  <Filter size={14} className="text-gray-500" />
                </div>
                <select 
                  className="w-full h-full bg-transparent appearance-none text-[11px] font-bold text-white uppercase tracking-tight pl-4 sm:pl-11 pr-8 py-4 outline-none cursor-pointer"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {roles.map(role => (
                    <option className="bg-[#0a0a0a] text-white" key={role} value={role}>{role === "All" ? "All Roles" : role + "s"}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-[3] xl:flex-[2.4]">
              {/* State Filter */}
              <div className="flex-1 relative sm:border-r border-t xl:border-t-0 border-white/5 flex items-center group">
                <div className="absolute left-3 p-1.5 bg-white/5 rounded-lg pointer-events-none hidden sm:block">
                  <MapPin size={14} className="text-gray-500" />
                </div>
                <select
                  className="w-full h-full bg-transparent appearance-none text-[11px] font-bold text-white uppercase tracking-tight pl-4 sm:pl-11 pr-8 py-4 outline-none cursor-pointer"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  <option className="bg-[#0a0a0a] text-white" value="All">All States</option>
                  {availableStates.map(state => (
                    <option className="bg-[#0a0a0a] text-white" key={state} value={state}>{state}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-4 text-gray-500 pointer-events-none" />
              </div>

              {/* City Filter */}
              <div className="flex-1 relative border-t xl:border-t-0 sm:border-t-0 border-white/5 flex items-center group">
                <div className="absolute left-3 p-1.5 bg-white/5 rounded-lg pointer-events-none hidden sm:block">
                  <MapPin size={14} className="text-gray-500" />
                </div>
                <select
                  className="w-full h-full bg-transparent appearance-none text-[11px] font-bold text-white uppercase tracking-tight pl-4 sm:pl-11 pr-8 py-4 outline-none cursor-pointer disabled:opacity-40"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  disabled={stateFilter === "All" || availableCities.length === 0}
                >
                  <option className="bg-[#0a0a0a] text-white" value="All">All Cities</option>
                  {availableCities.map(city => (
                    <option className="bg-[#0a0a0a] text-white" key={city} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[1/1.3] rounded-[8px] bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-800 rounded-[8px]">
            <Users size={48} className="mx-auto text-neutral-800 mb-4" />
            <h3 className="text-xl font-bold uppercase tracking-widest text-[#BFF367] mb-2">No professionals found</h3>
            <p className="text-white/40 text-xs">Try adjusting your filters or location parameters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {professionals.map((pro) => (
              <div 
                key={pro.id || pro._id} 
                className="group cursor-pointer"
                onClick={() => navigate(`/professionals/${pro.id || pro._id}`)}
              >
                <div className="relative bg-[#0d0d0e] rounded-[8px] p-2.5 border border-white/5 transition-all duration-300 hover:border-[#55DEE8]/30">
                  {/* Image Box */}
                  <div className="relative aspect-[1/1.2] rounded-md overflow-hidden block mb-3 bg-[#161618]">
                    {pro.profilePicture ? (
                      <img 
                        src={pro.profilePicture} 
                        alt={pro.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                        <span className="text-white/20 font-black text-2xl tracking-tighter">
                          {getInitials(pro.name)}
                        </span>
                      </div>
                    )}

                    {/* Rating Badges */}
                    <div className="absolute top-2 right-2">
                      <div className="flex px-1.5 py-0.5 rounded-[4px] bg-black/85 border border-white/10 items-center justify-center text-[#BFF367] text-[9px] font-bold gap-0.5 shadow-lg">
                        <Star size={8} className="fill-[#BFF367]" />
                        {pro.rating?.toFixed(1) || "5.0"}
                      </div>
                    </div>

                    {/* Role Badges */}
                    <div className="absolute top-2 left-2">
                      <div className="px-1.5 py-0.5 rounded-[4px] bg-black/85 border border-white/10 flex items-center justify-center text-[#55DEE8] text-[9px] font-black tracking-wider gap-1">
                        {pro.role === 'umpire' ? <Shield size={8} /> : 
                         pro.role === 'streamer' ? <Video size={8} /> : 
                         pro.role === 'scorer' ? <Activity size={8} /> : 
                         <Trophy size={8} />}
                        <span className="uppercase">{pro.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-1">
                    <div className="flex items-center gap-1.5 mb-1 justify-between">
                      <h3 className="text-white font-bold text-xs truncate capitalize flex-1">
                        {pro.name?.toLowerCase()}
                      </h3>
                      <div className="flex items-center justify-center w-3 h-3 rounded-full bg-blue-500">
                        <Check size={6} strokeWidth={4} className="text-white" />
                      </div>
                    </div>
                    
                    <p className="text-white/40 text-[9px] font-medium truncate mb-2">
                      {pro.businessDetails?.specialization || "Generalist"} • {pro.businessDetails?.experience || "3+ yrs"}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                      <div className="text-[#BFF367] font-black text-sm">
                        ₹{pro.price || "500"}
                        <span className="text-[8px] text-white/30 font-medium">/{pro.role === "coach" ? "hr" : "match"}</span>
                      </div>
                      <button className="px-2.5 py-1 rounded bg-[#BFF367] text-black font-black text-[9px] uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Floating Request Match CTA Button ────────────────────────── */}
      <button
        onClick={() => {
          if (!isLoggedIn) {
            toast.error("Please login to request matchmaking");
            navigate("/login");
            return;
          }
          setShowMatchModal(true);
        }}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black text-xs uppercase tracking-widest shadow-[0_8px_32px_rgba(85,222,232,0.3)] hover:shadow-[0_8px_40px_rgba(85,222,232,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 group"
      >
        <Zap size={16} className="group-hover:animate-pulse" />
        Request Match
      </button>

      {/* ── Match Request Modal ──────────────────────────────────────── */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isCreatingRequest && setShowMatchModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_24px_80px_rgba(85,222,232,0.1)] animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#55DEE8]/10 rounded-lg text-[#55DEE8]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-tight text-white">Request Live Match</h2>
                  <p className="text-[10px] text-white/50">On-demand matching for coaches, umpires & scorers.</p>
                </div>
              </div>
              <button 
                onClick={() => !isCreatingRequest && setShowMatchModal(false)} 
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRequestMatch} className="p-5 sm:p-6 space-y-5">
              {/* Roles Selection — Compact Inline Chips */}
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {["COACH", "UMPIRE", "SCORER", "STREAMER"].map((roleVal) => {
                    const isSelected = selectedRoles.includes(roleVal);
                    return (
                      <button
                        key={roleVal}
                        type="button"
                        onClick={() => handleToggleRole(roleVal)}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          isSelected 
                            ? "bg-[#55DEE8]/15 border border-[#55DEE8] text-[#55DEE8]" 
                            : "bg-white/5 border border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                        {roleVal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Venue Selector */}
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Venue / Location</label>
                <div className="space-y-3">
                  <select
                    value={selectedGroundId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedGroundId(val);
                      if (val !== "custom") {
                        setCustomLocation({ latitude: "", longitude: "", address: "" });
                      } else {
                        setShowLocationSearchModal(true);
                      }
                    }}
                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs font-bold text-white focus:border-[#55DEE8] outline-none"
                  >
                    <option value="">-- Choose Venue/Ground --</option>
                    {grounds.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name} - {g.city}, {g.state}
                      </option>
                    ))}
                    <option value="custom">📍 Search by Location</option>
                  </select>

                  {selectedGroundId === "custom" && (
                    <div className="p-4 rounded-lg bg-black border border-white/5 space-y-3 animate-in fade-in duration-200">
                      {customLocation.latitude && customLocation.longitude ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#55DEE8]/5 border border-[#55DEE8]/15 rounded-lg">
                          <CheckCircle size={14} className="text-[#55DEE8] shrink-0" />
                          <p className="text-[11px] text-white/70 truncate flex-1">{customLocation.address || "Location Selected"}</p>
                          <button
                            type="button"
                            onClick={() => setShowLocationSearchModal(true)}
                            className="text-[9px] font-bold text-[#55DEE8] hover:text-white px-2 py-1 rounded bg-[#55DEE8]/10 hover:bg-[#55DEE8]/20 transition-colors"
                          >
                            CHANGE
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowLocationSearchModal(true)}
                          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                        >
                          <MapPin size={14} className="text-[#55DEE8]" />
                          Open Location Search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule / Timing Selection */}
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Match Schedule</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[9px] text-white/40 font-bold uppercase mb-1 block">Date</span>
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs font-bold text-white focus:border-[#55DEE8] outline-none [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 font-bold uppercase mb-1 block">Start Time</span>
                    <input
                      type="time"
                      value={matchStartTime}
                      onChange={(e) => setMatchStartTime(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs font-bold text-white focus:border-[#55DEE8] outline-none [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 font-bold uppercase mb-1 block">End Time</span>
                    <input
                      type="time"
                      value={matchEndTime}
                      onChange={(e) => setMatchEndTime(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs font-bold text-white focus:border-[#55DEE8] outline-none [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Budget Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black uppercase text-white/50 tracking-wider">Budget (₹)</label>
                  <span className="text-xs font-bold text-[#BFF367]">₹{budget}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-white/40 w-6 shrink-0">Max</span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min={500}
                        max={10000}
                        step={100}
                        value={budget}
                        onChange={(e) => setBudget(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#BFF367] [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(191,243,103,0.4)] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#BFF367] [&::-moz-range-thumb]:border-0"
                      />
                    </div>
                  </div>
                </div>
              </div>



              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCreatingRequest}
                className="w-full py-4 rounded-lg bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isCreatingRequest ? (
                  <>
                    <Loader2 className="animate-spin text-black" size={16} />
                    Initiating Match...
                  </>
                ) : (
                  "⚡ REQUEST PROFESSIONAL NOW"
                )}
              </button>

              {/* Info Footer */}
              <p className="text-[9px] text-white/30 text-center leading-relaxed">
                Your max budget will be reserved from your wallet as escrow. After a match is confirmed, check your{" "}
                <Link to="/booking-history?subTab=professionals" className="text-[#55DEE8] underline hover:text-[#55DEE8]/80">
                  Booking History
                </Link>{" "}
                for OTP verification and status updates.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Location Search Modal */}
      {showLocationSearchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLocationSearchModal(false)} />
          <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#55DEE8]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Search Location</h3>
              </div>
              <button
                onClick={() => setShowLocationSearchModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col min-h-[300px]">
              <div ref={locationSearchRef} className="relative">
                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleDetectLocation();
                    }}
                    className="px-3 py-1.5 bg-[#55DEE8]/10 hover:bg-[#55DEE8]/20 text-[10px] font-bold text-[#55DEE8] border border-[#55DEE8]/20 rounded flex items-center gap-1.5 transition-all"
                  >
                    <Navigation size={12} />
                    Detect My GPS Location
                  </button>
                </div>
                <div className="relative z-10">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search for a place, city, or area..."
                    value={locationQuery}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    onFocus={() => locationResults.length > 0 && setShowLocationDropdown(true)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-10 py-3.5 text-sm text-white outline-none focus:border-[#55DEE8] transition-colors placeholder-white/30 shadow-inner"
                    autoComplete="off"
                    autoFocus
                  />
                  {locationSearching && (
                    <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#55DEE8] animate-spin" />
                  )}
                </div>

                {/* Search Results Dropdown inside Modal */}
                {showLocationDropdown && locationResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden max-h-60 overflow-y-auto">
                    {locationResults.map((place, idx) => {
                      const parts = place.display_name.split(", ");
                      const primary = parts[0];
                      const secondary = parts.slice(1, 3).join(", ");
                      return (
                        <button
                          key={place.place_id || idx}
                          type="button"
                          onClick={() => handleSelectLocation(place)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-b-0 group"
                        >
                          <MapPin size={16} className="text-[#55DEE8]/60 mt-0.5 shrink-0 group-hover:text-[#55DEE8]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate group-hover:text-[#55DEE8] transition-colors">{primary}</p>
                            <p className="text-[11px] text-white/40 truncate mt-0.5">{secondary}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {locationQuery.length >= 3 && !locationSearching && locationResults.length === 0 && (
                  <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-white/50">No locations found. Try a different search term.</p>
                  </div>
                )}
                
                {locationQuery.length < 3 && (
                  <div className="mt-6 flex flex-col items-center justify-center opacity-30 text-center px-6">
                    <MapPin size={32} className="mb-3 text-white" />
                    <p className="text-xs text-white/70">Type at least 3 characters to search for a location anywhere in India.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
