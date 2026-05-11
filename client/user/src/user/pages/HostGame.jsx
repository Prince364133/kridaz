import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '@hooks/useAxiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Trophy, Calendar, Clock, MapPin, 
  Users, UserCheck, ChevronRight, Search,
  ArrowLeft, Coins, CheckCircle2, AlertCircle,
  ShieldCheck, Zap, Trash2, Plus, ImageIcon
} from 'lucide-react';
import CoinAnimation from '../components/CoinAnimation';

const MOCK_TEAM_IMAGES = [
  { label: "Stadium Night",  url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80" },
  { label: "Football Arena", url: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80" },
  { label: "Cricket Ground", url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },
  { label: "Indoor Court",   url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" },
  { label: "Night Match",    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80" },
  { label: "Floodlit Pitch", url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80" },
  { label: "Basketball",     url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80" },
  { label: "Running Track",  url: "https://images.unsplash.com/photo-1564769610726-59cead6a6f8f?w=800&q=80" },
];

const SPORT_DEFAULTS = {
  "Cricket": [
    { role: "Batsman", count: 4 },
    { role: "Bowler", count: 4 },
    { role: "All-rounder", count: 2 },
    { role: "Wicket Keeper", count: 1 }
  ],
  "Football": [
    { role: "Forward", count: 3 },
    { role: "Midfielder", count: 3 },
    { role: "Defender", count: 4 },
    { role: "GK", count: 1 }
  ],
  "Basketball": [
    { role: "Guard", count: 2 },
    { role: "Forward", count: 2 },
    { role: "Center", count: 1 }
  ],
  "Volleyball": [
    { role: "Attacker", count: 2 },
    { role: "Setter", count: 1 },
    { role: "Blocker", count: 2 },
    { role: "Libero", count: 1 }
  ],
  "Badminton": [
    { role: "Player", count: 2 }
  ],
  "Tennis": [
    { role: "Player", count: 2 }
  ],
  "Table Tennis": [
    { role: "Player", count: 2 }
  ],
  "Pickleball": [
    { role: "Player", count: 2 }
  ]
};

const HostGame = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [gameData, setGameData] = useState({
    gameType: '',
    date: '',
    time: '',
    groundId: null,
    umpireId: null,
    perPlayerCharge: 0,
    city: user?.city || '',
    state: user?.state || '',
    teamA: { name: 'Team A', slots: [], image: MOCK_TEAM_IMAGES[0].url },
    teamB: { name: 'Team B', slots: [], image: MOCK_TEAM_IMAGES[1].url }
  });

  const [grounds, setGrounds] = useState([]);
  const [umpires, setUmpires] = useState([]);
  const [selectedGround, setSelectedGround] = useState(null);
  const [selectedUmpire, setSelectedUmpire] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (user?.city && user?.state) {
      setGameData(prev => ({ ...prev, city: user.city, state: user.state }));
    }
  }, [user]);

  const fetchGrounds = async () => {
    try {
      const res = await axiosInstance.get(`/api/hosted-game/grounds?city=${gameData.city}&state=${gameData.state}&sportType=${gameData.gameType}`);
      setGrounds(res.data.grounds);
    } catch (err) {
      toast.error("Failed to fetch grounds");
    }
  };

  const fetchUmpires = async () => {
    try {
      const res = await axiosInstance.get(`/api/hosted-game/umpires?city=${gameData.city}&state=${gameData.state}&gameType=${gameData.gameType}`);
      setUmpires(res.data.umpires);
    } catch (err) {
      toast.error("Failed to fetch umpires");
    }
  };

  useEffect(() => {
    if (step === 2 && gameData.gameType) {
      fetchGrounds();
      fetchUmpires();
    }
  }, [step, gameData.gameType, gameData.city, gameData.state]);

  const totalCost = (selectedGround?.pricePerHour || 0) + (selectedUmpire?.price || 0);

  const initSlots = (sport) => {
    const defaults = SPORT_DEFAULTS[sport] || [{ role: "Player", count: 5 }];
    const slots = [];
    defaults.forEach(d => {
      for (let i = 0; i < d.count; i++) {
        slots.push({ role: d.role, status: "OPEN" });
      }
    });
    
    setGameData(prev => ({
      ...prev,
      gameType: sport,
      teamA: { ...prev.teamA, slots: [...slots] },
      teamB: { ...prev.teamB, slots: [...slots] }
    }));
  };

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/hosted-game/create", gameData);
      if (res.data.success) {
        setShowCoinAnim(true);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create game";
      toast.error(errorMsg);
      if (errorMsg.toLowerCase().includes("insufficient coins") || errorMsg.toLowerCase().includes("insufficient wallet balance")) {
        navigate("/wallet");
      }
    } finally {
      setLoading(false);
    }
  };

  const addSlot = (teamKey) => {
    const newSlots = [...gameData[teamKey].slots, { role: 'Player', status: 'OPEN' }];
    setGameData({ ...gameData, [teamKey]: { ...gameData[teamKey], slots: newSlots } });
  };

  const removeSlot = (teamKey, idx) => {
    const newSlots = gameData[teamKey].slots.filter((_, i) => i !== idx);
    setGameData({ ...gameData, [teamKey]: { ...gameData[teamKey], slots: newSlots } });
  };

  const updateSlotRole = (teamKey, idx, role) => {
    const newSlots = [...gameData[teamKey].slots];
    newSlots[idx].role = role;
    setGameData({ ...gameData, [teamKey]: { ...gameData[teamKey], slots: newSlots } });
  };

  const handleTeamImageUpload = (teamKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setGameData(prev => ({
        ...prev,
        [teamKey]: { ...prev[teamKey], image: ev.target.result, imageName: file.name }
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#000] text-white pt-24 pb-24 px-6">
      <div className={`max-w-4xl mx-auto transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Host a Match</h1>
            <p className="text-neutral-500 font-medium">Create a game and find players in your area</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s}
                className={`w-10 h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-yellow-500' : 'bg-neutral-800'}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Sport & Time */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <section>
              <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6 block">Select Sport</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.keys(SPORT_DEFAULTS).map(sport => (
                  <button
                    key={sport}
                    onClick={() => initSlots(sport)}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${
                      gameData.gameType === sport 
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' 
                      : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Trophy className={`transition-transform duration-500 group-hover:scale-110 ${gameData.gameType === sport ? 'text-yellow-500' : 'text-neutral-600'}`} size={32} />
                    <span className="text-sm font-black uppercase tracking-wider">{sport}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <section className="space-y-6">
                <label className="text-xs font-black text-neutral-400 uppercase tracking-widest block">Date & Time</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                    <input 
                      type="date"
                      value={gameData.date}
                      onChange={(e) => setGameData({ ...gameData, date: e.target.value })}
                      className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-yellow-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="relative group">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                    <input 
                      type="time"
                      value={gameData.time}
                      onChange={(e) => setGameData({ ...gameData, time: e.target.value })}
                      className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-yellow-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <label className="text-xs font-black text-neutral-400 uppercase tracking-widest block">Location (State & City)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder="City"
                      value={gameData.city}
                      onChange={(e) => setGameData({ ...gameData, city: e.target.value })}
                      className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-yellow-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <input 
                    type="text"
                    placeholder="State"
                    value={gameData.state}
                    onChange={(e) => setGameData({ ...gameData, state: e.target.value })}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl py-4 px-6 text-sm focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>
              </section>
            </div>

            <button
              disabled={!gameData.gameType || !gameData.date || !gameData.time || !gameData.city || !gameData.state}
              onClick={() => setStep(2)}
              className="w-full py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:grayscale text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)]"
            >
              CONTINUE TO VENUE SELECTION
            </button>
          </motion.div>
        )}

        {/* Step 2: Grounds & Umpires */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Grounds */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Select Ground</label>
                  <span className="text-[10px] text-neutral-500 font-black px-3 py-1 bg-neutral-800 rounded-full uppercase tracking-tighter">Optional</span>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                  {grounds.length > 0 ? grounds.map(g => (
                    <div 
                      key={g._id}
                      onClick={() => {
                        setSelectedGround(g);
                        setGameData({ ...gameData, groundId: g._id });
                      }}
                      className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group ${
                        selectedGround?._id === g._id 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex gap-5">
                        <img src={g.images[0]} className="w-24 h-24 rounded-2xl object-cover" />
                        <div className="flex-1">
                          <h3 className="font-black text-base mb-1 tracking-tight">{g.name}</h3>
                          <p className="text-[11px] text-neutral-500 mb-3 flex items-center gap-1 font-medium">
                            <MapPin size={12} /> {g.location}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-yellow-500 font-black text-sm">₹{g.pricePerHour}/hr</span>
                            {selectedGround?._id === g._id && <CheckCircle2 className="text-yellow-500" size={20} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 border-2 border-dashed border-neutral-800 rounded-3xl text-center bg-neutral-900/30">
                      <p className="text-neutral-500 text-sm italic font-medium">No {gameData.gameType} grounds found in {gameData.city}, {gameData.state}.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Umpires */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Hire Umpire / Coach</label>
                  <span className="text-[10px] text-neutral-500 font-black px-3 py-1 bg-neutral-800 rounded-full uppercase tracking-tighter">Optional</span>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                  {umpires.length > 0 ? umpires.map(u => (
                    <div 
                      key={u._id}
                      onClick={() => {
                        if (selectedUmpire?._id === u._id) {
                          setSelectedUmpire(null);
                          setGameData({ ...gameData, umpireId: null });
                        } else {
                          setSelectedUmpire(u);
                          setGameData({ ...gameData, umpireId: u._id });
                        }
                      }}
                      className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group ${
                        selectedUmpire?._id === u._id 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <img src={u.profilePicture || "https://ui-avatars.com/api/?name="+u.name} className="w-16 h-16 rounded-full object-cover border-2 border-neutral-800" />
                        <div className="flex-1">
                          <h3 className="font-black text-base mb-1 tracking-tight">{u.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-500 font-black text-sm">₹{u.price}</span>
                            <div className="flex gap-1">
                              {u.gameTypes?.slice(0, 2).map(t => (
                                <span key={t} className="text-[8px] px-2 py-0.5 bg-neutral-800 text-neutral-500 rounded-full font-black uppercase tracking-tighter">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {selectedUmpire?._id === u._id && <CheckCircle2 className="text-yellow-500" size={24} />}
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 border-2 border-dashed border-neutral-800 rounded-3xl text-center bg-neutral-900/30">
                      <p className="text-neutral-500 text-sm italic font-medium">No {gameData.gameType} experts available in {gameData.city}, {gameData.state}.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-5 bg-neutral-900 text-neutral-400 font-black rounded-3xl border-2 border-neutral-800 hover:border-neutral-700 transition-all text-lg">BACK</button>
              <button
                onClick={() => setStep(3)}
                className="flex-[2] py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)]"
              >
                SETUP TEAMS
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Team Configuration */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <div className="bg-neutral-900/50 border-2 border-neutral-800 rounded-[40px] p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-neutral-800 hidden md:block" />
                
                {["teamA", "teamB"].map((teamKey) => (
                  <div key={teamKey} className="space-y-8">
                    {/* Team Header */}
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${teamKey === 'teamA' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                        {teamKey === 'teamA' ? 'A' : 'B'}
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Team Name</label>
                        <input 
                          className="bg-transparent text-2xl font-black border-none outline-none focus:ring-0 w-full p-0 tracking-tight"
                          value={gameData[teamKey].name}
                          onChange={(e) => setGameData({
                            ...gameData,
                            [teamKey]: { ...gameData[teamKey], name: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    {/* Team Image Upload */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">Card Background Image</label>

                      {/* Preview + Upload Row */}
                      <div className="flex items-center gap-4">
                        {/* Preview */}
                        <div className="relative w-28 h-18 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-neutral-900" style={{ height: '70px' }}>
                          <img
                            src={gameData[teamKey].image}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>

                        {/* Upload button */}
                        <label
                          htmlFor={`img-upload-${teamKey}`}
                          className="flex-1 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#CCFF00]/30 rounded-2xl cursor-pointer hover:border-[#CCFF00]/60 hover:bg-[#CCFF00]/5 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center group-hover:bg-[#CCFF00]/20 transition-all">
                            <ImageIcon size={16} className="text-[#CCFF00]" />
                          </div>
                          <span className="text-[10px] font-black text-[#CCFF00]/70 uppercase tracking-widest">
                            {gameData[teamKey].imageName ? 'Change Photo' : 'Upload Photo'}
                          </span>
                          {gameData[teamKey].imageName && (
                            <span className="text-[8px] text-white/30 truncate max-w-[120px]">{gameData[teamKey].imageName}</span>
                          )}
                          <input
                            id={`img-upload-${teamKey}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleTeamImageUpload(teamKey, e)}
                          />
                        </label>
                      </div>

                      {/* Quick-select presets */}
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Or choose a preset</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {MOCK_TEAM_IMAGES.map((img) => (
                            <button
                              key={img.url}
                              onClick={() => setGameData(prev => ({ ...prev, [teamKey]: { ...prev[teamKey], image: img.url, imageName: null } }))}
                              className={`relative rounded-xl overflow-hidden border-2 transition-all shrink-0 w-20 aspect-video ${
                                gameData[teamKey].image === img.url
                                  ? 'border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                                  : 'border-transparent hover:border-white/20'
                              }`}
                            >
                              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                              {gameData[teamKey].image === img.url && (
                                <div className="absolute inset-0 bg-[#CCFF00]/20 flex items-center justify-center">
                                  <CheckCircle2 size={14} className="text-[#CCFF00]" />
                                </div>
                              )}
                              <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-[6px] font-black text-white text-center py-0.5 uppercase">{img.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Slots */}
                    <div className="space-y-3">
                      {gameData[teamKey].slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-3 group">
                          <div className="flex-1 flex items-center gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl group-hover:border-[#CCFF00]/30 transition-all">
                            <input 
                              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none w-full"
                              value={slot.role}
                              onChange={(e) => updateSlotRole(teamKey, idx, e.target.value)}
                            />
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-tighter bg-neutral-800 px-2 py-1 rounded">OPEN</span>
                          </div>
                          <button 
                            onClick={() => removeSlot(teamKey, idx)}
                            className="p-3 text-neutral-600 hover:text-red-500 transition-colors bg-neutral-900 rounded-xl border border-neutral-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addSlot(teamKey)}
                      className="w-full py-4 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500 text-xs font-black uppercase tracking-widest hover:border-[#CCFF00]/30 hover:text-[#CCFF00] transition-all flex items-center justify-center gap-2 bg-neutral-900/30"
                    >
                      <Plus size={16} /> Add More Slots
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-neutral-900 p-8 rounded-[40px] border-2 border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Entry Charge per Player</span>
                <p className="text-[11px] text-neutral-500 font-medium italic">Recommended: Total Cost ({totalCost}) / Total Players</p>
              </div>
              <div className="flex items-center gap-4 bg-black p-2 rounded-2xl border border-neutral-800">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <Coins className="text-yellow-500" size={24} />
                </div>
                <input 
                  type="number"
                  value={gameData.perPlayerCharge}
                  onChange={(e) => setGameData({ ...gameData, perPlayerCharge: parseInt(e.target.value) || 0 })}
                  className="w-24 bg-transparent border-none text-center font-black text-2xl outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-5 bg-neutral-900 text-neutral-400 font-black rounded-3xl border-2 border-neutral-800 hover:border-neutral-700 transition-all text-lg">BACK</button>
              <button
                onClick={() => setStep(4)}
                className="flex-[2] py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)]"
              >
                PREVIEW MATCH
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Preview & Finalize */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
            <div className="bg-yellow-500/10 border-2 border-yellow-500/20 p-10 rounded-[40px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                  <div className="space-y-3">
                    <span className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Confirmed Match
                    </span>
                    <h2 className="text-5xl font-black tracking-tight">{gameData.gameType} Battle</h2>
                    <div className="flex flex-wrap items-center gap-4 text-yellow-500 font-black text-sm uppercase tracking-widest">
                      <span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-yellow-500/20"><Calendar size={16} /> {gameData.date}</span>
                      <span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-yellow-500/20"><Clock size={16} /> {gameData.time}</span>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl text-center min-w-[180px]">
                    <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mb-1">Total Reservation</p>
                    <p className="text-4xl font-black text-yellow-500 flex items-center justify-center gap-2">
                      <Coins size={32} /> {totalCost}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="bg-black/20 border border-white/5 p-6 rounded-3xl flex items-center gap-5">
                    <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center">
                      <MapPin className="text-yellow-500" size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mb-1">Venue</p>
                      <p className="font-black text-lg truncate leading-none">{selectedGround?.name || 'Self-Arranged'}</p>
                      <p className="text-xs text-neutral-500 mt-1 font-medium italic">{selectedGround?.location}</p>
                    </div>
                  </div>
                  <div className="bg-black/20 border border-white/5 p-6 rounded-3xl flex items-center gap-5">
                    <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center">
                      <UserCheck className="text-yellow-500" size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mb-1">Expert</p>
                      <p className="font-black text-lg truncate leading-none">{selectedUmpire?.name || 'No Umpire'}</p>
                      <p className="text-xs text-neutral-500 mt-1 font-medium italic">{selectedUmpire?.role || 'Professional'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-[32px]">
                  <div className="flex -space-x-3">
                    {gameData.teamA.slots.slice(0, 5).map((_, i) => (
                      <div key={i} className="w-12 h-12 rounded-2xl border-4 border-neutral-900 bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-black">
                        A
                      </div>
                    ))}
                    {gameData.teamA.slots.length > 5 && <div className="w-12 h-12 rounded-2xl border-4 border-neutral-900 bg-neutral-800 flex items-center justify-center text-[10px] font-black">+{gameData.teamA.slots.length - 5}</div>}
                  </div>
                  <div className="px-6 py-2 bg-neutral-800 rounded-2xl border border-neutral-700 text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] italic">VS</div>
                  <div className="flex -space-x-3">
                    {gameData.teamB.slots.slice(0, 5).map((_, i) => (
                      <div key={i} className="w-12 h-12 rounded-2xl border-4 border-neutral-900 bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-black">
                        B
                      </div>
                    ))}
                    {gameData.teamB.slots.length > 5 && <div className="w-12 h-12 rounded-2xl border-4 border-neutral-900 bg-neutral-800 flex items-center justify-center text-[10px] font-black">+{gameData.teamB.slots.length - 5}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(3)} className="flex-1 py-5 bg-neutral-900 text-neutral-400 font-black rounded-3xl border-2 border-neutral-800 hover:border-neutral-700 transition-all text-lg">BACK</button>
              <button
                onClick={() => setShowConfirm(true)}
                className="flex-[2] py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all text-xl shadow-[0_20px_40px_rgba(234,179,8,0.2)]"
              >
                CONFIRM & HOST GAME
              </button>
            </div>
          </motion.div>
        )}

      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="relative bg-neutral-900 border border-neutral-800 p-10 rounded-[40px] max-w-sm w-full text-center shadow-2xl">
              <div className="w-24 h-24 bg-yellow-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                <Coins size={48} className="text-yellow-500" />
              </div>
              <h2 className="text-3xl font-black mb-3 tracking-tight">Reserve Coins</h2>
              <p className="text-neutral-500 font-medium mb-10 leading-relaxed text-sm">
                Hosting this game will reserve <span className="text-white font-black">{totalCost} coins</span> from your wallet. It will be deducted only when the match is confirmed.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-neutral-800 rounded-2xl font-black text-xs uppercase tracking-widest text-neutral-400">Cancel</button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    handleCreateGame();
                  }}
                  className="flex-1 py-4 bg-yellow-500 text-black font-black rounded-2xl shadow-lg shadow-yellow-500/20 text-xs uppercase tracking-widest"
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
        amount={totalCost} 
        onComplete={() => {
          setShowCoinAnim(false);
          toast.success("Match Hosted Successfully!");
          navigate("/my-hosted-games");
        }} 
      />

      {loading && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-yellow-500 font-black uppercase tracking-[0.3em] text-xs">Reserving Coins...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostGame;
