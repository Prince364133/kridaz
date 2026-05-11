import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@hooks/useAxiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Users, MapPin, Calendar, Clock, 
  Search, Filter, Coins, ChevronRight,
  UserCheck, Trophy, Info, Zap, ShieldCheck
} from 'lucide-react';
import CoinAnimation from '../components/CoinAnimation';
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
  const [userLocation, setUserLocation] = useState({ city: '', state: '' });

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
          fetchGames(user.city, user.state);
        } else {
          fetchGames();
        }
      } catch (err) {
        fetchGames();
      }
    };
    fetchUserAndGames();
  }, []);

  const handleSearch = (e) => setSearch(e.target.value);

  const filteredGames = games.filter(game => 
    game.gameType.toLowerCase().includes(search.toLowerCase()) ||
    (game.ground?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    game.city?.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#CCFF00]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#CCFF00]/5 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-[#2D2D2D] pb-10 mb-12">
          <div className="relative">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-[#CCFF00] rounded-full shadow-[0_0_25px_rgba(204,255,0,0.5)] hidden md:block"></div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4 font-open-sans">
              Join <span className="text-[#CCFF00]">Games</span>
            </h1>
            <p className="text-sm md:text-xl font-medium text-[#999999] tracking-tight max-w-xl">
              Competitive Matchmaking • Discover & participate in matches hosted by the elite sports community.
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
              className="px-6 py-3.5 bg-[#CCFF00] text-black font-black text-[11px] uppercase tracking-widest rounded-[12px] flex items-center gap-2.5 hover:scale-105 transition-all duration-500 shadow-[0_0_30px_rgba(204,255,0,0.2)]"
            >
              <Trophy size={16} /> Host Match
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
          <div className="md:col-span-6 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#CCFF00] transition-colors" size={20} />
            <input 
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-[12px] py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" 
              placeholder="Search by city, venue, or sport..." 
              value={search}
              onChange={handleSearch}
            />
          </div>
          <div className="md:col-span-3 relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#CCFF00] transition-colors" size={18} />
            <select 
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-[12px] py-4 pl-12 pr-4 appearance-none text-sm text-white focus:outline-none focus:border-[#CCFF00]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              value={sportFilter}
              onChange={(e) => {
                setSportFilter(e.target.value);
                fetchGames(userLocation.city, userLocation.state, e.target.value);
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
          <div className="md:col-span-3 flex items-center gap-3 px-5 py-4 bg-[#CCFF00]/5 border border-[#CCFF00]/10 rounded-[12px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
            <MapPin size={18} className="text-[#CCFF00]" />
            <div className="min-w-0">
              <p className="text-[8px] font-black text-[#CCFF00]/60 uppercase tracking-widest mb-0.5">CURRENT DOMAIN</p>
              <p className="text-[11px] font-black text-white uppercase truncate tracking-widest">
                {userLocation.city || 'GLOBAL NETWORK'}
              </p>
            </div>
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
              <div className="absolute inset-0 bg-[#CCFF00]/5 blur-[100px]" />
              <div className="relative z-10 space-y-6">
                <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <Info className="text-[#CCFF00]/40" size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">No Active Matches</h3>
                  <p className="text-[#999999] max-w-md mx-auto">
                    The sports ledger is currently empty. Be the first to host a match in this region.
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/host-game')}
                  className="px-10 py-4 bg-[#CCFF00] text-black font-black text-xs uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:scale-105 transition-all"
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
                className="group relative rounded-[24px] overflow-hidden cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/5 hover:border-[#CCFF00]/30 transition-all duration-500"
                style={{ minHeight: '480px' }}
                onClick={() => setSelectedGame(game)}
              >
                {/* ── Background: Split Team Images ── */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  {/* Team A — Left Half */}
                  <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                    <img
                      src={game.teams?.teamA?.image || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80"}
                      alt="Team A"
                      className="w-full h-full object-cover object-right scale-110 group-hover:scale-125 transition-transform duration-700"
                    />
                  </div>
                  {/* Team B — Right Half */}
                  <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
                    <img
                      src={game.teams?.teamB?.image || "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"}
                      alt="Team B"
                      className="w-full h-full object-cover object-left scale-110 group-hover:scale-125 transition-transform duration-700"
                    />
                  </div>

                  {/* Center vignette — vintage blend where images meet */}
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-28 bg-gradient-to-r from-transparent via-black to-transparent opacity-90" />
                  {/* Edge vignettes (left + right) */}
                  <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/70 to-transparent" />
                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/70 to-transparent" />

                  {/* Top-to-bottom dark overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/92" />
                  {/* Bottom neon-green tinted overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1500]/85 via-transparent to-transparent" />
                </div>


                {/* ── Content ── */}
                <div className="relative z-10 flex flex-col h-full p-5" style={{ minHeight: '480px' }}>

                  {/* Top Row: Sport badge + Coins */}
                  <div className="flex items-start justify-between mb-auto">
                    <div className="px-4 py-1.5 bg-[#CCFF00]/20 border border-[#CCFF00]/40 rounded-full backdrop-blur-sm">
                      <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">{game.gameType}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                      <Coins size={13} className="text-[#CCFF00]" />
                      <span className="text-sm font-black text-white">{game.perPlayerCharge || 'FREE'}</span>
                    </div>
                  </div>

                  {/* Center: Rivalry + Team Names */}
                  <div className="py-6">
                    {/* Divider label */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-[#CCFF00]/30" />
                      <span className="text-[9px] font-black text-[#CCFF00]/70 uppercase tracking-[0.4em] flex items-center gap-1">
                        <Zap size={10} className="text-[#CCFF00]" /> Rivalry Ledger
                      </span>
                      <div className="h-px flex-1 bg-[#CCFF00]/30" />
                    </div>

                    {/* Team Names */}
                    <h3 className="font-black uppercase leading-none tracking-tighter text-white font-open-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)' }}>
                      {game.teams.teamA.name}{' '}
                      <span className="text-[#CCFF00] italic">VS</span>{' '}
                      {game.teams.teamB.name}
                    </h3>

                    {/* Venue */}
                    <div className="flex items-center gap-2 mt-3 text-white/70 text-xs font-medium">
                      <MapPin size={13} className="text-[#CCFF00] shrink-0" />
                      <span className="truncate">{game.ground?.name || 'Self-Arranged Venue'}</span>
                    </div>
                  </div>

                  {/* Bottom Panel */}
                  <div className="bg-black/60 backdrop-blur-md rounded-[16px] border border-white/10 p-4 space-y-4 mt-auto">

                    {/* Date + Time boxes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/50 border border-[#CCFF00]/20 rounded-[12px] p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-6 h-6 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center">
                            <Calendar size={12} className="text-[#CCFF00]" />
                          </div>
                        </div>
                        <p className="text-[7px] font-black text-[#CCFF00]/60 uppercase tracking-widest mb-0.5">Kickoff Date</p>
                        <p className="text-[13px] font-black text-white">
                          {new Date(game.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <div className="bg-black/50 border border-[#CCFF00]/20 rounded-[12px] p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-6 h-6 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center">
                            <Clock size={12} className="text-[#CCFF00]" />
                          </div>
                        </div>
                        <p className="text-[7px] font-black text-[#CCFF00]/60 uppercase tracking-widest mb-0.5">Precision Time</p>
                        <p className="text-[13px] font-black text-white">{game.time}</p>
                      </div>
                    </div>

                    {/* Slots */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center">
                          <Users size={14} className="text-[#CCFF00]" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white leading-none">
                            {game.teams.teamA.slots.filter(s => s.status === 'OPEN').length + game.teams.teamB.slots.filter(s => s.status === 'OPEN').length} OPEN
                          </p>
                          <p className="text-[7px] font-bold text-[#CCFF00]/50 uppercase tracking-widest mt-0.5">Available Capacity</p>
                        </div>
                      </div>
                      <div className="flex -space-x-1.5">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-[#0d0d0d] bg-[#CCFF00]/10 flex items-center justify-center shadow-lg">
                            <Users size={10} className="text-[#CCFF00]/50" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Host + Join */}
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full border border-[#CCFF00]/20 bg-[#1A1A1A] flex items-center justify-center overflow-hidden shrink-0">
                          {game.host?.profilePicture ? (
                            <img src={game.host.profilePicture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#CCFF00] font-black text-[11px]">
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

                      <button className="flex items-center gap-2 px-5 py-3 bg-[#CCFF00] text-black rounded-[12px] font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:scale-105 hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] transition-all duration-300">
                        JOIN <ChevronRight size={14} strokeWidth={3} />
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
                <div className="flex items-center gap-4">
                  <div className="px-4 py-1.5 bg-[#CCFF00] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                    {selectedGame.gameType} Elite
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter font-open-sans">Match Intelligence</h2>
                </div>
                <button onClick={() => setSelectedGame(null)} className="w-10 h-10 bg-[#121212] border border-[#2D2D2D] rounded-full flex items-center justify-center text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black transition-all">✕</button>
              </div>

              <div className="p-8 lg:p-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {[
                    { icon: Calendar, label: "Execution Date", value: new Date(selectedGame.date).toLocaleDateString() },
                    { icon: Clock, label: "Precise Time", value: selectedGame.time },
                    { icon: Coins, label: "Network Fee", value: selectedGame.perPlayerCharge || 'Free' },
                    { icon: ShieldCheck, label: "Security / Umpire", value: selectedGame.umpire ? 'Verified' : 'Unmanaged' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#0d0d0d] border border-[#2D2D2D] p-5 rounded-[20px] text-center group hover:border-[#CCFF00]/40 transition-all">
                      <stat.icon className="mx-auto mb-3 text-[#CCFF00]" size={24} />
                      <p className="text-[8px] text-[#878C9F] uppercase font-black tracking-widest mb-1">{stat.label}</p>
                      <p className="text-sm font-black text-white uppercase">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {['teamA', 'teamB'].map((teamKey, tIdx) => (
                    <div key={teamKey} className="space-y-6">
                      <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-4">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter font-open-sans">
                          {selectedGame.teams[teamKey].name}
                        </h3>
                        <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">Team {tIdx === 0 ? 'A' : 'B'}</span>
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
                              ? 'bg-[#121212] border-white/5 hover:border-[#CCFF00]/40 hover:bg-[#CCFF00]/5' 
                              : 'bg-black/50 opacity-40 border-transparent'
                            }`}
                          >
                            {slot.status === 'OPEN' && (
                              <div className="absolute top-0 left-0 w-1 h-full bg-[#CCFF00] scale-y-0 group-hover:scale-y-100 transition-transform" />
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
              <div className="w-20 h-20 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(204,255,0,0.1)]">
                <Coins size={40} className="text-[#CCFF00]" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-4 font-open-sans">Join Protocol</h2>
              <p className="text-[#999999] mb-10 text-sm leading-relaxed">
                Participation requires <span className="text-[#CCFF00] font-black">{selectedGame?.perPlayerCharge || 0} Coins</span>. These will be securely escrowed until match confirmation.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-[#121212] border border-[#2D2D2D] rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">Abort</button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    handleJoinGame();
                  }}
                  className="flex-1 py-4 bg-[#CCFF00] text-black font-black rounded-xl text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:scale-105 transition-all"
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
    </div>
  );
};

export default JoinGames;
