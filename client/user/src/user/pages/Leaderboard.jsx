import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Star, Target, Activity, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('batting'); // 'batting', 'bowling'
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/leaderboard?category=${category}`);
        if (response.data.success) {
          setPlayers(response.data.players);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [category]);

  const topThree = players.slice(0, 3);
  const remaining = players.slice(3);

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
       {/* Sticky Header */}
       <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xs font-black uppercase tracking-[0.2em]">Rankings</h1>
          <div className="w-10" />
       </header>

       {/* Hero Section */}
       <section className="relative h-[350px] flex flex-col items-center justify-center overflow-hidden px-6 text-center pt-16">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-black to-black z-0" />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 space-y-4"
          >
            <Trophy size={48} className="text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-black uppercase tracking-tighter">Global Leaderboard</h1>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Dominating the turf worldwide</p>
          </motion.div>
       </section>

       <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
          {/* Category Toggle */}
          <div className="flex bg-[#111] p-1 rounded-2xl border border-white/5 mb-12 shadow-2xl">
            {['batting', 'bowling'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  category === cat ? 'bg-primary text-black shadow-lg' : 'text-gray-500 hover:text-white'
                }`}
              >
                {cat} Category
              </button>
            ))}
          </div>

          {loading ? (
             <div className="flex flex-col items-center py-20">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Syncing Global Data...</p>
             </div>
          ) : (
            <>
              {/* Podium */}
              {players.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 md:gap-4 items-end mb-16 px-2">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center">
                    {topThree[1] && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center w-full"
                      >
                        <div className="relative mb-3">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-400/30 overflow-hidden bg-[#111]">
                            <img 
                              src={topThree[1].profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[1].name}`} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -bottom-2 -right-1 bg-slate-400 text-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">2</div>
                        </div>
                        <p className="text-[10px] font-black uppercase truncate w-full text-center px-2">{topThree[1].name}</p>
                        <p className="text-primary font-black text-sm">{category === 'batting' ? topThree[1].cricketStats?.totalRuns : topThree[1].cricketStats?.totalWickets}</p>
                      </motion.div>
                    )}
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center">
                    {topThree[0] && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center w-full"
                      >
                        <div className="relative mb-4">
                          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-primary overflow-hidden bg-[#111] shadow-[0_0_40px_rgba(132,204,22,0.4)]">
                            <img 
                              src={topThree[0].profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[0].name}`} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-black px-3 py-1 rounded-full font-black text-[10px] uppercase shadow-xl">GOAT</div>
                        </div>
                        <p className="text-xs font-black uppercase truncate w-full text-center px-2">{topThree[0].name}</p>
                        <p className="text-primary font-black text-xl">{category === 'batting' ? topThree[0].cricketStats?.totalRuns : topThree[0].cricketStats?.totalWickets}</p>
                      </motion.div>
                    )}
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center">
                    {topThree[2] && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center w-full"
                      >
                        <div className="relative mb-3">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-amber-700/30 overflow-hidden bg-[#111]">
                            <img 
                              src={topThree[2].profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[2].name}`} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -bottom-2 -right-1 bg-amber-700 text-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">3</div>
                        </div>
                        <p className="text-[10px] font-black uppercase truncate w-full text-center px-2">{topThree[2].name}</p>
                        <p className="text-primary font-black text-sm">{category === 'batting' ? topThree[2].cricketStats?.totalRuns : topThree[2].cricketStats?.totalWickets}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-[#0A0A0A] rounded-3xl border border-white/5">
                   <p className="text-gray-500 uppercase font-black text-[10px] tracking-widest">No rankings available yet</p>
                </div>
              )}

              {/* List */}
              <div className="space-y-3">
                {remaining.map((player) => (
                  <motion.div 
                    key={player._id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    onClick={() => navigate(`/profile/${player._id}`)}
                    className="flex items-center gap-4 p-4 bg-[#0A0A0A] border border-white/5 rounded-2xl hover:border-primary/20 transition-all group cursor-pointer active:scale-95"
                  >
                    <span className="text-xs font-black text-gray-700 w-6">#{player.rank}</span>
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-[#111]">
                      <img 
                        src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase truncate">{player.name}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest truncate">{player.city || 'Global Player'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-primary">
                        {category === 'batting' ? player.cricketStats?.totalRuns : player.cricketStats?.totalWickets}
                      </p>
                      <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                        {category === 'batting' ? 'Runs' : 'Wickets'}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-800 group-hover:text-primary transition-colors" />
                  </motion.div>
                ))}
              </div>
            </>
          )}
       </div>
    </div>
  );
};

export default Leaderboard;
