import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Search, MapPin, Star, ChevronRight, Users, User, Calendar, Shield, Trophy, Activity, Award, CheckCircle, Filter, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const PRI = "#84CC16";
const BDR = "#2A2A2A";

const sports = ["ALL SPORTS", "CRICKET", "BADMINTON", "FOOTBALL", "TENNIS", "PICKLEBALL"];
const roles = ["All", "Coach", "Umpire"];

export default function FindProfessionals() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("ALL SPORTS");
  const [selectedRole, setSelectedRole] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState(user?.city || "");

  useEffect(() => {
    fetchProfessionals();
  }, [selectedSport, selectedRole, cityFilter]);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const params = {
        sport: selectedSport === "ALL SPORTS" ? "" : selectedSport,
        role: selectedRole === "All" ? "" : selectedRole.toLowerCase(),
        city: cityFilter,
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

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6 md:px-10">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl md:text-7xl lg:text-8xl uppercase leading-none tracking-tighter">
              FIND <span style={{ color: PRI }}>PROFESSIONALS</span>
            </h1>
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] mt-4 text-gray-400">
              Book certified experts for your next session
            </p>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center bg-neutral-900 border border-neutral-800 rounded-full px-6 py-3 w-full md:w-[400px]">
            <Search size={18} className="text-gray-500 mr-3" />
            <input 
              type="text" 
              placeholder="Search by name or specialty..." 
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>
      </div>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-wrap items-center justify-between gap-6">
        {/* Sport Tabs */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {sports.map((sport) => (
            <button 
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-6 py-2.5 rounded-full text-[10px] md:text-xs font-bold tracking-widest transition-all duration-300 border ${
                selectedSport === sport 
                ? "bg-[#84CC16] text-black border-[#84CC16]" 
                : "bg-transparent text-gray-400 border-neutral-800 hover:border-gray-600"
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Role & City Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2">
            <Filter size={14} className="text-gray-500 mr-2" />
            <select 
              className="bg-transparent border-none outline-none text-xs font-bold text-gray-300 pr-4"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {roles.map(role => (
                <option key={role} value={role} className="bg-black text-white">{role}s</option>
              ))}
            </select>
          </div>
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2">
            <MapPin size={14} className="text-[#84CC16] mr-2" />
            <input 
              type="text" 
              placeholder="City" 
              className="bg-transparent border-none outline-none text-xs font-bold text-gray-300 w-24"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#84CC16]" size={40} />
            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Searching for experts...</p>
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-[40px]">
            <Users size={48} className="mx-auto text-neutral-800 mb-4" />
            <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">No professionals found</h3>
            <p className="text-gray-600 mt-2">Try adjusting your filters or location</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {professionals.map((pro) => (
              <div 
                key={pro._id} 
                className="group relative bg-neutral-900/50 rounded-[32px] border border-neutral-800 overflow-hidden hover:border-[#84CC16]/50 transition-all duration-500"
              >
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden">
                  <div className="w-full h-full bg-[#84CC16]/10 flex items-center justify-center overflow-hidden">
                    {pro.profilePicture ? (
                      <img 
                        src={pro.profilePicture} 
                        alt={pro.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ display: pro.profilePicture ? 'none' : 'flex' }}
                    >
                      <span className="text-[#84CC16] font-black text-5xl">
                        {pro.name ? pro.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : '?'}
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-[8px] font-bold tracking-widest text-white uppercase">
                      <Shield size={10} className="text-[#84CC16]" /> {pro.role}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-[#84CC16] rounded-full flex items-center justify-center shadow-lg shadow-[#84CC16]/20">
                      <CheckCircle size={14} className="text-black" />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1">
                    <Star size={12} className="fill-[#84CC16] text-[#84CC16]" />
                    <span className="text-[10px] font-bold text-[#84CC16]">{pro.rating?.toFixed(1) || "5.0"}</span>
                    <span className="text-[10px] font-medium text-gray-400">({pro.numReviews || 0} reviews)</span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <h3 className="font-display text-2xl uppercase leading-none mb-4 group-hover:text-[#84CC16] transition-colors">{pro.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Experience</p>
                      <p className="text-xs font-bold text-white">{pro.businessDetails?.experience || "5+ Years"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Specialty</p>
                      <p className="text-xs font-bold text-white truncate">{pro.businessDetails?.specialization || "Expert Coach"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                    <div>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Starting From</p>
                      <p className="text-lg font-display text-white">₹{pro.price || "500"}<span className="text-[10px] font-sans font-medium text-gray-500">/{pro.role === "coach" ? "hr" : "match"}</span></p>
                    </div>
                    <button 
                      onClick={() => navigate(`/professionals/${pro._id}`)}
                      className="bg-white text-black px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#84CC16] hover:scale-105 transition-all duration-300"
                    >
                      Book Now
                    </button>
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
