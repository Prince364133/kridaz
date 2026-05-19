import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { login } from '@redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@hooks/useAxiosInstance';
import { toast } from 'react-hot-toast';
import { 
 Users, MapPin, Calendar, Clock, 
 Search, Filter, Coins, ChevronRight,
 UserCheck, Trophy, Info, Zap, ShieldCheck, X, Share2
} from 'lucide-react';
import { fetchStates, fetchCities } from '@utils/locationService';
import CoinAnimation from '@components/CoinAnimation';
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const JoinGames = () => {
 const navigate = useNavigate();
 const { gateInteraction } = useLoginOnDemand();
 const { isAuthenticated } = useSelector((state) => state.auth);
 const [games, setGames] = useState([]);
 const [loading, setLoading] = useState(true);
 const [selectedGame, setSelectedGame] = useState(null);
 const [showCoinAnim, setShowCoinAnim] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [joiningSlot, setJoiningSlot] = useState(null);
 const [search, setSearch] = useState('');
 const [sportFilter, setSportFilter] = useState('All Sports');
 const [liveFilter, setLiveFilter] = useState(false);
 const [userLocation, setUserLocation] = useState({ city: '', state: '' });

 // Deep-link / Invite state
 const [inviteData, setInviteData] = useState(null);
 const [showInvitePopup, setShowInvitePopup] = useState(false);
 const [verifyingInvite, setVerifyingInvite] = useState(false);

 // Location filter state
 const [states, setStates] = useState([]);
 const [cities, setCities] = useState([]);
 const [selectedState, setSelectedState] = useState('');
 const [selectedCity, setSelectedCity] = useState('');
 const [loadingStates, setLoadingStates] = useState(false);
 const [loadingCities, setLoadingCities] = useState(false);

 const fetchGames = async (city = '', state = '', sport = 'All Sports') => {
 try {
 setLoading(true);
 let url = `${import.meta.env.VITE_API_URL}/api/hosted-game/list?`;
 if (city) url += `city=${city}&`;
 if (state) url += `state=${state}&`;
 if (sport !== 'All Sports') url += `gameType=${sport}&`;
 
 const res = await axiosInstance.get(url);
 setGames(res.data.games || []);
 } catch (err) {
 toast.error("Failed to fetch games");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 const fetchUserAndGames = async () => {
 try {
 const userRes = await axiosInstance.get(`/api/user/auth/getMe`);
 const user = userRes.data.user;
 if (user?.city || user?.state) {
 setUserLocation({ city: user.city || '', state: user.state || '' });
 setSelectedState(user.state || '');
 setSelectedCity(user.city || '');
 fetchGames(user.city, user.state);
 } else {
 fetchGames();
 }
 } catch (err) {
 fetchGames();
 }
 };
 fetchUserAndGames();

 // Load all Indian states for the dropdown
 const loadStates = async () => {
 setLoadingStates(true);
 const data = await fetchStates();
 setStates(data);
 setLoadingStates(false);
 };
 loadStates();

 // Check for deep-link inviteToken
 const params = new URLSearchParams(window.location.search);
 const token = params.get('inviteToken');
 if (token) {
 handleVerifyInvite(token);
 }
 }, []);

 const handleVerifyInvite = async (token) => {
 try {
 setVerifyingInvite(true);
 const res = await axiosInstance.get(`/api/hosted-game/verify-invite?token=${token}`);
 if (res.data.success) {
 setInviteData({
 ...res.data,
 token
 });
 setShowInvitePopup(true);
 }
 } catch (err) {
 console.error("Invite verification failed:", err);
 toast.error(err.response?.data?.message || "Invalid or expired invite link");
 } finally {
 setVerifyingInvite(false);
 }
 };

 const dispatch = useDispatch();

 const handleClaimSlot = async () => {
 if (!inviteData) return;
 
 gateInteraction(async () => {
 try {
 const res = await axiosInstance.post(`/api/hosted-game/claim-slot`, {
 token: inviteData.token
 });
 if (res.data.success) {
 setShowInvitePopup(false);

 // If the backend upgraded the user's role (e.g. to LIMITED_UMPIRE),
 // refresh Redux auth so navigation guards update immediately.
 if (res.data.newToken && res.data.updatedRole) {
 dispatch(login({
 token: res.data.newToken,
 role: res.data.updatedRole,
 }));
 localStorage.setItem("authToken", res.data.newToken);
 toast.success("You've been assigned as Umpire! Redirecting to your dashboard...");
 setTimeout(() => navigate("/umpire/dashboard"), 1200);
 } else {
 toast.success("Slot claimed successfully!");
 fetchGames(selectedCity, selectedState, sportFilter);
 }
 }
 } catch (err) {
 toast.error(err.response?.data?.message || "Failed to claim slot");
 }
 }, {
 title: "Claim Your Invited Slot",
 message: "Welcome to the game! Sign in to secure your reserved spot."
 });
 };

 // When a state is selected, load its cities
 useEffect(() => {
 if (!selectedState) { setCities([]); return; }
 const loadCities = async () => {
 setLoadingCities(true);
 const data = await fetchCities(selectedState);
 setCities(data);
 setLoadingCities(false);
 };
 loadCities();
 }, [selectedState]);

 const handleStateChange = (state) => {
 setSelectedState(state);
 setSelectedCity('');
 fetchGames('', state, sportFilter);
 };

 const handleCityChange = (city) => {
 setSelectedCity(city);
 fetchGames(city, selectedState, sportFilter);
 };

 const handleClearLocation = () => {
 setSelectedState('');
 setSelectedCity('');
 setCities([]);
 fetchGames('', '', sportFilter);
 };

 const handleSearch = (e) => setSearch(e.target.value);

 const filteredGames = games.filter(game => {
 if (liveFilter && !game.isLive) return false;
 return game.gameType.toLowerCase().includes(search.toLowerCase()) ||
 (game.ground?.name || '').toLowerCase().includes(search.toLowerCase()) ||
 game.city?.toLowerCase().includes(search.toLowerCase()) ||
 (game.gameMode === 'QUICK' ? 'quick game' : 'professional game').includes(search.toLowerCase())
 });

 const handleJoinGame = async () => {
 if (!joiningSlot) return;
 gateInteraction(async () => {
 try {
 const res = await axiosInstance.post(`/api/hosted-game/join`, {
 gameId: selectedGame._id,
 team: joiningSlot.team,
 slotIndex: joiningSlot.index,
 role: joiningSlot.role
 });
 if (res.data.success) setShowCoinAnim(true);
 } catch (err) {
 const errorMsg = err.response?.data?.message || "Failed to join game";
 toast.error(errorMsg);
 if (errorMsg.toLowerCase().includes("insufficient coins") || errorMsg.toLowerCase().includes("insufficient wallet balance")) {
 navigate("/wallet");
 }
 }
 }, { 
 title: "Join the Match", 
 message: "Ready to hit the field? Sign in to secure your spot and start playing with the community." 
 });
 };

 return (
 <div className="min-h-screen bg-[#000000] text-white p-6 lg:p-10 pb-24 relative overflow-hidden font-inter">
 {/* Dynamic Background Glow */}
 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#55DEE8]/5 blur-[150px] pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#55DEE8]/5 blur-[150px] pointer-events-none" />

 <div className="max-w-7xl mx-auto relative z-10">
 {/* Header Section */}
 <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-[#2D2D2D] pb-10 mb-12">
 <div className="relative">
 <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-[#55DEE8] rounded-full shadow-[0_0_25px_rgba(204,255,0,0.5)] hidden md:block"></div>
 <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4 font-open-sans">
 Join <span className="text-[#55DEE8]">Games</span>
 </h1>
 <p className="text-sm md:text-xl font-medium text-[#999999] tracking-tight max-w-xl">
 Competitive Matchmaking GÇó Discover & participate in matches hosted by the elite sports community.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-4">
 <button 
 onClick={() => gateInteraction(() => navigate('/my-hosted-games'))}
 className="px-6 py-3.5 bg-[#121212] border border-[#2D2D2D] text-white font-black text-[11px] uppercase tracking-widest rounded-[12px] flex items-center gap-2.5 hover:bg-white hover:text-black transition-all duration-500 shadow-xl"
 >
 <Users size={16} /> My Ledger
 </button>
 <button 
 onClick={() => gateInteraction(() => navigate('/host-game'))}
 className="px-6 py-3.5 bg-[#55DEE8] text-black font-black text-[11px] uppercase tracking-widest rounded-[12px] flex items-center gap-2.5 hover:scale-105 transition-all duration-500 shadow-[0_0_30px_rgba(204,255,0,0.2)]"
 >
 <Trophy size={16} /> Host Match
 </button>
 </div>
 </div>


 {/* Search & Filters */}
 <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
 {/* Search */}
 <div className="md:col-span-4 flex gap-2">
 <div className="relative flex-1 group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8] transition-colors" size={20} />
 <input 
 className="w-full bg-[#0d0d0d] border border-white/10 rounded-[12px] py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#55DEE8]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" 
 placeholder="Search by sport, venue..." 
 value={search}
 onChange={handleSearch}
 onKeyDown={(e) => e.key === 'Enter' && fetchGames(selectedCity, selectedState, sportFilter)}
 />
 </div>
 <button 
 onClick={() => fetchGames(selectedCity, selectedState, sportFilter)}
 className="px-6 bg-[#55DEE8] text-black font-black text-[11px] uppercase tracking-widest rounded-[12px] hover:scale-105 transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)]"
 >
 Search
 </button>
 
 <button
 onClick={() => setLiveFilter(!liveFilter)}
 className={`flex items-center gap-2 px-4 py-4 rounded-[12px] border transition-all ${
 liveFilter 
 ? 'bg-red-600/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
 : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
 }`}
 title="Show only live matches"
 >
 <div className={`w-2 h-2 rounded-full ${liveFilter ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
 <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Live Now</span>
 </button>
 </div>

 {/* Sport Filter */}
 <div className="md:col-span-2 relative group">
 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8] transition-colors" size={18} />
 <select 
 className="w-full bg-[#0d0d0d] border border-white/10 rounded-[12px] py-4 pl-12 pr-4 appearance-none text-sm text-white focus:outline-none focus:border-[#55DEE8]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
 value={sportFilter}
 onChange={(e) => {
 setSportFilter(e.target.value);
 fetchGames(selectedCity, selectedState, e.target.value);
 }}
 >
 <option>All Sports</option>
 <option>Cricket</option>
 <option>Football</option>
 <option>Badminton</option>
 <option>Basketball</option>
 <option>Tennis</option>
 <option>Volleyball</option>
 </select>
 </div>

 {/* State Dropdown */}
 <div className="md:col-span-3 relative group">
 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8] transition-colors pointer-events-none" size={16} />
 <select
 className="w-full bg-[#0d0d0d] border border-white/10 rounded-[12px] py-4 pl-10 pr-4 appearance-none text-sm text-white focus:outline-none focus:border-[#55DEE8]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] disabled:opacity-40"
 value={selectedState}
 onChange={(e) => handleStateChange(e.target.value)}
 disabled={loadingStates}
 >
 <option value="">{loadingStates ? 'Loading states...' : 'All States'}</option>
 {states.map(s => (
 <option key={s} value={s}>{s}</option>
 ))}
 </select>
 </div>

 {/* City Dropdown */}
 <div className="md:col-span-2 relative group">
 <select
 className="w-full bg-[#0d0d0d] border border-white/10 rounded-[12px] py-4 px-4 appearance-none text-sm text-white focus:outline-none focus:border-[#55DEE8]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] disabled:opacity-40"
 value={selectedCity}
 onChange={(e) => handleCityChange(e.target.value)}
 disabled={!selectedState || loadingCities}
 >
 <option value="">{loadingCities ? 'Loading cities...' : !selectedState ? 'Select state first' : 'All Cities'}</option>
 {cities.map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>

 {/* Clear / Active Location Indicator */}
 <div className="md:col-span-1 flex items-center">
 {selectedState ? (
 <button
 onClick={handleClearLocation}
 className="w-full flex items-center justify-center gap-1.5 py-4 bg-[#55DEE8]/10 border border-[#55DEE8]/20 hover:bg-red-500/10 hover:border-red-500/30 text-[#55DEE8] hover:text-red-400 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all"
 title="Clear location filter"
 >
 <X size={14} />
 </button>
 ) : (
 <div className="w-full flex items-center justify-center gap-1 py-4 bg-[#55DEE8]/5 border border-[#55DEE8]/10 rounded-[12px]">
 <MapPin size={14} className="text-[#55DEE8]" />
 <span className="text-[9px] font-black text-[#55DEE8]/50 uppercase tracking-widest truncate">
 {userLocation.city || 'GLOBAL'}
 </span>
 </div>
 )}
 </div>
 </div>

 {/* Game List */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
 {loading ? (
 [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
 <div key={i} className="h-[420px] bg-[#0d0d0d] rounded-[24px] border border-[#2D2D2D] animate-pulse" />
 ))
 ) : filteredGames.length === 0 ? (
 <div className="col-span-full py-32 text-center bg-[#0d0d0d] rounded-[32px] border border-[#2D2D2D] relative overflow-hidden">
 <div className="absolute inset-0 bg-[#55DEE8]/5 blur-[100px]" />
 <div className="relative z-10 space-y-6">
 <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto shadow-2xl">
 <Info className="text-[#55DEE8]/40" size={48} />
 </div>
 <div className="space-y-2">
 <h3 className="text-3xl font-black text-white uppercase tracking-tighter">No Active Matches</h3>
 <p className="text-[#999999] max-w-md mx-auto">
 The sports ledger is currently empty. Be the first to host a match in this region.
 </p>
 </div>
 <button 
 onClick={() => navigate('/host-game')}
 className="px-10 py-4 bg-[#55DEE8] text-black font-black text-xs uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:scale-105 transition-all"
 >
 Create Match
 </button>
 </div>
 </div>
 ) : (
 filteredGames.map(game => (
 <motion.div
 key={game._id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 whileHover={{ y: -6, scale: 1.01 }}
 transition={{ duration: 0.3 }}
 className="group relative rounded-[32px] overflow-hidden cursor-pointer bg-[#0A0A0A] border border-white/5 hover:border-[#55DEE8]/30 transition-all duration-500"
 style={{ minHeight: '480px' }}
 onClick={() => setSelectedGame(game)}
 >
 {/* GöÇGöÇ Background: Split Team Images (Top Half) GöÇGöÇ */}
 <div className="absolute inset-x-0 top-0 h-[48%] z-0 overflow-hidden">
 {/* Team A GÇö Left Half */}
 <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
 <img
 src={game.teams?.teamA?.image || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80"}
 alt="Team A"
 className="w-full h-full object-cover object-right scale-110 group-hover:scale-125 transition-transform duration-700"
 />
 </div>
 {/* Team B GÇö Right Half */}
 <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
 <img
 src={game.teams?.teamB?.image || "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"}
 alt="Team B"
 className="w-full h-full object-cover object-left scale-110 group-hover:scale-125 transition-transform duration-700"
 />
 </div>

 {/* Center vignette GÇö vintage blend where images meet */}
 <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-28 bg-gradient-to-r from-transparent via-black to-transparent opacity-90" />
 {/* Edge vignettes (left + right) */}
 <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/70 to-transparent" />
 <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/70 to-transparent" />

 {/* Top-to-bottom dark overlay for readability */}
 <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/92" />
 {/* Bottom neon-green tinted overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-[#0a1500]/85 via-transparent to-transparent" />
 </div>


 {/* GöÇGöÇ Content GöÇGöÇ */}
 <div className="relative z-10 flex flex-col h-full p-5" style={{ minHeight: '480px' }}>

 {/* Top Row: Sport badge + Coins */}
 <div className="flex items-start justify-between mb-auto">
 <div className="flex flex-col gap-1.5">
 <div className="flex gap-2">
 <div className="px-4 py-1.5 bg-[#55DEE8]/20 border border-[#55DEE8]/40 rounded-full backdrop-blur-sm inline-flex">
 <span className="text-[10px] font-black text-[#55DEE8] uppercase tracking-widest">{game.gameType}</span>
 </div>
 {game.gameMode === 'QUICK' && (
 <div className="px-4 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-full backdrop-blur-sm inline-flex">
 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">QUICK</span>
 </div>
 )}
 {game.scoringStatus === 'IN_PROGRESS' && (
 <div className="px-4 py-1.5 bg-red-600/20 border border-red-600/40 rounded-full backdrop-blur-sm inline-flex items-center gap-1.5">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
 <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">LIVE</span>
 </div>
 )}
 </div>
 <div className="flex items-center gap-1.5">

 <button
 onClick={(e) => { 
 e.stopPropagation();
 const shareUrl = `${window.location.origin}/join-games?gameId=${game._id}`;
 const shareData = {
 title: 'Kridaz Match Invite',
 text: `Join this ${game.gameType} match hosted by ${game.host?.name || 'a player'}!`,
 url: shareUrl
 };

 if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
 navigator.share(shareData).catch(() => {
 navigator.clipboard.writeText(shareUrl);
 toast.success('Link copied to clipboard!');
 });
 } else {
 navigator.clipboard.writeText(shareUrl);
 toast.success('Link copied to clipboard!');
 }
 }}
 className="p-1.5 bg-black/50 border border-white/15 hover:border-[#55DEE8]/40 rounded-full flex items-center justify-center transition-all"
 title="Share Match"
 >
 <Share2 size={10} className="text-[#55DEE8]/70" />
 </button>
 </div>
 </div>
 <div className="flex gap-2">
 {game.isLive && (
 <div className="flex items-center gap-1.5 bg-red-600/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-500/50">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
 <span className="text-xs font-black text-red-500 uppercase tracking-widest">LIVE</span>
 </div>
 )}
 <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
 <Coins size={13} className="text-[#55DEE8]" />
 <span className="text-sm font-black text-white">{game.perPlayerCharge || 'FREE'}</span>
 </div>
 </div>
 </div>

 {/* Center: Rivalry + Team Names */}
 <div className="py-6">
 {/* Divider label */}
 <div className="flex items-center gap-3 mb-3">
 <div className="h-px flex-1 bg-[#55DEE8]/30" />
 <div className="flex items-center gap-2">
 <span className="text-[9px] font-black text-[#55DEE8]/70 uppercase tracking-[0.4em] flex items-center gap-1">
 <Zap size={10} className="text-[#55DEE8]" /> {game.gameMode === 'QUICK' ? 'Casual Pool' : 'Rivalry Ledger'}
 </span>
 {game.isLive && (
 <div className="px-2 py-0.5 bg-red-600 rounded-md flex items-center gap-1.5 animate-pulse">
 <div className="w-1 h-1 rounded-full bg-white" />
 <span className="text-[7px] font-black text-white uppercase tracking-widest">LIVE</span>
 </div>
 )}
 </div>
 <div className="h-px flex-1 bg-[#55DEE8]/30" />
 </div>

 {/* Team Names or Game Title */}
 <h3 className="flex items-center flex-wrap gap-x-3 font-black uppercase leading-none tracking-tighter text-white font-open-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)' }}>
 {game.gameMode === 'QUICK' ? (
 <>Casual <span className="text-[#55DEE8]">{game.gameType}</span> Match</>
 ) : (
 <div className="flex items-baseline gap-2 flex-wrap">
 <span>{game.teams?.teamA?.name}</span>
 <span className="text-[#55DEE8] text-sm">VS</span>
 <span>{game.teams?.teamB?.name}</span>
 </div>
 )}
 </h3>

 </div>

 {/* Bottom Panel */}
 <div className="bg-black/60 backdrop-blur-md rounded-[16px] border border-white/10 p-4 space-y-4 mt-auto">

 {/* Date + Time boxes */}
 {/* Consolidated Date & Time */}
 <div className="bg-black/50 border border-[#55DEE8]/20 rounded-[12px] p-3 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-[#55DEE8]/10 border border-[#55DEE8]/20 flex items-center justify-center">
 <Calendar size={14} className="text-[#55DEE8]" />
 </div>
 <div>
 <p className="text-[7px] font-black text-[#55DEE8]/60 uppercase tracking-widest mb-0.5">Start Date & Time</p>
 <p className="text-[13px] font-black text-white">
 {new Date(game.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} GÇó {game.time}
 </p>
 </div>
 </div>
 <Clock size={14} className="text-[#55DEE8]/40" />
 </div>

 {/* Slots */}
 <div className="flex items-center justify-between pt-1 border-t border-white/5">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-full bg-[#55DEE8]/10 border border-[#55DEE8]/20 flex items-center justify-center">
 <Users size={14} className="text-[#55DEE8]" />
 </div>
 <div>
 <p className="text-[11px] font-black text-white leading-none">
 {game.gameMode === 'QUICK' 
 ? game.quickSlots.filter(s => s.status === 'OPEN').length 
 : (game.teams?.teamA?.slots?.filter(s => s.status === 'OPEN').length || 0) + (game.teams?.teamB?.slots?.filter(s => s.status === 'OPEN').length || 0)
 } OPEN
 </p>
 <p className="text-[7px] font-bold text-[#55DEE8]/50 uppercase tracking-widest mt-0.5">Available Capacity</p>
 </div>
 </div>
 <div className="flex -space-x-1.5">
 {[...Array(4)].map((_, i) => (
 <div key={i} className="w-6 h-6 rounded-full border border-[#0d0d0d] bg-[#55DEE8]/10 flex items-center justify-center shadow-lg">
 <Users size={10} className="text-[#55DEE8]/50" />
 </div>
 ))}
 </div>
 </div>

 {/* Venue & ID Row */}
 <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
 <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-tight truncate max-w-[150px]">
 <MapPin size={10} className="text-[#55DEE8] shrink-0" />
 <span className="truncate">{game.ground?.name || 'Self-Arranged Venue'}</span>
 </div>
 <button
 onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(game.shortId || game._id); toast.success('Game ID copied!'); }}
 className="text-[8px] font-black text-white/30 hover:text-[#55DEE8] uppercase tracking-widest transition-colors flex items-center gap-1"
 >
 <Info size={8} /> ID: {game.shortId || game._id.slice(-6).toUpperCase()}
 </button>
 </div>

 {/* Host + Join */}
 <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-full border border-[#55DEE8]/20 bg-[#1A1A1A] flex items-center justify-center overflow-hidden shrink-0">
 {game.host?.profilePicture ? (
 <img src={game.host.profilePicture} alt="" className="w-full h-full object-cover" />
 ) : (
 <span className="text-[#55DEE8] font-black text-[11px]">
 {game.host?.name ? game.host.name[0].toUpperCase() : '?'}
 </span>
 )}
 </div>
 <div>
 <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-0.5">Commanded By</p>
 <p className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[90px]">
 {game.host?.name || 'Unknown'}
 </p>
 </div>
 </div>

 <button 
 onClick={(e) => {
 if (game.isLive) {
 e.stopPropagation();
 navigate(`/live-score/${game._id}`);
 } else {
 setSelectedGame(game);
 }
 }}
 className={`flex items-center gap-2 px-5 py-3 rounded-[12px] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${
 game.isLive 
 ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]' 
 : 'bg-[#55DEE8] text-black shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:shadow-[0_0_30px_rgba(204,255,0,0.6)]'
 }`}>
 {game.isLive ? 'WATCH' : 'JOIN'} <ChevronRight size={14} strokeWidth={3} />
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 ))
 )}
 </div>
 </div>

 {/* Game Details Modal */}
 <AnimatePresence>
 {selectedGame && (
 <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 lg:p-10 overflow-hidden">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setSelectedGame(null)}
 className="absolute inset-0 bg-black/90 backdrop-blur-xl"
 />
 <motion.div
 initial={{ y: "100%", opacity: 0, scale: 0.95 }}
 animate={{ y: 0, opacity: 1, scale: 1 }}
 exit={{ y: "100%", opacity: 0, scale: 0.95 }}
 className="relative bg-[#000000] border border-[#2D2D2D] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] custom-scrollbar"
 >
 <div className="sticky top-0 z-20 bg-black/50 backdrop-blur-md border-b border-[#2D2D2D] px-8 py-6 flex items-center justify-between">
 <div className="flex items-center gap-4 flex-wrap">
 <div className="px-4 py-1.5 bg-[#55DEE8] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
 {selectedGame.gameType} Elite
 </div>
 {selectedGame.shortId && (
 <button
 onClick={() => { navigator.clipboard?.writeText(selectedGame.shortId); toast.success('Game ID copied!'); }}
 className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-[#55DEE8]/40 rounded-full flex items-center gap-1.5 transition-all"
 title="Click to copy Game ID"
 >
 <Info size={11} className="text-[#55DEE8]" />
 <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">ID: {selectedGame.shortId}</span>
 </button>
 )}
 <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter font-open-sans">Match Intelligence</h2>
 </div>
 <button onClick={() => setSelectedGame(null)} className="w-10 h-10 bg-[#121212] border border-[#2D2D2D] rounded-full flex items-center justify-center text-[#55DEE8] hover:bg-[#55DEE8] hover:text-black transition-all">G£ò</button>
 </div>

 <div className="p-8 lg:p-12">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
 {[
 { icon: Calendar, label: "Execution Date", value: new Date(selectedGame.date).toLocaleDateString() },
 { icon: Clock, label: "Precise Time", value: selectedGame.time },
 { icon: Coins, label: "Network Fee", value: selectedGame.perPlayerCharge || 'Free' },
 { icon: ShieldCheck, label: "Security / Umpire", value: selectedGame.umpire ? 'Verified' : 'Unmanaged' }
 ].map((stat, i) => (
 <div key={i} className="bg-[#0d0d0d] border border-[#2D2D2D] p-5 rounded-[20px] text-center group hover:border-[#55DEE8]/40 transition-all">
 <stat.icon className="mx-auto mb-3 text-[#55DEE8]" size={24} />
 <p className="text-[8px] text-[#878C9F] uppercase font-black tracking-widest mb-1">{stat.label}</p>
 <p className="text-sm font-black text-white uppercase">{stat.value}</p>
 </div>
 ))}
 </div>

 {selectedGame.gameMode === 'QUICK' ? (
 <div className="space-y-6">
 <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-4">
 <h3 className="text-2xl font-black text-white uppercase tracking-tighter font-open-sans">
 Casual Match Pool
 </h3>
 <span className="text-[10px] font-black text-[#55DEE8] uppercase tracking-widest">{selectedGame.quickSlots.length} Total Slots</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {selectedGame.quickSlots.map((slot, sIdx) => (
 <button
 key={sIdx}
 disabled={slot.status !== 'OPEN'}
 onClick={() => {
 if (!isAuthenticated) {
 toast.error("Please login to join this game");
 navigate('/login');
 return;
 }
 setJoiningSlot({ team: 'QUICK', index: sIdx, role: slot.role });
 setShowConfirm(true);
 }}
 className={`p-5 rounded-[20px] border transition-all duration-500 text-left group relative overflow-hidden ${
 slot.status === 'OPEN' 
 ? 'bg-[#121212] border-white/5 hover:border-[#55DEE8]/40 hover:bg-[#55DEE8]/5' 
 : 'bg-black/50 opacity-40 border-transparent'
 }`}
 >
 {slot.status === 'OPEN' && (
 <div className="absolute top-0 left-0 w-1 h-full bg-[#55DEE8] scale-y-0 group-hover:scale-y-100 transition-transform" />
 )}
 <div className="flex items-center justify-between mb-1">
 <p className="text-[9px] text-[#878C9F] font-black uppercase tracking-widest">{slot.role || 'Player'}</p>
 {slot.user && (
 <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10">
 {slot.user.profilePicture ? (
 <img src={slot.user.profilePicture} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-white/5 flex items-center justify-center text-[8px] text-white/40">
 {slot.user.name?.[0]}
 </div>
 )}
 </div>
 )}
 </div>
 <p className="font-black text-white uppercase tracking-tight">
 {slot.status === 'OPEN' ? 'AVAILABLE' : slot.status === 'JOINED' ? (slot.user?.name || 'OCCUPIED') : slot.status}
 </p>
 </button>
 ))}
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
 {['teamA', 'teamB'].map((teamKey, tIdx) => (
 <div key={teamKey} className="space-y-6">
 <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-4">
 <h3 className="text-2xl font-black text-white uppercase tracking-tighter font-open-sans">
 {selectedGame.teams[teamKey].name}
 </h3>
 <span className="text-[10px] font-black text-[#55DEE8] uppercase tracking-widest">Team {tIdx === 0 ? 'A' : 'B'}</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {selectedGame.teams[teamKey].slots.map((slot, sIdx) => (
 <button
 key={sIdx}
 disabled={slot.status !== 'OPEN'}
 onClick={() => {
 if (!isAuthenticated) {
 toast.error("Please login to join this game");
 navigate('/login');
 return;
 }
 setJoiningSlot({ team: teamKey === 'teamA' ? 'A' : 'B', index: sIdx, role: slot.role });
 setShowConfirm(true);
 }}
 className={`p-5 rounded-[20px] border transition-all duration-500 text-left group relative overflow-hidden ${
 slot.status === 'OPEN' 
 ? 'bg-[#121212] border-white/5 hover:border-[#55DEE8]/40 hover:bg-[#55DEE8]/5' 
 : 'bg-black/50 opacity-40 border-transparent'
 }`}
 >
 {slot.status === 'OPEN' && (
 <div className="absolute top-0 left-0 w-1 h-full bg-[#55DEE8] scale-y-0 group-hover:scale-y-100 transition-transform" />
 )}
 <p className="text-[9px] text-[#878C9F] font-black uppercase tracking-widest mb-1">{slot.role}</p>
 <p className="font-black text-white uppercase tracking-tight">
 {slot.status === 'OPEN' ? 'AVAILABLE' : slot.status === 'PENDING' ? 'RESERVED' : 'OCCUPIED'}
 </p>
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Confirmation Modal */}
 <AnimatePresence>
 {showConfirm && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
 <motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="relative bg-[#000000] border border-[#2D2D2D] p-10 rounded-[32px] max-w-md w-full text-center shadow-2xl"
 >
 <div className="w-20 h-20 bg-[#55DEE8]/10 border border-[#55DEE8]/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(204,255,0,0.1)]">
 <Coins size={40} className="text-[#55DEE8]" />
 </div>
 <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-4 font-open-sans">Join Protocol</h2>
 <p className="text-[#999999] mb-10 text-sm leading-relaxed">
 Participation requires <span className="text-[#55DEE8] font-black">{selectedGame?.perPlayerCharge || 0} Coins</span>. These will be securely escrowed until match confirmation.
 </p>
 <div className="flex gap-4">
 <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-[#121212] border border-[#2D2D2D] rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">Abort</button>
 <button
 onClick={() => {
 setShowConfirm(false);
 handleJoinGame();
 }}
 className="flex-1 py-4 bg-[#55DEE8] text-black font-black rounded-xl text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:scale-105 transition-all"
 >
 Confirm
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <CoinAnimation 
 show={showCoinAnim} 
 amount={selectedGame?.perPlayerCharge} 
 onComplete={() => {
 setShowCoinAnim(false);
 setSelectedGame(null);
 toast.success("Deployment Successful! Request Sent.");
 fetchGames();
 }} 
 />

 {/* Invite Redemption Popup */}
 <AnimatePresence>
 {showInvitePopup && inviteData && (
 <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInvitePopup(false)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
 <motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="relative bg-[#000000] border border-[#55DEE8]/20 p-8 rounded-[32px] max-w-md w-full shadow-[0_0_50px_rgba(204,255,0,0.1)]"
 >
 <div className="w-20 h-20 bg-[#55DEE8]/10 border border-[#55DEE8]/20 rounded-full flex items-center justify-center mx-auto mb-6">
 <Trophy size={40} className="text-[#55DEE8]" />
 </div>
 
 <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center mb-2">Claim Your Slot</h2>
 <p className="text-[#55DEE8] text-[10px] font-black uppercase tracking-[0.3em] text-center mb-6">Reserved For You</p>
 
 <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 mb-8 space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-white/40 uppercase">Match</span>
 <span className="text-sm font-black text-white uppercase">{inviteData.game.gameType}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-white/40 uppercase">Date/Time</span>
 <span className="text-sm font-black text-white">{new Date(inviteData.game.date).toLocaleDateString()} GÇó {inviteData.game.time}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-white/40 uppercase">Location</span>
 <span className="text-sm font-black text-white uppercase truncate ml-4">{inviteData.game.city}, {inviteData.game.state}</span>
 </div>
 <div className="pt-3 border-t border-white/5 flex items-center justify-between">
 <span className="text-[10px] font-bold text-[#55DEE8] uppercase">Cost</span>
 <span className="text-lg font-black text-[#55DEE8]">{inviteData.mustPay ? `${inviteData.perPlayerCharge} Coins` : 'FREE'}</span>
 </div>
 </div>

 <div className="flex gap-4">
 <button onClick={() => setShowInvitePopup(false)} className="flex-1 py-4 bg-[#121212] border border-[#2D2D2D] rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">Ignore</button>
 <button
 onClick={handleClaimSlot}
 className="flex-1 py-4 bg-[#55DEE8] text-black font-black rounded-xl text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:scale-105 transition-all"
 >
 Join Match
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default JoinGames;
