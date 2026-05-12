import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Search, MapPin, Star, ChevronRight, Users, User, Calendar, Shield, Trophy, Activity, Award, CheckCircle, Filter, Loader2, Check, X, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";
import { fetchStates, fetchCities } from "@user/utils/locationService";

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
 <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6 md:px-10">
 {/* Header Section */}
 <div className="max-w-7xl mx-auto mb-12">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="relative">
 <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-[#84CC16] rounded-full shadow-[0_0_25px_rgba(132,204,22,0.5)] hidden md:block"></div>
 <h1 className="font-display text-4xl md:text-7xl lg:text-8xl uppercase leading-none tracking-tighter">
 FIND <span style={{ color: PRI }}>PROFESSIONALS</span>
 </h1>
 <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.4em] mt-4 font-inter">
 Elite Coaching • Certified Officiating • Expert Training
 </p>
 </div>
 
 {/* Search Bar */}
 <form onSubmit={handleSearch} className="flex items-center bg-[#121212] border border-white/5 rounded-full px-6 py-4 w-full md:w-[400px] focus-within:border-[#84CC16]/30 transition-all">
 <Search size={18} className="text-gray-500 mr-3" />
 <input 
 type="text" 
 placeholder="Search by name or specialty..." 
 className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-gray-600"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </form>
 </div>
 </div>

 {/* Filters Section */}
 <div className="max-w-7xl mx-auto mb-10 flex flex-wrap items-center justify-between gap-6">
 {/* Sport Tabs */}
 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
 {sports.map((sport) => (
 <button 
 key={sport}
 onClick={() => setSelectedSport(sport)}
 className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
 selectedSport === sport 
 ? "bg-[#84CC16] text-black border-[#84CC16] shadow-[0_0_15px_rgba(132,204,22,0.3)]" 
 : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white"
 }`}
 >
 {sport}
 </button>
 ))}
 </div>

 {/* Role, State & City Filters */}
 <div className="flex flex-wrap items-center gap-4">
 <div className="flex items-center bg-[#121212] border border-white/5 rounded-full px-4 py-2.5">
 <Filter size={14} className="text-gray-500 mr-2" />
 <select 
 className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white/60 pr-4 cursor-pointer"
 value={selectedRole}
 onChange={(e) => setSelectedRole(e.target.value)}
 >
 {roles.map(role => (
 <option key={role} value={role} className="bg-black text-white">{role}s</option>
 ))}
 </select>
 </div>
 <div className="flex items-center bg-[#121212] border border-white/5 rounded-full px-4 py-2.5">
 <MapPin size={14} className="text-[#84CC16] mr-2" />
 <select 
 className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white/60 pr-4 cursor-pointer"
 value={stateFilter}
 onChange={(e) => setStateFilter(e.target.value)}
 >
 <option value="All" className="bg-black text-white">ALL STATES</option>
 {availableStates.map(state => (
 <option key={state} value={state} className="bg-black text-white uppercase">{state}</option>
 ))}
 </select>
 </div>
 <div className="flex items-center bg-[#121212] border border-white/5 rounded-full px-4 py-2.5">
 <MapPin size={14} className="text-[#84CC16] mr-2" />
 <select 
 className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white/60 pr-4 cursor-pointer"
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

 {/* Grid Content */}
 <div className="max-w-7xl mx-auto">
 {loading ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
 {[...Array(12)].map((_, i) => (
 <div key={i} className="aspect-[1/1.3] rounded-[20px] bg-white/5 border border-white/5 animate-pulse" />
 ))}
 </div>
 ) : professionals.length === 0 ? (
 <div className="text-center py-20 border-2 border-dashed border-neutral-900 rounded-[40px]">
 <Users size={48} className="mx-auto text-neutral-800 mb-4" />
 <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">No professionals found</h3>
 <p className="text-gray-600 mt-2">Try adjusting your filters or location</p>
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
 {professionals.map((pro) => (
 <div 
 key={pro._id} 
 className="group cursor-pointer"
 onClick={() => navigate(`/professionals/${pro._id}`)}
 >
 <div className="relative bg-[#121212] rounded-[20px] p-1.5 border border-white/5 transition-all duration-500 hover:border-[#84CC16]/20 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
 
 {/* Compact Profile Image Section */}
 <div className="relative aspect-[1/1.2] rounded-[15px] overflow-hidden block mb-2.5">
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
 <span className="text-[#84CC16] font-black text-3xl tracking-tighter opacity-20 group-hover:opacity-40 transition-opacity duration-500">
 {getInitials(pro.name)}
 </span>
 </div>
 </div>
 
 {/* Price Badge */}
 <div className="absolute top-2 right-2 z-20">
 <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#84CC16] text-[8px] font-bold shadow-lg">
 ₹{pro.price || "500"}/{pro.role === "coach" ? "hr" : "match"}
 </div>
 </div>

 {/* Role Badge */}
 <div className="absolute top-2 left-2 z-20">
 <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-[8px] font-black tracking-widest gap-1 shadow-lg">
 {pro.role === 'umpire' ? <Shield size={8} className="text-[#84CC16]" /> : <Trophy size={8} className="text-[#84CC16]" />}
 <span className="text-[#84CC16]">{pro.role?.toUpperCase()}</span>
 </div>
 </div>
 </div>

 {/* Content Section */}
 <div className="px-1.5 pb-1">
 <div className="flex items-center gap-1 mb-0.5">
 <h3 className="text-white font-bold text-[13px] tracking-tight group-hover:text-[#84CC16] transition-colors line-clamp-1 font-open-sans capitalize">
 {pro.name?.toLowerCase()}
 </h3>
 <div className="flex items-center justify-center w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0">
 <Check size={7} strokeWidth={4} className="text-white" />
 </div>
 </div>
 
 <p className="text-white/40 text-[9px] font-medium leading-tight mb-3 line-clamp-1">
 <span className="capitalize">{pro.businessDetails?.specialization?.toLowerCase() || "expert coach"}</span> • {pro.businessDetails?.experience?.toLowerCase() || "5+ years"}
 </p>

 {/* Bottom Bar */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1 text-white/80">
 <Star size={12} className="text-[#84CC16] fill-[#84CC16]" />
 <span className="text-[10px] font-bold">{pro.rating?.toFixed(1) || "5.0"}</span>
 </div>
 <div className="flex items-center text-white/30">
 <span className="text-[9px] font-medium">
 ({pro.numReviews || 0})
 </span>
 </div>
 </div>

 <button 
 onClick={(e) => {
 e.stopPropagation();
 navigate(`/professionals/${pro._id}`);
 }}
 className="px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-300 bg-[#222] border border-white/5 text-white hover:bg-white hover:text-black shadow-lg"
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
