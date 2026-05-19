import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, Medal, Star, Target, Activity, Search, 
  ChevronRight, ChevronLeft, BarChart3, Users, 
  Shield, Settings, Crown, LayoutGrid, Clock, MapPin,
  Circle, Zap, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PRI = "#BFF367";
const GRAD = "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter', sans-serif", fontSize: "20px" };

const SidebarIcon = ({ icon: Icon, active, onClick, label }) => (
  <div 
    onClick={onClick}
    className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 group ${active ? 'shadow-[0_0_15px_rgba(191,243,103,0.15)] border' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
    style={active ? { background: GRAD, borderColor: 'transparent' } : {}}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} className={active ? 'text-black' : ''} />
    <span className={`text-[7px] font-black uppercase tracking-widest ${active ? 'text-black' : 'text-gray-600 group-hover:text-gray-400'}`}>{label}</span>
  </div>
);

const Leaderboard = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [category, setCategory] = useState('batting'); // 'batting', 'bowling', or sport-specific stats
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const sports = [
    { name: 'Cricket', icon: Trophy },
    { name: 'Football', icon: Circle },
    { name: 'Pickleball', icon: Target },
    { name: 'Badminton', icon: Zap },
    { name: 'Tennis', icon: Star }
  ];

  // Map sport to categories
  const sportCategories = {
    'Cricket': ['batting', 'bowling'],
    'Football': ['goals', 'assists'],
    'Pickleball': ['singles', 'doubles'],
    'Badminton': ['singles', 'doubles'],
    'Tennis': ['singles', 'doubles']
  };

  useEffect(() => {
    // Reset category when sport changes
    setCategory(sportCategories[selectedSport][0]);
  }, [selectedSport]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/leaderboard?sport=${selectedSport.toLowerCase()}&category=${category}`);
        if (response.data.success) {
          setPlayers(response.data.players || []);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [category, selectedSport]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <div className="w-8 h-10 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)] border border-yellow-300/30 text-black font-black">1</div>;
    if (rank === 2) return <div className="w-8 h-10 bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(148,163,184,0.4)] border border-gray-200/30 text-black font-black">2</div>;
    if (rank === 3) return <div className="w-8 h-10 bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(180,83,9,0.4)] border border-amber-500/30 text-black font-black">3</div>;
    return <span className="text-gray-500 font-bold ml-3">{rank}</span>;
  };

  return (
    <div className="h-screen bg-[#050505] text-white font-sans overflow-hidden flex">
      {/* Sidebar Navigation */}
      <div className="w-24 border-r border-white/5 flex flex-col items-center py-10 gap-6 z-30 bg-[#050505] shrink-0">
        {sports.map((sport) => (
          <SidebarIcon 
            key={sport.name}
            icon={sport.icon} 
            label={sport.name}
            active={selectedSport === sport.name} 
            onClick={() => setSelectedSport(sport.name)}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute top-0 left-0 right-0 h-[400px] z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2073&auto=format&fit=crop" 
            alt="" 
            className="w-full h-full object-cover opacity-20 filter grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 px-8 py-10 max-w-[1400px] mx-auto w-full">
          
          {/* Header Section */}
          <div className="flex flex-col items-center mb-12">
            <Trophy size={40} className="text-[#BFF367] mb-4 drop-shadow-[0_0_10px_rgba(191,243,103,0.5)]" />
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-2" style={HEADING_STYLE}>
              {selectedSport} <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Leaderboard</span>
            </h1>
            <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]" style={SUBHEADING_STYLE}>Dominating the turf worldwide</p>
            <div className="w-12 h-1 rounded-full mt-4" style={{ background: GRAD }}></div>
          </div>

          {/* Category & Filters Row */}
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between mb-8">
            <div className="relative w-full lg:w-[400px]">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:border-[#BFF367]/40 transition-all appearance-none cursor-pointer shadow-2xl text-[#BFF367]"
              >
                {sportCategories[selectedSport].map((cat) => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ')} CATEGORY</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronLeft className="rotate-[-90deg] text-[#BFF367]" size={16} />
              </div>
            </div>

            <div className="flex gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none">
                <select className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-white/30/50 transition-all appearance-none cursor-pointer pr-10">
                  <option>All Time</option>
                  <option>Monthly</option>
                  <option>Weekly</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ChevronLeft className="rotate-[-90deg]" size={12} />
                </div>
              </div>
              <div className="relative flex-1 lg:flex-none">
                <select className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-white/30/50 transition-all appearance-none cursor-pointer pr-10">
                  <option>Worldwide</option>
                  <option>National</option>
                  <option>Regional</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ChevronLeft className="rotate-[-90deg]" size={12} />
                </div>
              </div>
            </div>
          </div>

          {/* Table & Sidebar Flexbox */}
          <div className="flex flex-col xl:flex-row gap-8">
            
            {/* Table Area */}
            <div className="flex-1 bg-[#0A0A0A]/80 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_1fr] p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rank</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Player</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Clock size={12} className="text-[#BFF367]" /> Matches</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Target size={12} className="text-[#BFF367]" /> {category}</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Star size={12} className="text-[#BFF367]" /> Highest</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={12} className="text-[#BFF367]" /> Average</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Activity size={12} className="text-[#BFF367]" /> Strike</div>
              </div>

              <div className="divide-y divide-white/5 min-h-[500px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-40">
                    <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#BFF367', borderTopColor: 'transparent', background: 'none' }} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Retrieving Arena Data...</p>
                  </div>
                ) : players.length > 0 ? (
                  players.map((player, idx) => (
                    <motion.div 
                      key={player._id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`/profile/${player._id}`)}
                      className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_1fr] p-5 items-center hover:bg-white/5 transition-all group cursor-pointer border-l-2 border-transparent hover:border-white/30"
                    >
                      <div className="flex items-center">{getRankIcon(idx + 1)}</div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/50 transition-all">
                          <img src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight group-hover:text-white/70 transition-colors">{player.name}</p>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                            <MapPin size={10} className="text-[#BFF367]/50" /> {player.city || 'Global Elite'}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs font-black text-gray-300 font-mono tracking-tighter ml-3">{player.cricketStats?.matchesPlayed || 0}</div>
                      <div className="text-sm font-black text-white font-mono tracking-tighter ml-3">
                        {category === 'batting' ? player.cricketStats?.totalRuns || 0 : 
                         category === 'bowling' ? player.cricketStats?.totalWickets || 0 : 0}
                      </div>
                      <div className="text-xs font-black text-gray-300 font-mono tracking-tighter ml-3">
                        {category === 'batting' ? player.cricketStats?.highestScore || 0 : player.cricketStats?.bestBowling || '0/0'}
                      </div>
                      <div className="text-xs font-black text-gray-300 font-mono tracking-tighter ml-3">{player.cricketStats?.average || '0.0'}</div>
                      <div className="text-xs font-black text-gray-300 font-mono tracking-tighter ml-3">{player.cricketStats?.strikeRate || '0.0'}</div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-40">
                    <LayoutGrid size={48} className="text-white/5 mb-4" />
                    <p className="text-gray-600 font-black uppercase text-xs tracking-widest">No rankings available yet</p>
                  </div>
                )}
                
                {!loading && players.length > 0 && players.length < 8 && Array(8 - players.length).fill(0).map((_, i) => (
                  <div key={`filler-${i}`} className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_1fr] p-5 items-center opacity-10 grayscale">
                    <div className="ml-3 font-bold text-xs">{players.length + i + 1}</div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/5"></div>
                      <div className="space-y-1">
                        <div className="w-24 h-2 bg-white/10 rounded"></div>
                        <div className="w-16 h-1 bg-white/5 rounded"></div>
                      </div>
                    </div>
                    <div className="text-gray-600 font-black">---</div>
                    <div className="text-gray-600 font-black">---</div>
                    <div className="text-gray-600 font-black">---</div>
                    <div className="text-gray-600 font-black">---</div>
                    <div className="text-gray-600 font-black">---</div>
                  </div>
                ))}
              </div>

              {/* Table Footer */}
              <div className="p-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-center gap-2">
                 <Shield size={12} className="text-[#BFF367]" />
                 <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Rankings are updated periodically based on verified {selectedSport} matches.</p>
                 <Shield size={12} className="text-[#BFF367]" />
              </div>
            </div>

            {/* Sidebar Stats Area */}
            <div className="w-full xl:w-[320px] space-y-6">
              
              <div className="bg-[#0A0A0A] rounded-3xl border border-white/5 p-6 shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-center" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", ...HEADING_STYLE }}>{selectedSport} Overview</h3>
                
                <div className="flex flex-col items-center mb-8 relative">
                  <div className="w-32 h-32 rounded-full border-[8px] border-white/5 border-t-[#BFF367] animate-[spin_10s_linear_infinite] flex items-center justify-center"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(191,243,103,0.3)' }}>
                      <Trophy size={32} style={{ color: '#BFF367' }} />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {[
                    { label: "Total Players", value: "---", icon: Users },
                    { label: "Total Matches", value: "---", icon: Clock },
                    { label: "Total Stats", value: "---", icon: Target },
                    { label: "Season Record", value: "---", icon: Star },
                    { label: "Average Perf", value: "---", icon: BarChart3 },
                    { label: "Activity Rate", value: "---", icon: Activity },
                  ].map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <stat.icon size={16} className="text-[#BFF367]/60 group-hover:text-white/70 transition-colors" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <span className="text-xs font-black text-white font-mono">---</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#111] to-[#050505] rounded-3xl border border-[#BFF367]/20 p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#BFF367]/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-[#BFF367]/10 text-[#BFF367] shadow-inner shadow-[#BFF367]/20">
                    <Crown size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-[#BFF367] uppercase tracking-widest mb-1" style={HEADING_STYLE}>Be the next champion</h4>
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight">Play more matches and climb the leaderboard!</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
