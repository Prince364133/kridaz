import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

      {/* Integrated Search & Filters Bar */}
      <div className="max-w-7xl mx-auto mb-8 px-4">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
          
          {/* Integrated / Separate Search & Filters Bar */}
          <div className="flex flex-col lg:flex-row items-center w-full lg:w-auto gap-4">
            
            {/* MOBILE ONLY: Unified Compact Bar */}
            <div className="flex lg:hidden items-center bg-[#1a1a1a] border border-white/10 rounded-2xl p-1 w-full shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
              {/* Search Field */}
              <div className="flex items-center px-4 py-2 flex-grow border-r border-white/5">
                <Search size={16} className="text-[#55DEE8] mr-2 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-gray-600 font-sans text-white py-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Icon-only Sport Selector - MAX SEARCH SPACE */}
              <div className="flex items-center px-2 py-2 border-r border-white/5 relative group">
                <Dribbble size={14} className="text-[#BFF367] mr-1 flex-shrink-0" />
                <div className="relative flex items-center">
                  <select 
                    className="bg-transparent border-none outline-none text-[0px] cursor-pointer font-heading appearance-none w-4"
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                  >
                    {sports.map(sport => (
                      <option key={sport} value={sport} className="bg-black text-white text-[11px] uppercase">{sport}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="text-white/30 absolute right-[-2px] pointer-events-none" />
                </div>
              </div>

              {/* Icon-only Role Selector - MAX SEARCH SPACE */}
              <div className="flex items-center px-2 py-2 relative group">
                <Filter size={14} className="text-[#55DEE8] mr-1 flex-shrink-0" />
                <div className="relative flex items-center">
                  <select 
                    className="bg-transparent border-none outline-none text-[0px] cursor-pointer font-heading appearance-none w-4"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    {roles.map(role => (
                      <option key={role} value={role} className="bg-black text-white text-[11px] uppercase">{role}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="text-white/30 absolute right-[-2px] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* DESKTOP ONLY: Separate High-Impact Fields */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Sport Selector */}
              <div className="flex items-center px-4 py-3.5 bg-[#1a1a1a] border border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer min-w-[150px]">
                <Dribbble size={14} className="text-[#BFF367] mr-2 flex-shrink-0" />
                <select 
                  className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-wider text-white/90 cursor-pointer font-heading w-full"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                >
                  {sports.map(sport => (
                    <option key={sport} value={sport} className="bg-black text-white uppercase">{sport}</option>
                  ))}
                </select>
              </div>

              {/* Role Selector */}
              <div className="flex items-center px-4 py-3.5 bg-[#1a1a1a] border border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer min-w-[130px]">
                <Filter size={14} className="text-[#55DEE8] mr-2 flex-shrink-0" />
                <select 
                  className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-wider text-white/90 cursor-pointer font-heading w-full"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {roles.map(role => (
                    <option key={role} value={role} className="bg-black text-white">{role}s</option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="flex items-center px-5 py-2 w-[450px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <Search size={18} className="text-[#55DEE8] mr-3 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search by name or specialty..." 
                  className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-gray-600 font-sans text-white py-1.5"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location Group */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3.5">
              <MapPin size={14} className="text-[#55DEE8] mr-2 flex-shrink-0" />
              <select 
                className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-wider text-white/80 pr-4 cursor-pointer font-heading w-full"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
              >
                <option value="All" className="bg-black text-white">ALL STATES</option>
                {availableStates.map(state => (
                  <option key={state} value={state} className="bg-black text-white uppercase">{state}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3.5">
              <MapPin size={14} className="text-[#BFF367] mr-2 flex-shrink-0" />
              <select 
                className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-wider text-white/80 pr-4 cursor-pointer font-heading w-full"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="All" className="bg-black text-white">ALL CITIES</option>
                {availableCities.map(city => (
                  <option key={city} value={city} className="bg-black text-white uppercase">{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[1/1.3] rounded-xl bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-xl">
            <Users size={48} className="mx-auto text-neutral-800 mb-4" />
            <h3 className="text-xl font-heading font-bold text-gray-500 uppercase tracking-widest">No professionals found</h3>
            <p className="text-gray-400 mt-2 font-sans">Try adjusting your filters or location</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {professionals.map((pro) => (
              <div 
                key={pro._id} 
                className="group cursor-pointer"
                onClick={() => navigate(`/professionals/${pro._id}`)}
              >
                <div className="relative bg-[#1a1a1a] rounded-xl p-1.5 border border-white/10 transition-all duration-500 hover:border-[#55DEE8]/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
                  
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
                      <div className="flex px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 items-center justify-center text-[#BFF367] text-[10px] font-bold shadow-lg font-sans gap-1">
                        <Star size={10} className="fill-[#BFF367]" />
                        {pro.rating?.toFixed(1) || "5.0"}
                      </div>
                    </div>

                    {/* Role Badge (Top Left) */}
                    <div className="absolute top-2 left-2 z-20">
                      <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-[10px] font-black tracking-widest gap-1.5 shadow-lg font-sans">
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
                          navigate(`/professionals/${pro._id}`);
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
