import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import {
  Search, MapPin, Star, Users, User, Shield, Trophy,
  Activity, CheckCircle, Filter, Loader2, Check, X,
  Video, Dribbble, ChevronDown, Sparkles, Navigation, Zap, Calendar, Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchStates, fetchCities } from "@utils/locationService";
import { useSocket } from "@context/SocketContext";
import {
  useCreateMatchRequestMutation,
  useGetUserOnDemandBookingsQuery
} from "../../../redux/api/professionalApi";

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
  const [selectedRole, setSelectedRole] = useState(() => {
    const roleParam = searchParams.get("role");
    if (roleParam) {
      const found = roles.find(r => r.toLowerCase() === roleParam.toLowerCase());
      if (found) return found;
    }
    return "All";
  });
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
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);
  const locationSearchRef = useRef(null);
  const filterMenuRef = useRef(null);
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

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "Select Date";
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return "Select Time";
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(h);
    d.setMinutes(m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
        } catch {
          // Keep the GPS coordinates if reverse geocoding is unavailable.
        }
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
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowMoreFilters(false);
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
        toast.success("Match request placed! We'll notify you once a pro accepts.");
        setSelectedRoles([]);
        setSelectedGroundId("");
        setCustomLocation({ latitude: "", longitude: "", address: "" });
        setShowMatchModal(false);
        refetchBookings();
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to create match request");
    }
  };

  const getInitials = (name) => {
    return name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 px-1 md:px-3 font-sans">

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-2 pt-4 mb-8">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="relative mb-6" ref={filterMenuRef}>
            <div className="flex items-center rounded-full border border-white/10 bg-[#262626] shadow-lg transition-colors focus-within:border-[#BFF367]/70 hover:bg-[#303030]">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={17} />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, specialty, or keyword..."
                  aria-label="Search professionals"
                  className="h-[38px] w-full rounded-l-full bg-transparent pl-11 pr-4 text-[13px] font-semibold text-white outline-none placeholder:text-white/40"
                />
              </div>

              <div className="hidden h-7 w-px bg-white/10 sm:block" />

              <button
                type="button"
                onClick={() => setShowMoreFilters((isOpen) => !isOpen)}
                className="flex h-[38px] shrink-0 items-center justify-center gap-2 rounded-r-full px-3 text-[10px] font-black text-white transition-colors hover:bg-white/5 focus:outline-none sm:px-4"
                aria-expanded={showMoreFilters}
                aria-controls="professionals-more-filters"
              >
                <Filter size={13} className="text-white/70" />
                <span className="hidden sm:inline">More Filters</span>
              </button>
            </div>

            {showMoreFilters && (
              <div
                id="professionals-more-filters"
                className="absolute right-0 top-full z-30 mt-3 w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
              >
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Role Filter</span>
                    <div className="relative">
                      <Filter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/55" size={15} />
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        aria-label="Role filter"
                        className="h-[46px] w-full appearance-none rounded-full border border-white/10 bg-[#262626] pl-11 pr-10 text-[13px] font-bold text-white outline-none transition-colors hover:bg-[#303030] focus:border-[#BFF367]/70"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role === "All" ? "All Roles" : role}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/55" size={16} />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Sport Filter</span>
                    <div className="relative">
                      <Trophy className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/55" size={15} />
                      <select
                        value={selectedSport}
                        onChange={(e) => setSelectedSport(e.target.value)}
                        aria-label="Sports filter"
                        className="h-[46px] w-full appearance-none rounded-full border border-white/10 bg-[#262626] pl-11 pr-10 text-[13px] font-bold text-white outline-none transition-colors hover:bg-[#303030] focus:border-[#BFF367]/70"
                      >
                        {sports.map((sport) => (
                          <option key={sport} value={sport}>
                            {sport === "ALL SPORTS" ? "All Sports" : sport}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/55" size={16} />
                    </div>
                  </label>
                </div>
              </div>
            )}
          </form>

          {/* Ads Space */}
          <div className="w-full h-[180px] sm:h-[240px] rounded-xl overflow-hidden mb-8 relative cursor-pointer group bg-[#111]">
            <img src="/banner-1.png" alt="Advertisement" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?q=80&w=1200&auto=format&fit=crop'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-white font-bold text-2xl sm:text-3xl max-w-[250px] leading-tight">20% Off Coaching Packages</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {professionals.map((pro) => (
              <div
                key={pro.id || pro._id}
                className="group cursor-pointer"
                onClick={() => navigate(`/professionals/${pro.id || pro._id}`)}
              >
                <div className="relative transition-all duration-300 hover:-translate-y-1">
                  {/* Image Box */}
                  <div className="relative aspect-[1.04/1] overflow-hidden bg-[#111]">
                    {pro.profilePicture ? (
                      <img
                        src={pro.profilePicture}
                        alt={pro.name}
                        className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(191,243,103,0.12),transparent_34%),linear-gradient(135deg,#242424,#070707)]">
                        <span className="text-white/18 font-black text-5xl tracking-tighter">
                          {getInitials(pro.name)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />

                    {/* Rating Badges */}
                    <div className="absolute top-3 right-3">
                      <div className="flex px-2.5 py-1 rounded-[3px] bg-black/85 border border-white/10 items-center justify-center text-[#BFF367] text-[10px] font-black gap-1 shadow-lg">
                        <Star size={10} className="fill-[#BFF367]" />
                        {pro.rating?.toFixed(1) || "5.0"}
                      </div>
                    </div>

                    {/* Role Badges */}
                    <div className="absolute bottom-3 left-3">
                      <div className="px-2.5 py-1 rounded-[3px] bg-[#BFF367]/95 flex items-center justify-center text-black text-[9px] font-black tracking-[0.12em] gap-1.5">
                        {pro.role === 'umpire' ? <Shield size={10} /> :
                          pro.role === 'streamer' ? <Video size={10} /> :
                            pro.role === 'scorer' ? <Activity size={10} /> :
                              <Trophy size={10} />}
                        <span className="uppercase">{pro.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 flex-1 truncate text-white font-black text-base uppercase tracking-wide">
                        {pro.name?.toLowerCase()}
                      </h3>
                      <div className="shrink-0 text-right text-[#BFF367] font-black text-xs">
                        ₹{pro.price || "500"}
                        <span className="text-[9px] text-white/40 font-bold">/{pro.role === "coach" ? "hr" : "match"}</span>
                      </div>
                    </div>

                    <p className="mt-2 line-clamp-2 min-h-[2.3em] text-white/40 text-[11px] font-medium leading-relaxed">
                      {pro.businessDetails?.specialization || "Generalist"} • {pro.businessDetails?.experience || "3+ yrs"}
                    </p>

                    <div className="mt-3 border-t border-white/10 pt-3">
                      <button className="flex w-full items-center justify-between border border-white/10 bg-black/30 px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors group-hover:border-[#BFF367]/40 group-hover:text-[#BFF367]">
                        View Profile
                        <span className="text-[#BFF367] transition-transform group-hover:translate-x-1">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* ── Floating Request Match CTA Button ────────────────────────── */}
      {!showMatchModal && (
        <button
          onClick={() => {
            if (!isLoggedIn) {
              toast.error("Please login to request matchmaking");
              navigate("/login");
              return;
            }
            setShowMatchModal(true);
          }}
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black text-xs uppercase tracking-widest shadow-[0_8px_32px_rgba(85,222,232,0.3)] hover:shadow-[0_8px_40px_rgba(85,222,232,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 group"
        >
          <Zap size={16} className="group-hover:animate-pulse" />
          Find Pro's
        </button>
      )}

      {/* ── Match Request Modal ──────────────────────────────────────── */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isCreatingRequest && setShowMatchModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_24px_80px_rgba(191,243,103,0.1)] animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-tight text-white" style={{ fontFamily: "'Open Sans', sans-serif" }}>Request Live Match</h2>
                  <p className="text-[10px] text-white/50" style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}>On-demand matching for coaches, umpires & scorers.</p>
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
            {isCreatingRequest ? (
              <div className="p-10 sm:p-16 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300 min-h-[400px]">
                <div className="relative flex items-center justify-center w-32 h-32">
                  <div className="absolute inset-0 border-[3px] border-[#BFF367] rounded-full animate-ping opacity-75"></div>
                  <div className="absolute inset-2 border-[3px] border-[#BFF367] rounded-full animate-ping opacity-60" style={{ animationDelay: '0.2s' }}></div>
                  <div className="absolute inset-4 border-[3px] border-white/20 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.4s' }}></div>
                  <div className="relative bg-[#0d0d0e] rounded-full p-5 border border-white/10 z-10 shadow-[0_0_40px_rgba(191,243,103,0.4)]">
                    <Search size={40} className="text-[#BFF367] animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest animate-pulse">Finding Pros...</h3>
                  <p className="text-xs sm:text-sm text-white/50 max-w-[280px] mx-auto leading-relaxed">Analyzing your request and matching with the best professionals nearby</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestMatch} className="p-5 sm:p-6 space-y-5">
              {/* Roles Selection — Compact Inline Chips */}
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {["COACH", "UMPIRE", "SCORER", "STREAMER", "CHEERLEADER"].map((roleVal) => {
                    const isSelected = selectedRoles.includes(roleVal);
                    return (
                      <button
                        key={roleVal}
                        type="button"
                        onClick={() => handleToggleRole(roleVal)}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${isSelected
                            ? "bg-[#BFF367]/15 border border-[#BFF367] text-[#BFF367]"
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
                <div className="space-y-3 relative">
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
                    className="w-full bg-black border border-white/10 rounded-lg p-3 pr-24 text-xs font-bold text-white focus:border-[#BFF367] outline-none appearance-none"
                  >
                    <option value="">-- Choose Venue/Ground --</option>
                    {grounds.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name} - {g.city}, {g.state}
                      </option>
                    ))}
                    <option value="custom">
                      {customLocation.address ? `📍 ${customLocation.address.substring(0, 45)}${customLocation.address.length > 45 ? '...' : ''}` : "📍 Search by Location"}
                    </option>
                  </select>

                  <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none">
                    {selectedGroundId === "custom" && customLocation.address ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowLocationSearchModal(true);
                        }}
                        className="text-[9px] font-bold text-[#BFF367] hover:text-white px-3 py-1.5 rounded bg-[#BFF367]/10 hover:bg-[#BFF367]/20 transition-colors pointer-events-auto mr-3"
                      >
                        CHANGE
                      </button>
                    ) : null}
                    <ChevronDown size={16} className="text-white/50" />
                  </div>

                  {selectedGroundId === "custom" && !customLocation.address && (
                    <div className="p-4 rounded-lg bg-black border border-white/5 space-y-3 animate-in fade-in duration-200">
                      <button
                        type="button"
                        onClick={() => setShowLocationSearchModal(true)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <MapPin size={14} className="text-[#BFF367]" />
                        Open Location Search
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule / Timing Selection */}
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">Match Schedule</label>
                <div className="flex items-center bg-[#111] border border-white/10 rounded-lg divide-x divide-white/10 overflow-hidden">
                  <div className="flex-[1.2] p-2.5 relative group hover:bg-white/5 transition-colors">
                    <span className="text-[8px] text-[#BFF367] font-bold uppercase mb-1 flex items-center gap-1">
                      <Calendar size={10} /> Date
                    </span>
                    <div className="text-[11px] sm:text-xs font-bold text-white group-hover:text-[#BFF367] transition-colors truncate">
                      {formatDisplayDate(matchDate)}
                    </div>
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                  <div className="flex-1 p-2.5 relative group hover:bg-white/5 transition-colors">
                    <span className="text-[8px] text-white/40 font-bold uppercase mb-1 flex items-center gap-1">
                      <Clock size={10} /> Start
                    </span>
                    <div className="text-[11px] sm:text-xs font-bold text-white truncate">
                      {formatDisplayTime(matchStartTime)}
                    </div>
                    <input
                      type="time"
                      value={matchStartTime}
                      onChange={(e) => setMatchStartTime(e.target.value)}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                  <div className="flex-1 p-2.5 relative group hover:bg-white/5 transition-colors">
                    <span className="text-[8px] text-white/40 font-bold uppercase mb-1 flex items-center gap-1">
                      <Clock size={10} /> End
                    </span>
                    <div className="text-[11px] sm:text-xs font-bold text-white truncate">
                      {formatDisplayTime(matchEndTime)}
                    </div>
                    <input
                      type="time"
                      value={matchEndTime}
                      onChange={(e) => setMatchEndTime(e.target.value)}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                className="w-full py-4 rounded-lg bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(191,243,103,0.2)] hover:shadow-[0_4px_25px_rgba(191,243,103,0.4)]"
              >
                {isCreatingRequest ? (
                  <>
                    <Loader2 className="animate-spin text-black" size={16} />
                    Initiating Match...
                  </>
                ) : (
                  "⚡ FIND PRO'S"
                )}
              </button>

              {/* Info Footer */}
              <p className="text-[9px] text-white/30 text-center leading-relaxed">
                Your max budget will be reserved from your wallet as escrow. After a match is confirmed, check your{" "}
                <Link to="/booking-history?subTab=professionals" className="text-[#BFF367] underline hover:text-[#BFF367]/80">
                  Booking History
                </Link>{" "}
                for OTP verification and status updates.
              </p>
            </form>
            )}
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
                <MapPin size={16} className="text-[#BFF367]" />
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
                    className="px-3 py-1.5 bg-[#BFF367]/10 hover:bg-[#BFF367]/20 text-[10px] font-bold text-[#BFF367] border border-[#BFF367]/20 rounded flex items-center gap-1.5 transition-all"
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
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-10 py-3.5 text-sm text-white outline-none focus:border-[#BFF367] transition-colors placeholder-white/30 shadow-inner"
                    autoComplete="off"
                    autoFocus
                  />
                  {locationSearching && (
                    <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#BFF367] animate-spin" />
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
                          <MapPin size={16} className="text-[#BFF367]/60 mt-0.5 shrink-0 group-hover:text-[#BFF367]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate group-hover:text-[#BFF367] transition-colors">{primary}</p>
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
