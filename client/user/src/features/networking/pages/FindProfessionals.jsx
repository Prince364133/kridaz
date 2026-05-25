import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Search, MapPin, Star, ChevronRight, Users, User, Calendar, Shield, Trophy, Activity, Award, CheckCircle, Filter, Loader2, Check, X, LayoutGrid, Video, Dribbble, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { fetchStates, fetchCities } from "@utils/locationService";

const PRI = "#84CC16";
const BDR = "#2A2A2A";

const sports = ["ALL SPORTS", "CRICKET", "BADMINTON", "FOOTBALL", "TENNIS", "PICKLEBALL"];
const roles = ["All", "Coach", "Umpire", "Scorer", "Streamer"];

export default function FindProfessionals() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("ALL SPORTS");
  const [selectedRole, setSelectedRole] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    loadStates();
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

  const getInitials = (name) => {
    return name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 px-6 md:px-10 font-sans">
      
      {/* Refined Header Section */}
      <div className="max-w-7xl mx-auto pt-6 pb-8 text-center relative px-4">
        <h1 className="font-['Open_Sans'] font-extrabold text-7xl lg:text-[84px] uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] mb-2 leading-[0.9]">
          PRO'S
        </h1>
        <p className="hidden md:block font-sans font-medium text-[20px] text-white/60 uppercase tracking-[0.15em] leading-relaxed whitespace-nowrap overflow-hidden">
          Elite Coaching • Certified Officiating • Expert Training • Efficient Streaming
        </p>
      </div>

      {/* Unified Search & Filters Card */}
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
              <div className="absolute left-3 p-1.5 bg-white/5 rounded-lg group-hover:bg-[#55DEE8]/10 transition-colors pointer-events-none hidden sm:block">
                <Dribbble size={14} className="text-gray-500 group-focus-within:text-[#55DEE8]" />
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
              <ChevronDown size={12} className="absolute right-4 text-gray-500 pointer-events-none group-focus-within:text-[#55DEE8]" />
            </div>

            {/* Role Filter */}
            <div className="flex-1 relative border-t sm:border-t-0 border-white/5 flex items-center group xl:border-r">
              <div className="absolute left-3 p-1.5 bg-white/5 rounded-lg group-hover:bg-[#55DEE8]/10 transition-colors pointer-events-none hidden sm:block">
                <Filter size={14} className="text-gray-500 group-focus-within:text-[#55DEE8]" />
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
              <ChevronDown size={12} className="absolute right-4 text-gray-500 pointer-events-none group-focus-within:text-[#55DEE8]" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-[3] xl:flex-[2.4]">
            {/* State Filter */}
            <div className="flex-1 relative sm:border-r border-t xl:border-t-0 border-white/5 flex items-center group">
              <div className="absolute left-3 p-1.5 bg-white/5 rounded-lg group-hover:bg-[#55DEE8]/10 transition-colors pointer-events-none hidden sm:block">
                <MapPin size={14} className="text-gray-500 group-focus-within:text-[#55DEE8]" />
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
              <ChevronDown size={12} className="absolute right-4 text-gray-500 pointer-events-none group-focus-within:text-[#55DEE8]" />
            </div>

            {/* City Filter */}
            <div className="flex-1 relative border-t xl:border-t-0 sm:border-t-0 border-white/5 flex items-center group">
              <div className="absolute left-3 p-1.5 bg-white/5 rounded-lg group-hover:bg-[#55DEE8]/10 transition-colors pointer-events-none hidden sm:block">
                <MapPin size={14} className="text-gray-500 group-focus-within:text-[#55DEE8]" />
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
              <ChevronDown size={12} className="absolute right-4 text-gray-500 pointer-events-none group-focus-within:text-[#55DEE8]" />
            </div>
          </div>

        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[1/1.3] rounded-[8px] bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-[8px]">
            <Users size={48} className="mx-auto text-neutral-800 mb-4" />
            <h3 className="text-3xl md:text-4xl font-open-sans font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] mb-2">No professionals found</h3>
            <p className="text-[#999999] mt-2 font-inter text-[20px]">Try adjusting your filters or location</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {professionals.map((pro) => (
              <div 
                key={pro._id} 
                className="group cursor-pointer"
                onClick={() => {
                  const returnTo = searchParams.get('returnTo');
                  const baseTo = `/professionals/${pro.id || pro._id}`;
                  navigate(returnTo ? `${baseTo}?returnTo=${encodeURIComponent(returnTo)}` : baseTo);
                }}
              >
                <div className="relative bg-[#1a1a1a] rounded-[8px] p-1.5 border border-white/10 transition-all duration-500 hover:border-[#55DEE8]/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
                  
                  {/* Compact Profile Image Section */}
                  <div className="relative aspect-[1/1.2] rounded-lg overflow-hidden block mb-3">
                    <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                      {pro.profilePicture ? (
                        <img 
                          src={pro.profilePicture} 
                          alt={pro.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="relative z-10 flex items-center justify-center w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]"
                        style={{ display: pro.profilePicture ? 'none' : 'flex' }}
                      >
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] font-black text-3xl tracking-tighter opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                          {getInitials(pro.name)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Top Right Badge - Rating (Global) */}
                    <div className="absolute top-2 right-2 z-20">
                      <div className="flex px-2 py-1 rounded-[6px] bg-black/70 backdrop-blur-md border border-white/10 items-center justify-center text-[#BFF367] text-[10px] font-bold shadow-lg font-sans gap-1">
                        <Star size={10} className="fill-[#BFF367]" />
                        {pro.rating?.toFixed(1) || "5.0"}
                      </div>
                    </div>

                    {/* Role Badge (Top Left) */}
                    <div className="absolute top-2 left-2 z-20">
                      <div className="px-2.5 py-1 rounded-[6px] bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-[10px] font-black tracking-widest gap-1.5 shadow-lg font-sans">
                        {pro.role === 'umpire' ? <Shield size={10} className="text-[#55DEE8]" /> : 
                         pro.role === 'streamer' ? <Video size={10} className="text-[#55DEE8]" /> : 
                         pro.role === 'scorer' ? <Activity size={10} className="text-[#55DEE8]" /> : 
                         <Trophy size={10} className="text-[#55DEE8]" />}
                        <span className="text-[#55DEE8] uppercase">{pro.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="px-2 pb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="text-white font-sans md:font-heading font-black md:font-bold text-[20px] md:text-sm tracking-tighter md:tracking-tight leading-[0.9] md:leading-tight group-hover:text-[#55DEE8] transition-colors line-clamp-1 capitalize">
                        {pro.name?.toLowerCase()}
                      </h3>
                      <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0">
                         <Check size={8} strokeWidth={4} className="text-white" />
                      </div>
                    </div>
                    
                    <p className="text-white/60 text-[10px] md:text-[11px] font-medium leading-relaxed mb-2 md:mb-3 line-clamp-1 font-sans">
                      <span className="capitalize text-white/80">{pro.businessDetails?.specialization?.toLowerCase() || "expert coach"}</span> • {pro.businessDetails?.experience?.toLowerCase() || "5+ years"}
                    </p>

                    {/* Bottom Bar - Pricing (Inter 20) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-[#BFF367] font-sans font-black text-[20px] tracking-tighter leading-none">
                        ₹{pro.price || "500"}
                        <span className="hidden md:inline text-[10px] text-white/40 ml-1 font-medium tracking-normal uppercase">
                          /{pro.role === "coach" ? "hr" : "match"}
                        </span>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const returnTo = searchParams.get('returnTo');
                          const baseTo = `/professionals/${pro.id || pro._id}`;
                          navigate(returnTo ? `${baseTo}?returnTo=${encodeURIComponent(returnTo)}` : baseTo);
                        }}
                        className="px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-sans hover:scale-105 shadow-lg active:scale-95 shrink-0"
                      >
                        BOOK
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
  );
}
