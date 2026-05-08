import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@hooks/useAxiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Users, MapPin, Calendar, Clock, 
  Search, Filter, Coins, ChevronRight,
  UserCheck, Trophy, Info
} from 'lucide-react';
import CoinAnimation from '../components/CoinAnimation';
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const JoinGames = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
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
      setGames(res.data.games);
    } catch (err) {
      toast.error("Failed to fetch games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to get location from user profile or local state
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
        console.error("Profile fetch error:", err);
        fetchGames();
      }
    };
    fetchUserAndGames();
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    // Simple local filtering for search or we could fetch again
  };

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

        if (res.data.success) {
          setShowCoinAnim(true);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to join game");
      }
    }, { 
      title: "Join the Match", 
      message: "Ready to hit the field? Sign in to secure your spot and start playing with the community." 
    });
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter">JOIN GAMES</h1>
          <p className="text-neutral-400">Play matches hosted by the community</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => {
              gateInteraction(() => navigate('/my-hosted-games'), {
                title: "View Your Games",
                message: "Access your dashboard to manage your hosted matches and active joining requests."
              });
            }} 
            className="px-6 py-3 bg-neutral-800 text-white font-bold rounded-xl flex items-center gap-2 border border-neutral-700"
          >
            <Users size={18} /> My Games
          </button>
          <button 
            onClick={() => {
              gateInteraction(() => navigate('/host-game'), {
                title: "Host a Game",
                message: "Ready to be a leader? Sign in to create your own match and invite players."
              });
            }} 
            className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl flex items-center gap-2"
          >
            <Trophy size={18} /> Host a Game
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="relative col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            className="w-full bg-neutral-800 border-none rounded-xl py-3 pl-12 text-sm focus:ring-1 ring-yellow-500 outline-none" 
            placeholder="Search by city or venue..." 
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <select 
            className="w-full bg-neutral-800 border-none rounded-xl py-3 pl-12 appearance-none text-sm outline-none"
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
        <div className="flex items-center gap-2 px-4 bg-neutral-800/50 rounded-xl border border-neutral-800">
          <MapPin size={16} className="text-yellow-500" />
          <span className="text-[10px] font-black uppercase truncate">
            {userLocation.city || 'ALL INDIA'}
          </span>
        </div>
      </div>

      {/* Game List */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 bg-neutral-800 rounded-3xl animate-pulse" />)
        ) : filteredGames.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="text-neutral-500" size={32} />
            </div>
            <h3 className="text-xl font-bold">No games found</h3>
            <p className="text-neutral-500">
              {userLocation.city ? `No games currently hosted in ${userLocation.city}.` : "No games match your search."}
            </p>
          </div>
        ) : (
          filteredGames.map(game => (
            <motion.div
              key={game._id}
              whileHover={{ y: -5 }}
              className="bg-neutral-800/50 border border-neutral-800 rounded-3xl overflow-hidden hover:border-yellow-500/30 transition-all cursor-pointer group"
              onClick={() => setSelectedGame(game)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-yellow-500/10 px-3 py-1 rounded-full text-xs font-bold text-yellow-500">
                    {game.gameType}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 font-black">
                    <Coins size={14} /> {game.perPlayerCharge}
                  </div>
                </div>

                <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                  {game.teams.teamA.name} <span className="text-xs text-neutral-500 italic">VS</span> {game.teams.teamB.name}
                </h3>
                <p className="text-sm text-neutral-400 flex items-center gap-1 mb-4">
                  <MapPin size={14} /> {game.ground?.name || 'Self-Arranged Venue'}
                </p>

                <div className="flex items-center gap-4 text-xs font-medium text-neutral-300 bg-neutral-900/50 p-3 rounded-2xl">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-yellow-500" /> {new Date(game.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-yellow-500" /> {game.time}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 bg-neutral-900/30 p-2 rounded-xl">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    <Users size={12} className="text-yellow-500" /> 
                    <span>
                      {game.teams.teamA.slots.filter(s => s.status === 'OPEN').length + game.teams.teamB.slots.filter(s => s.status === 'OPEN').length} / {game.teams.teamA.slots.length + game.teams.teamB.slots.length} Slots Open
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(5, game.teams.teamA.slots.length + game.teams.teamB.slots.length))].map((_, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-neutral-800 bg-neutral-700 flex items-center justify-center text-[6px]">👤</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] border border-neutral-600 font-black">
                    {game.host?.name ? game.host.name[0].toUpperCase() : '?'}
                  </div>
                  <div className="text-[10px]">
                    <p className="text-neutral-500">HOSTED BY</p>
                    <p className="font-bold uppercase tracking-tighter">{game.host?.name || 'Unknown Host'}</p>
                  </div>
                </div>
                <button className="p-2 bg-yellow-500 text-black rounded-lg group-hover:px-4 transition-all flex items-center gap-2 font-bold text-xs">
                  JOIN <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Game Details & Join Modal */}
      <AnimatePresence>
        {selectedGame && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGame(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="relative bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">{selectedGame.gameType} MATCH</h2>
                    <p className="text-neutral-400 mt-1">{selectedGame.ground?.name || 'Venue to be decided'}</p>
                  </div>
                  <button onClick={() => setSelectedGame(null)} className="p-2 bg-neutral-800 rounded-xl">✕</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-800 text-center">
                    <Calendar className="mx-auto mb-2 text-yellow-500" size={20} />
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">Date</p>
                    <p className="text-sm font-black">{new Date(selectedGame.date).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-800 text-center">
                    <Clock className="mx-auto mb-2 text-yellow-500" size={20} />
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">Time</p>
                    <p className="text-sm font-black">{selectedGame.time}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-800 text-center">
                    <Coins className="mx-auto mb-2 text-yellow-500" size={20} />
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">Join Fee</p>
                    <p className="text-sm font-black">{selectedGame.perPlayerCharge}</p>
                  </div>
                  <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-800 text-center">
                    <UserCheck className="mx-auto mb-2 text-yellow-500" size={20} />
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">Umpire</p>
                    <p className="text-sm font-black">{selectedGame.umpire ? 'HIRED' : 'NONE'}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {['teamA', 'teamB'].map((teamKey, tIdx) => (
                    <div key={teamKey}>
                      <h3 className="text-xl font-black mb-4 flex items-center justify-between">
                        {selectedGame.teams[teamKey].name}
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Team {tIdx === 0 ? 'A' : 'B'}</span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                            className={`p-3 rounded-xl border transition-all text-left group ${
                              slot.status === 'OPEN' 
                              ? 'bg-neutral-800/50 border-neutral-700 hover:border-yellow-500' 
                              : 'bg-neutral-800 opacity-50 border-neutral-800'
                            }`}
                          >
                            <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">{slot.role}</p>
                            <p className="font-black truncate">
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

      {/* Join Confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coins size={32} className="text-yellow-500" />
              </div>
              <h2 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">JOIN REQUEST</h2>
              <p className="text-neutral-400 mb-8">
                Joining this game will reserve <span className="text-white font-bold">{selectedGame?.perPlayerCharge} coins</span>. These will be deducted once the host approves you.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-neutral-800 rounded-xl font-bold">BACK</button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    handleJoinGame();
                  }}
                  className="flex-1 py-4 bg-yellow-500 text-black font-black rounded-xl"
                >
                  JOIN
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
          toast.success("Join Request Sent!");
          fetchGames();
        }} 
      />
    </div>
  );
};

export default JoinGames;
