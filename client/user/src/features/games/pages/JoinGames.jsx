import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { login } from '@redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@hooks/useAxiosInstance';
import { toast } from 'react-hot-toast';
import { 
 Users, MapPin, Calendar, Clock, 
 Search, Filter, Coins, ChevronRight, ChevronDown,
 UserCheck, Trophy, Info, Zap, ShieldCheck, X, Share2, Award
} from 'lucide-react';
import { GiCricketBat, GiGloves, GiRun } from 'react-icons/gi';
import { fetchStates, fetchCities } from '@utils/locationService';
import CoinAnimation from '@components/CoinAnimation';
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };


// Custom cricket ball SVG icon for Bowler role
const CricketBallIcon = ({ size = 12, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M0 0h24v24H0z" fill="none" />
    <path fill="currentColor" d="m3.62 15.85l.53.53l-.73.73c.3.5.63.97 1.01 1.4L18.51 4.43c-.44-.38-.91-.71-1.4-1.01l-.73.73l-.53-.53l.57-.57A9.96 9.96 0 0 0 12 2C6.49 2 2 6.49 2 12c0 1.59.38 3.09 1.05 4.42zM14.8 4.67l.53.53l-1.75 1.75l-.53-.53zM12 7.47l.53.53l-1.75 1.75l-.53-.53zm-2.8 2.8l.53.53l-1.75 1.75l-.53-.53zm-2.8 2.8l.53.53l-1.75 1.75l-.53-.53zm13.98-4.92l-.53-.53l.73-.73c-.3-.5-.63-.97-1.01-1.4L5.49 19.57c.44.38.91.71 1.4 1.01l.73-.73l.53.53l-.57.57C8.92 21.61 10.41 22 12 22c5.51 0 10-4.49 10-10c0-1.59-.38-3.09-1.05-4.42zM9.2 19.33l-.53-.53l1.75-1.75l.53.53zm2.8-2.8l-.53-.53l1.75-1.75l.53.53zm2.8-2.8l-.53-.53l1.75-1.75l.53.53zm2.8-2.8l-.53-.53l1.75-1.75l.53.53z" />
  </svg>
);

const JoinGames = () => {
 const navigate = useNavigate();
 const { gateInteraction } = useLoginOnDemand();
 const { isAuthenticated, user } = useSelector((/** @type {any} */ state) => state.auth);
 const [games, setGames] = useState([]);
 const [loading, setLoading] = useState(true);
 const [selectedGame, setSelectedGame] = useState(null);
 const [showCoinAnim, setShowCoinAnim] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [joiningSlot, setJoiningSlot] = useState(null);
 const [search, setSearch] = useState('');
 const [sportFilter, setSportFilter] = useState('All Sports');
 const [matchTypeFilter, setMatchTypeFilter] = useState('All Matches');
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

  const normalizeString = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoadingStates(true);
        const statesData = await fetchStates();
        setStates(statesData);
        setLoadingStates(false);

        let uCity = '';
        let uState = '';
        try {
          const userRes = await axiosInstance.get(`/api/user/auth/getMe`);
          const user = userRes.data.user;
          if (user?.city || user?.state) {
            uCity = user.city || '';
            uState = user.state || '';
          }
        } catch (e) {
          // ignore auth errors if user not logged in
        }

        let matchedState = '';
        if (uState) {
          matchedState = statesData.find(s => normalizeString(s) === normalizeString(uState)) || '';
        }

        let matchedCity = '';
        if (matchedState && uCity) {
          const citiesData = await fetchCities(matchedState);
          setCities(citiesData);
          matchedCity = citiesData.find(c => normalizeString(c) === normalizeString(uCity)) || '';
        }

        if (matchedCity || matchedState) {
          setUserLocation({ city: matchedCity, state: matchedState });
          setSelectedState(matchedState);
          setSelectedCity(matchedCity);
          fetchGames(matchedCity, matchedState);
        } else {
          fetchGames();
        }
      } catch (err) {
        fetchGames();
      }
    };
    initializePage();

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
    if (!game) return false;
    const currentUserId = user?.id || user?._id;
    
    if (matchTypeFilter === 'My Hosted Games') {
      if (!currentUserId || (game.hostId !== currentUserId && game.host?._id !== currentUserId && game.host?.id !== currentUserId)) {
        return false;
      }
    }

    if (matchTypeFilter === 'Live' && !game.isLive) return false;
    if (matchTypeFilter === 'Quick' && game.gameMode?.toUpperCase() !== 'QUICK') return false;
    if (matchTypeFilter === 'Professional' && game.gameMode?.toUpperCase() !== 'PROFESSIONAL') return false;

    const searchLower = search ? search.toLowerCase() : '';
    if (!searchLower) return true;
    
    const gameTypeMatch = game.gameType?.toLowerCase().includes(searchLower) || false;
    const groundMatch = game.ground?.name?.toLowerCase().includes(searchLower) || false;
    const cityMatch = game.city?.toLowerCase().includes(searchLower) || false;
    const gameModeStr = game.gameMode?.toUpperCase() === 'QUICK' ? 'quick game' : 'professional game';
    const modeMatch = gameModeStr.includes(searchLower);

    return gameTypeMatch || groundMatch || cityMatch || modeMatch;
  });

 const handleJoinGame = async () => {
 if (!joiningSlot) return;
 gateInteraction(async () => {
 try {
 const res = await axiosInstance.post(`/api/hosted-game/join`, {
 gameId: selectedGame.id,
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
 <div className="min-h-screen bg-[#000000] text-white px-1 md:px-3 pt-4 pb-24 relative overflow-hidden font-inter">
  {/* Dynamic Background Glow */}
  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#BFF367]/5 blur-[150px] pointer-events-none" />
  <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#BFF367]/5 blur-[150px] pointer-events-none" />

  <div className="max-w-7xl mx-auto relative z-10">
  {/* Header Section */}
  <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-[#2D2D2D] pb-10 mb-12">
  <div className="relative w-full lg:w-auto">
   <div className="flex items-center justify-between lg:justify-start gap-4 mb-4 w-full">
     <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none font-open-sans">
     Join <span className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] bg-clip-text text-transparent">Games</span>
     </h1>
    <button 
    onClick={() => gateInteraction(() => navigate('/host-game'))}
    className="lg:hidden px-4 py-2.5 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black text-[10px] uppercase tracking-widest rounded-[8px] flex items-center gap-2 hover:scale-105 transition-all duration-500 shadow-[0_0_20px_rgba(191,243,103,0.25)] hover:shadow-[0_0_30px_rgba(191,243,103,0.35)] whitespace-nowrap"
    >
    <Trophy size={14} /> Host Match
    </button>
      </div>
  <p className="text-sm md:text-xl text-[#999999] tracking-tight max-w-xl" style={SUBHEADING_STYLE}>
  Competitive Matchmaking • Discover & participate in matches hosted by the elite sports community.
  </p>
  </div>
  
  {/* Desktop Host Match Button */}
  <div className="hidden lg:flex flex-wrap items-center gap-4">
    <button 
    onClick={() => gateInteraction(() => navigate('/host-game'))}
    className="px-6 py-3.5 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black text-[9px] md:text-[11px] uppercase tracking-widest rounded-[8px] flex items-center gap-2.5 hover:scale-105 transition-all duration-500 shadow-[0_0_30px_rgba(191,243,103,0.25)] hover:shadow-[0_0_40px_rgba(191,243,103,0.35)] whitespace-nowrap"
    >
    <Trophy size={16} /> Host Match
    </button>
  </div>
  </div>


  {/* Search & Filters Container */}
  <div className="w-full mb-12 flex flex-col md:flex-row md:items-center gap-3 md:gap-0 md:bg-[#0a0a0c]/80 md:backdrop-blur-2xl md:border md:border-white/10 md:rounded-[8px] md:p-1.5 md:shadow-2xl transition-all duration-500 hover:border-[#BFF367]/30">
    
    {/* Search Input Container */}
    <div className="w-full md:w-auto md:flex-[2] relative flex items-center min-h-[56px] md:min-h-full bg-[#0a0a0c]/80 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none border border-white/10 md:border-none md:border-r md:border-white/5 rounded-[8px] md:rounded-[6px] px-4 py-3 md:py-0 shadow-2xl md:shadow-none transition-all hover:border-[#BFF367]/30 md:hover:border-transparent">
      <Search className="text-gray-500 mr-3" size={16} />
      <input 
        className="w-full h-full bg-transparent text-white outline-none text-xs font-bold placeholder-gray-500 tracking-wide" 
        placeholder="Search by sport, venue..." 
        value={search}
        onChange={handleSearch}
        onKeyDown={(e) => e.key === 'Enter' && fetchGames(selectedCity, selectedState, sportFilter)}
      />
    </div>

    {/* Filters Scrollable Container */}
    <div className="w-full md:w-auto md:flex-[2.5] flex flex-row items-stretch overflow-x-auto hide-scrollbar bg-[#0a0a0c]/80 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none border border-white/10 md:border-none rounded-[8px] md:rounded-[8px] min-h-[56px] md:min-h-full shadow-2xl md:shadow-none transition-all hover:border-[#BFF367]/30 md:hover:border-transparent">
      
      {/* Sport Filter */}
      <div className="flex-1 md:w-auto md:flex-[0.6] relative border-r border-white/5 flex items-center group min-h-[56px] md:min-h-full flex-shrink-0 min-w-[80px] md:min-w-[150px]">
        <div className="absolute left-4 pointer-events-none hidden sm:block">
          <Trophy size={14} className="text-gray-500 group-focus-within:text-[#BFF367]" />
        </div>
        <select 
          className="w-full h-full bg-transparent appearance-none text-[9px] md:text-[11px] font-bold text-white uppercase tracking-tight pl-3 sm:pl-10 pr-8 md:pr-12 py-4 outline-none cursor-pointer"
          value={sportFilter}
          onChange={(e) => {
            setSportFilter(e.target.value);
            fetchGames(selectedCity, selectedState, e.target.value);
          }}
        >
          <option className="bg-[#0a0a0a] text-white" value="All Sports">All Sports</option>
          <option className="bg-[#0a0a0a] text-white" value="Cricket">Cricket</option>
          <option className="bg-[#0a0a0a] text-white" value="Football">Football</option>
          <option className="bg-[#0a0a0a] text-white" value="Badminton">Badminton</option>
          <option className="bg-[#0a0a0a] text-white" value="Basketball">Basketball</option>
          <option className="bg-[#0a0a0a] text-white" value="Tennis">Tennis</option>
          <option className="bg-[#0a0a0a] text-white" value="Volleyball">Volleyball</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 md:right-4 text-gray-500 pointer-events-none group-focus-within:text-[#BFF367]" />
      </div>

      {/* State Filter */}
      <div className="flex-1 md:w-auto md:flex-[0.5] relative border-r border-white/5 flex items-center group min-h-[56px] md:min-h-full flex-shrink-0 min-w-[80px] md:min-w-[140px]">
        <div className="absolute left-4 pointer-events-none hidden sm:block">
          <MapPin size={14} className="text-gray-500 group-focus-within:text-[#BFF367]" />
        </div>
        <select
          className="w-full h-full bg-transparent appearance-none text-[9px] md:text-[11px] font-bold text-white uppercase tracking-tight pl-3 sm:pl-10 pr-8 md:pr-12 py-4 outline-none cursor-pointer disabled:text-gray-500 disabled:opacity-100 disabled:cursor-not-allowed"
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          disabled={loadingStates}
        >
          <option className="bg-[#0a0a0a] text-white" value="">{loadingStates ? 'Loading...' : 'All States'}</option>
          {states.map(s => (
            <option className="bg-[#0a0a0a] text-white" key={s} value={s}>{s}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2 md:right-4 text-gray-500 pointer-events-none group-focus-within:text-[#BFF367]" />
      </div>

      {/* City Filter */}
      <div className="flex-1 md:w-auto md:flex-[0.5] relative border-r border-white/5 flex items-center group min-h-[56px] md:min-h-full flex-shrink-0 min-w-[80px] md:min-w-[140px]">
        <div className="absolute left-4 pointer-events-none hidden sm:block">
          <MapPin size={14} className="text-gray-500 group-focus-within:text-[#BFF367]" />
        </div>
        <select
          className="w-full h-full bg-transparent appearance-none text-[9px] md:text-[11px] font-bold text-white uppercase tracking-tight pl-3 sm:pl-10 pr-8 md:pr-12 py-4 outline-none cursor-pointer disabled:text-gray-500 disabled:opacity-100 disabled:cursor-not-allowed"
          value={selectedCity}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={!selectedState || loadingCities}
        >
          <option className="bg-[#0a0a0a] text-white" value="">{loadingCities ? 'Loading...' : 'All Cities'}</option>
          {cities.map(c => (
            <option className="bg-[#0a0a0a] text-white" key={c} value={c}>{c}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2 md:right-4 text-gray-500 pointer-events-none group-focus-within:text-[#BFF367]" />
      </div>

      {/* Match Type Filter */}
      <div className="flex-1 md:w-auto md:flex-[0.5] relative border-white/5 flex items-center group min-h-[56px] md:min-h-full flex-shrink-0 min-w-[80px] md:min-w-[150px]">
        <div className="absolute left-4 pointer-events-none hidden sm:block">
          <Zap size={14} className="text-gray-500 group-focus-within:text-[#BFF367]" />
        </div>
        <select
          className="w-full h-full bg-transparent appearance-none text-[9px] md:text-[11px] font-bold text-white uppercase tracking-tight pl-3 sm:pl-10 pr-8 md:pr-12 py-4 outline-none cursor-pointer"
          value={matchTypeFilter}
          onChange={(e) => setMatchTypeFilter(e.target.value)}
        >
          <option className="bg-[#0a0a0a] text-white" value="All Matches">All Matches</option>
          <option className="bg-[#0a0a0a] text-white" value="My Hosted Games">My Hosted Games</option>
          <option className="bg-[#0a0a0a] text-white" value="Live">Live Matches</option>
          <option className="bg-[#0a0a0a] text-white" value="Quick">Quick Matches</option>
          <option className="bg-[#0a0a0a] text-white" value="Professional">Professional</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 md:right-4 text-gray-500 pointer-events-none group-focus-within:text-[#BFF367]" />
      </div>
    </div>
  </div>

  {/* Game List */}
 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
 {loading ? (
 [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
 <div key={i} className="h-[420px] bg-[#0d0d0d] rounded-[8px] border border-[#2D2D2D] animate-pulse" />
 ))
 ) : filteredGames.length === 0 ? (
 <div className="col-span-full py-32 text-center bg-[#0d0d0d] rounded-[8px] border border-[#2D2D2D] relative overflow-hidden">
 <div className="absolute inset-0 bg-[#BFF367]/5 blur-[100px]" />
 <div className="relative z-10 space-y-6">
 <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto shadow-2xl">
 <Info className="text-[#BFF367]/40" size={48} />
 </div>
 <div className="space-y-2">
 <h3 className="text-3xl font-black text-white uppercase tracking-tighter font-open-sans">No Active Matches</h3>
 <p className="text-[#999999] max-w-md mx-auto">
 The sports ledger is currently empty. Be the first to host a match in this region.
 </p>
 </div>
 <button 
 onClick={() => navigate('/host-game')}
 className="px-10 py-4 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black text-xs uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(191,243,103,0.25)] hover:scale-105 transition-all"
 >
 Create Match
 </button>
 </div>
 </div>
 ) : (
                         filteredGames.map(game => {
  const totalSlots = game.gameMode === 'QUICK' 
    ? game.quickSlots.filter(s => s.status === 'OPEN').length 
    : (game.teams?.teamA?.slots?.filter(s => s.status === 'OPEN').length || 0) + (game.teams?.teamB?.slots?.filter(s => s.status === 'OPEN').length || 0);
  const openSlots = game.gameMode === 'QUICK' 
    ? game.quickSlots.filter(s => s.status === 'OPEN').length 
    : (game.teams?.teamA?.slots?.filter(s => s.status === 'OPEN').length || 0) + (game.teams?.teamB?.slots?.filter(s => s.status === 'OPEN').length || 0);
  const filledSlots = (game.gameMode === 'QUICK' ? game.quickSlots.length : (game.teams?.teamA?.slots?.length || 0) + (game.teams?.teamB?.slots?.length || 0)) - openSlots;
  const totalCapacity = game.gameMode === 'QUICK' ? game.quickSlots.length : (game.teams?.teamA?.slots?.length || 0) + (game.teams?.teamB?.slots?.length || 0);

  return (
   <motion.div
   key={game.id}
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   whileHover={{ y: -6, scale: 1.01 }}
   transition={{ duration: 0.3 }}
   className="group relative rounded-[8px] overflow-hidden cursor-pointer bg-black border border-white/5 hover:border-[#BFF367]/30 transition-all duration-500 flex flex-col w-full shadow-md hover:shadow-lg"
   onClick={() => setSelectedGame(game)}
   >
   {/* ── Image Area (Square) ── */}
   <div className="relative w-full aspect-square overflow-hidden bg-black shrink-0">
   {/* Background: Split Team Images */}
   <div className="absolute inset-0 z-0 overflow-hidden bg-transparent">
   {/* Team A */}
   <div className="absolute inset-y-0 left-0 w-[60%] overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 65% 100%, 0 100%)' }}>
   <img src={game.teams?.teamA?.image || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80"} alt="Team A" className="w-full h-full object-cover object-right scale-110 group-hover:scale-125 transition-transform duration-700" />
   </div>
   {/* Team B */}
   <div className="absolute inset-y-0 right-0 w-[60%] overflow-hidden" style={{ clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0 100%)' }}>
   <img src={game.teams?.teamB?.image || "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"} alt="Team B" className="w-full h-full object-cover object-left scale-110 group-hover:scale-125 transition-transform duration-700" />
   </div>
   </div>

   {/* Content over image */}
   <div className="relative z-25 flex flex-col h-full p-4 justify-center bg-transparent">



   </div>
   </div>

   {/* ── Bottom Info Panel (Below Image) ── */}
   <div className="flex flex-col gap-2 md:gap-2.5 p-2.5 md:p-3 bg-[#0a0a0c] border-t border-white/5">
   
   {/* Match Title */}
   <div className="w-full text-left mb-0.5">
   <h3 className="text-[11px] md:text-[14px] font-black uppercase leading-tight tracking-tight text-white font-open-sans truncate">
   {game.gameMode === 'QUICK' ? (
   <>Casual <span className="text-[#BFF367]">{game.gameType}</span> Match</>
   ) : (
   <span className="flex items-center gap-x-1.5 md:gap-x-2">
   <span className="truncate max-w-[100px] md:max-w-[120px]">{game.teams?.teamA?.name}</span>
   <span className="text-[9px] md:text-[10px] italic text-[#BFF367] font-bold">vs</span>
   <span className="truncate max-w-[100px] md:max-w-[120px]">{game.teams?.teamB?.name}</span>
   </span>
   )}
   </h3>
   </div>

   {/* Row 1: Date & Capacity */}
   <div className="flex justify-between items-center w-full">
   <span className="text-[10px] md:text-[12px] font-black text-white shrink-0">
   {new Date(game.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {game.time}
   </span>
   <div className="flex items-center gap-1 md:gap-1.5 bg-transparent shrink-0">
   <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#BFF367]" />
   <span className="text-[10px] md:text-[12px] font-black text-white">
   {filledSlots}/{totalCapacity}
   </span>
   </div>
   </div>

   {/* Row 2: Tags & CTA */}
   <div className="flex items-center w-full overflow-x-auto no-scrollbar gap-1.5">
   <div className="flex gap-1.5 items-center shrink-0">
   {/* Game Tag */}
   <span className="px-1.5 py-0.5 md:px-2 md:py-1 rounded-[4px] bg-[#BFF367]/10 text-[#BFF367] text-[7.5px] md:text-[9px] font-black uppercase tracking-widest border border-[#BFF367]/20">
   {game.gameType || 'MATCH'}
   </span>
   {/* Coins Tag */}
   <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 md:px-2 md:py-1 rounded-[4px] bg-white/5 text-white text-[7.5px] md:text-[9px] font-black uppercase tracking-widest border border-white/10">
   <Coins className="w-2 h-2 md:w-2.5 md:h-2.5 text-[#BFF367]" />
   {game.perPlayerCharge || 'FREE'}
   </span>
   </div>


   </div>
   </div>
   </motion.div>
  );
 })
 )}
 </div>
 </div>


  {/* Game Details Modal */}
  <AnimatePresence>
  {selectedGame && (() => {
    // Dynamic Role Pluralizer helper
    const getPluralRole = (role) => {
      let r = role ? role.toUpperCase() : 'PLAYERS';
      if (r === 'BATSMAN') return 'BATSMEN';
      if (r === 'BOWLER') return 'BOWLERS';
      if (r === 'ALL-ROUNDER') return 'ALL-ROUNDERS';
      if (r === 'WICKET KEEPER') return 'WICKET KEEPERS';
      return r;
    };

    // Get cricket-specific icons for roles
    const getRoleIcon = (role) => {
      const r = role ? role.toLowerCase() : '';
      if (r.includes('bat')) return GiCricketBat;
      if (r.includes('bowl')) return CricketBallIcon;
      if (r.includes('keep')) return GiGloves;
      if (r.includes('all')) return GiRun;
      return Users;
    };

    return (
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
  className="relative bg-[#000000] border border-white/[0.04] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[8px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] custom-scrollbar"
  >
  <div className="sticky top-0 z-20 bg-[#060608]/90 backdrop-blur-xl border-b border-white/[0.06] px-8 py-5 flex items-center justify-between">
  <div className="flex items-center gap-3 flex-wrap">
  <div className="px-4 py-1.5 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black text-[10px] font-black uppercase tracking-wider rounded-full font-open-sans">
  {selectedGame.gameType} Elite
  </div>
  {selectedGame.shortId && (
  <button
  onClick={() => { navigator.clipboard?.writeText(selectedGame.shortId); toast.success('Game ID copied!'); }}
  className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-[#BFF367]/40 text-[#BFF367] rounded-[6px] flex items-center gap-1.5 transition-all"
  >
  <Info size={11} />
  <span className="font-inter text-[10px] font-bold uppercase tracking-widest">ID: {selectedGame.shortId}</span>
  </button>
  )}
  <h2 className="font-open-sans text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Match Intelligence</h2>
  </div>
  <button
  onClick={() => setSelectedGame(null)}
  className="w-8 h-8 rounded-full border border-white/10 hover:border-[#BFF367]/40 flex items-center justify-center text-white/50 hover:text-white hover:bg-[#BFF367]/10 transition-all duration-300"
  >✕</button>
  </div>

  <div className="px-8 lg:px-12 py-6">

  {/* Inline stats row with dividers */}
  <div className="flex items-center gap-0 flex-wrap mb-8">
  {[
  { label: "Date", value: new Date(selectedGame.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
  { label: "Time", value: selectedGame.time },
  { label: "Fee", value: selectedGame.perPlayerCharge ? `${selectedGame.perPlayerCharge} Coins` : 'Free' },
  { label: "Umpire", value: selectedGame.umpire ? 'Verified' : 'Unmanaged' },
  ].map((stat, i, arr) => (
  <div key={i} className="flex items-center">
  <div className="px-4 py-1 text-center">
  <span className="text-[9px] text-white/30 uppercase tracking-widest block mb-0.5">{stat.label}</span>
  <span className={`text-[13px] font-black uppercase ${stat.label === 'Fee' && stat.value === 'Free' ? 'bg-gradient-to-r from-[#BFF367] to-[#BFF367] bg-clip-text text-transparent' : 'text-white'}`}>
  {stat.value}
  </span>
  </div>
  {i < arr.length - 1 && <div className="w-px h-8 bg-white/10" />}
  </div>
  ))}
  </div>

  {/* Slot grid */}
  {selectedGame.gameMode === 'QUICK' ? (
  <div className="space-y-4">
  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
  <h3 className="font-open-sans text-base font-black text-white uppercase tracking-tight">Casual Match Pool</h3>
  <span className="font-inter text-[9px] md:text-[11px] font-bold bg-gradient-to-r from-[#BFF367] to-[#BFF367] bg-clip-text text-transparent border border-white/10 px-2.5 py-0.5 rounded-[8px]">
  {selectedGame.quickSlots.filter(s => s.status !== 'OPEN').length}/{selectedGame.quickSlots.length}
  </span>
  </div>
  <div className="grid grid-cols-5 gap-x-3 gap-y-5">
  {selectedGame.quickSlots.map((slot, sIdx) => {
  const isJoined = slot.status !== 'OPEN';
  const RoleIcon = getRoleIcon(slot.role || '');
  return (
  <div key={sIdx} className="flex flex-col items-center gap-1">
  <button
  disabled={isJoined}
  onClick={() => {
  if (!isAuthenticated) { toast.error("Please login to join this game"); navigate('/login'); return; }
  const currentUserId = user?.id || user?._id;
  const hasAlreadyJoined = selectedGame.quickSlots?.some(s => s.userId === currentUserId || s.user?._id === currentUserId || s.user?.id === currentUserId);
  if (hasAlreadyJoined) {
    toast.error("You have already joined a slot in this game.");
    return;
  }
  setJoiningSlot({ team: 'QUICK', index: sIdx, role: slot.role });
  setShowConfirm(true);
  }}
  className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-black ${ isJoined ? 'border-white/15 cursor-not-allowed' : 'border-white/10 hover:border-[#BFF367] hover:shadow-[0_0_12px_rgba(191,243,103,0.35)]' }`}>
  {isJoined ? (
  slot.user?.profilePicture
  ? <img src={slot.user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
  : <div className="w-full h-full rounded-full flex items-center justify-center font-inter text-[9px] md:text-[11px] font-bold text-white">{(slot.user?.name || slot.customPlayer?.name)?.[0]?.toUpperCase() || 'P'}</div>
  ) : <span className="text-white/25 text-lg font-bold">+</span>}
  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#08080a] border border-white/10 flex items-center justify-center">
  <RoleIcon size={8} className="text-[#BFF367]" />
  </div>
  </button>
  <span className="font-inter text-[8px] text-white/40 uppercase tracking-wide text-center truncate w-full">
  {isJoined ? ((slot.user?.name || slot.customPlayer?.name)?.split(' ')[0] || 'Player') : ''}
  </span>
  </div>
  );
  })}
  </div>
  </div>
  ) : (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {['teamA', 'teamB'].map((teamKey) => (
  <div key={teamKey} className="space-y-3">
  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
  <h3 className="font-open-sans text-base font-black text-white uppercase tracking-tight">{selectedGame.teams[teamKey].name}</h3>
  <span className="font-inter text-[9px] md:text-[11px] font-bold bg-gradient-to-r from-[#BFF367] to-[#BFF367] bg-clip-text text-transparent border border-white/10 px-2.5 py-0.5 rounded-[8px]">
  {selectedGame.teams[teamKey].slots.filter(s => s.status !== 'OPEN').length}/{selectedGame.teams[teamKey].slots.length}
  </span>
  </div>
  <div className="grid grid-cols-5 gap-x-2.5 gap-y-5">
  {selectedGame.teams[teamKey].slots.map((slot, sIdx) => {
  const isJoined = slot.status !== 'OPEN';
  const RoleIcon = getRoleIcon(slot.role || '');
  return (
  <div key={sIdx} className="flex flex-col items-center gap-1">
  <button
  disabled={isJoined}
  onClick={() => {
  if (!isAuthenticated) { toast.error("Please login to join this game"); navigate('/login'); return; }
  const currentUserId = user?.id || user?._id;
  const hasAlreadyJoined = selectedGame.teams?.teamA?.slots?.some(s => s.userId === currentUserId || s.user?._id === currentUserId || s.user?.id === currentUserId) ||
                           selectedGame.teams?.teamB?.slots?.some(s => s.userId === currentUserId || s.user?._id === currentUserId || s.user?.id === currentUserId);
  if (hasAlreadyJoined) {
    toast.error("You have already joined a slot in this game.");
    return;
  }
  setJoiningSlot({ team: teamKey === 'teamA' ? 'A' : 'B', index: sIdx, role: slot.role });
  setShowConfirm(true);
  }}
  className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-black ${ isJoined ? 'border-white/15 cursor-not-allowed' : 'border-white/10 hover:border-[#BFF367] hover:shadow-[0_0_12px_rgba(191,243,103,0.35)]' }`}>
  {isJoined ? (
  slot.user?.profilePicture
  ? <img src={slot.user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
  : <div className="w-full h-full rounded-full flex items-center justify-center font-inter text-[10px] font-bold text-white">{(slot.user?.name || slot.customPlayer?.name)?.[0]?.toUpperCase() || 'P'}</div>
  ) : <span className="text-white/25 text-base font-bold">+</span>}
  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#08080a] border border-white/10 flex items-center justify-center">
  <RoleIcon size={8} className="text-[#BFF367]" />
  </div>
  </button>
  <span className="font-inter text-[8px] text-white/40 uppercase tracking-wide text-center truncate w-full">
  {isJoined ? ((slot.user?.name || slot.customPlayer?.name)?.split(' ')[0] || 'Player') : ''}
  </span>
  </div>
  );
  })}
  </div>
  </div>
  ))}
  </div>
  )}

  {/* Bottom hint */}
  <div className="flex items-center justify-center gap-1.5 pt-6 mt-8 border-t border-white/[0.06]">
  <Info size={11} className="text-[#BFF367]" />
  <span className="font-inter text-[9px] text-white/30 uppercase tracking-widest">Tap an available slot to join</span>
  </div>
  </div>
  </motion.div>
  </div>
  );
  })()}
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
  className="relative bg-[#000000] border border-[#2D2D2D] p-10 rounded-[8px] max-w-md w-full text-center shadow-2xl"
  >
  <div className="w-20 h-20 bg-[#BFF367]/10 border border-[#BFF367]/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(191,243,103,0.1)]">
  <Coins size={40} className="text-[#BFF367]" />
  </div>
  <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-4 font-open-sans">Join Protocol</h2>
  <p className="text-[#999999] mb-10 text-sm leading-relaxed">
  Participation requires <span className="text-[#BFF367] font-black">{selectedGame?.perPlayerCharge || 0} Coins</span>. These will be securely escrowed until match confirmation.
  </p>
  <div className="flex gap-4">
 <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-[#121212] border border-[#2D2D2D] rounded-[8px] font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">Abort</button>
 <button
 onClick={() => {
 setShowConfirm(false);
 handleJoinGame();
 }}
 className="flex-1 py-4 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black rounded-[8px] text-[9px] md:text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(191,243,103,0.25)] hover:scale-105 transition-all"
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
 className="relative bg-[#000000] border border-[#BFF367]/20 p-8 rounded-[8px] max-w-md w-full shadow-[0_0_50px_rgba(191,243,103,0.15)]"
 >
 <div className="w-20 h-20 bg-[#BFF367]/10 border border-[#BFF367]/20 rounded-full flex items-center justify-center mx-auto mb-6">
 <Trophy size={40} className="text-[#BFF367]" />
 </div>
 
 <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center mb-2">Claim Your Slot</h2>
 <p className="text-[#BFF367] text-[10px] font-black uppercase tracking-[0.3em] text-center mb-6">Reserved For You</p>
 
 <div className="bg-[#121212] border border-white/5 rounded-[8px] p-5 mb-8 space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-white/40 uppercase">Match</span>
 <span className="text-sm font-black text-white uppercase">{inviteData.game.gameType}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-white/40 uppercase">Date/Time</span>
 <span className="text-sm font-black text-white">{new Date(inviteData.game.date).toLocaleDateString()} • {inviteData.game.time}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-white/40 uppercase">Location</span>
 <span className="text-sm font-black text-white uppercase truncate ml-4">{inviteData.game.city}, {inviteData.game.state}</span>
 </div>
 <div className="pt-3 border-t border-white/5 flex items-center justify-between">
 <span className="text-[10px] font-bold text-[#BFF367] uppercase">Cost</span>
 <span className="text-lg font-black text-[#BFF367]">{inviteData.mustPay ? `${inviteData.perPlayerCharge} Coins` : 'FREE'}</span>
 </div>
 </div>

 <div className="flex gap-4">
 <button onClick={() => setShowInvitePopup(false)} className="flex-1 py-4 bg-[#121212] border border-[#2D2D2D] rounded-[8px] font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">Ignore</button>
 <button
 onClick={handleClaimSlot}
 className="flex-1 py-4 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black rounded-[8px] text-[9px] md:text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(191,243,103,0.25)] hover:scale-105 transition-all"
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
