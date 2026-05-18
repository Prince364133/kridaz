import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '@hooks/useAxiosInstance';
import { toast } from 'react-hot-toast';
import SlotPickerPopup from '../components/SlotPickerPopup';
import { 
  Trophy, Calendar, Clock, MapPin, 
  Users, UserCheck, ChevronRight, Search,
  ArrowLeft, Coins, CheckCircle2, AlertCircle,
  ShieldCheck, Zap, Trash2, Plus, ImageIcon, ChevronUp, ChevronDown,
  Gift, Mail, Info, ShieldAlert
} from 'lucide-react';
import { useGetMyTeamsQuery } from '@redux/api/teamApi';
import CoinAnimation from '../components/CoinAnimation';
import { fetchStates, fetchCities } from '../utils/locationService';

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
  const [activeSlotPicker, setActiveSlotPicker] = useState(null);

  // Form State
  const [gameData, setGameData] = useState({
    gameType: '',
    date: '',
    time: '',
    groundId: null,
    umpireId: null,
    streamerId: null,
    perPlayerCharge: 0,
    gameMode: 'PROFESSIONAL',
    quickPlayerCount: 0,
    quickSlotsData: [],
    city: user?.city || '',
    state: user?.state || '',
    teamA: { name: 'Team A', slots: [], image: MOCK_TEAM_IMAGES[0].url },
    teamB: { name: 'Team B', slots: [], image: MOCK_TEAM_IMAGES[1].url }
  });

  const [grounds, setGrounds] = useState([]);
  const [umpires, setUmpires] = useState([]);
  const [streamers, setStreamers] = useState([]);
  const [selectedGround, setSelectedGround] = useState(null);
  const [selectedUmpire, setSelectedUmpire] = useState(null);
  const [selectedStreamer, setSelectedStreamer] = useState(null);

  // Location dropdown state
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Custom Umpire Modal
  const [showCustomUmpireModal, setShowCustomUmpireModal] = useState(false);
  const [customUmpireData, setCustomUmpireData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Clock picker state
  const [showClock, setShowClock] = useState(false);
  const [clockHour, setClockHour] = useState(9);
  const [clockMinute, setClockMinute] = useState(0);
  const [clockAmPm, setClockAmPm] = useState('AM');

  // Team Fill state
  const [showTeamFillModal, setShowTeamFillModal] = useState(false);
  const [fillingTeamKey, setFillingTeamKey] = useState(null); // 'teamA', 'teamB', or 'quick'
  const { data: teamsData } = useGetMyTeamsQuery();
  const myTeams = teamsData?.teams || [];

  const handleFillFromTeam = (team) => {
    if (fillingTeamKey === 'quick') {
      const newSlots = [...gameData.quickSlotsData];
      let slotIdx = 1; // Start from slot 2 (index 1) as slot 1 is host
      
      team.members.forEach(member => {
        if (slotIdx < newSlots.length && member.user?._id !== user?._id) {
          if (member.user) {
            newSlots[slotIdx] = { ...newSlots[slotIdx], userId: member.user._id, name: member.user.name, status: 'HELD' };
          } else {
            newSlots[slotIdx] = { ...newSlots[slotIdx], customPlayer: { name: member.name, email: member.email }, status: 'HELD' };
          }
          slotIdx++;
        }
      });
      setGameData({ ...gameData, quickSlotsData: newSlots });
    } else {
      // Professional mode
      const teamKey = fillingTeamKey;
      const newSlots = [...gameData[teamKey].slots];
      let slotIdx = 0;
      
      team.members.forEach(member => {
        if (slotIdx < newSlots.length) {
          if (member.user) {
            newSlots[slotIdx] = { ...newSlots[slotIdx], userId: member.user._id, name: member.user.name, status: 'HELD' };
          } else {
            newSlots[slotIdx] = { ...newSlots[slotIdx], customPlayer: { name: member.name, email: member.email }, status: 'HELD' };
          }
          slotIdx++;
        }
      });
      setGameData({ ...gameData, [teamKey]: { ...gameData[teamKey], slots: newSlots } });
    }
    setShowTeamFillModal(false);
    toast.success(`Slots filled from ${team.name}`);
  };

  const formatTime = (h, m, ampm) => {
    const hour24 = ampm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const displayTime = (h, m, ampm) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  useEffect(() => {
    setMounted(true);
    if (user?.city && user?.state) {
      setGameData(prev => ({ ...prev, city: user.city, state: user.state }));
    }

    // Check for popup trigger in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('popup') === 'customUmpire') {
      setShowCustomUmpireModal(true);
    }

    // Load Indian states on mount
    const loadStates = async () => {
      setLoadingStates(true);
      const data = await fetchStates();
      setStates(data);
      setLoadingStates(false);
    };
    loadStates();
  }, [user]);

  // When state changes, load its cities
  useEffect(() => {
    if (!gameData.state) { setCities([]); return; }
    const loadCities = async () => {
      setLoadingCities(true);
      const data = await fetchCities(gameData.state);
      setCities(data);
      setLoadingCities(false);
    };
    loadCities();
  }, [gameData.state]);

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

  const fetchStreamers = async () => {
    try {
      const res = await axiosInstance.get(`/api/hosted-game/streamers?city=${gameData.city}&state=${gameData.state}&gameType=${gameData.gameType}`);
      setStreamers(res.data.streamers);
    } catch (err) {
      toast.error("Failed to fetch streamers");
    }
  };

  useEffect(() => {
    if (step === 3 && gameData.gameType) {
      fetchGrounds();
      fetchUmpires();
      fetchStreamers();
    }
  }, [step, gameData.gameType, gameData.city, gameData.state]);

  const totalCost = (selectedGround?.pricePerHour || 0) + (selectedUmpire?.price || 0) + (selectedStreamer?.price || 0);

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

  const initQuickSlots = () => {
    const slots = [];
    // First slot is always the host
    slots.push({ role: 'Player', userId: user?._id, name: user?.name, status: 'JOINED' });
    
    // Remaining slots are open
    for (let i = 1; i < gameData.quickPlayerCount; i++) {
      slots.push({ role: 'Player', status: 'OPEN' });
    }
    
    setGameData(prev => ({ ...prev, quickSlotsData: slots }));
    setStep(4.5);
  };

  const handleSlotSelection = (player) => {
    if (!activeSlotPicker) return;
    const { idx } = activeSlotPicker;
    
    const newSlots = [...gameData.quickSlotsData];
    if (player.isCustom) {
      newSlots[idx] = { 
        ...newSlots[idx], 
        customPlayer: { name: player.name || 'Guest', email: player.email },
        status: 'HELD' 
      };
    } else {
      newSlots[idx] = { 
        ...newSlots[idx], 
        userId: player._id, 
        name: player.name,
        status: 'HELD' 
      };
    }
    
    setGameData({ ...gameData, quickSlotsData: newSlots });
    setActiveSlotPicker(null);
  };

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const payload = {
        ...gameData,
        customUmpireData: customUmpireData.name ? customUmpireData : undefined
      };
      const res = await axiosInstance.post("/api/hosted-game/create", payload);
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
            {[1, 2, 3, 4, 5].map(s => (
              <div 
                key={s}
                className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-yellow-500' : 'bg-neutral-800'}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Game Mode Selection */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12 max-w-2xl mx-auto py-10">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black tracking-tight">Select Game Mode</h2>
              <p className="text-neutral-500 font-medium">How do you want to organize your players?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => setGameData({ ...gameData, gameMode: 'QUICK' })}
                className={`p-8 rounded-[40px] border-4 transition-all text-left group relative overflow-hidden ${
                  gameData.gameMode === 'QUICK' 
                  ? 'border-yellow-500 bg-yellow-500/10' 
                  : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                }`}
              >
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                  gameData.gameMode === 'QUICK' ? 'bg-yellow-500 text-black' : 'bg-neutral-800 text-neutral-500'
                }`}>
                  <Zap size={32} />
                </div>
                <h3 className={`text-2xl font-black mb-2 ${gameData.gameMode === 'QUICK' ? 'text-white' : 'text-neutral-400'}`}>Quick Game</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                  One simple pool of players. No team split required. Best for casual matches or single-team practice.
                </p>
                {gameData.gameMode === 'QUICK' && (
                  <div className="absolute top-6 right-6">
                    <CheckCircle2 className="text-yellow-500" size={24} />
                  </div>
                )}
              </button>

              <button
                onClick={() => setGameData({ ...gameData, gameMode: 'PROFESSIONAL' })}
                className={`p-8 rounded-[40px] border-4 transition-all text-left group relative overflow-hidden ${
                  gameData.gameMode === 'PROFESSIONAL' 
                  ? 'border-yellow-500 bg-yellow-500/10' 
                  : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                }`}
              >
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${
                  gameData.gameMode === 'PROFESSIONAL' ? 'bg-yellow-500 text-black' : 'bg-neutral-800 text-neutral-500'
                }`}>
                  <ShieldCheck size={32} />
                </div>
                <h3 className={`text-2xl font-black mb-2 ${gameData.gameMode === 'PROFESSIONAL' ? 'text-white' : 'text-neutral-400'}`}>Professional</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                  Two balanced teams (A vs B). Assign specific roles and define unique team identities.
                </p>
                {gameData.gameMode === 'PROFESSIONAL' && (
                  <div className="absolute top-6 right-6">
                    <CheckCircle2 className="text-yellow-500" size={24} />
                  </div>
                )}
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                disabled={!gameData.gameMode}
                className="flex-1 py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)] uppercase tracking-widest disabled:opacity-50"
              >
                Next: Sport & Time
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Sport & Time */}
        {step === 2 && (
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

                  {/* Clock Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowClock(v => !v)}
                      className="w-full flex items-center gap-3 bg-neutral-900 border-2 border-neutral-800 hover:border-yellow-500/50 rounded-2xl py-4 px-4 text-sm font-bold transition-all"
                    >
                      <Clock size={18} className="text-neutral-500" />
                      <span className={gameData.time ? 'text-white' : 'text-neutral-500'}>
                        {gameData.time
                          ? displayTime(clockHour, clockMinute, clockAmPm)
                          : 'Select Time'}
                      </span>
                    </button>

                    {/* Clock Dropdown */}
                    {showClock && (
                      <div className="absolute top-full left-0 mt-2 z-50 bg-[#111] border-2 border-neutral-700 rounded-3xl p-5 shadow-2xl shadow-black/60 w-64">
                        <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-4 text-center">Pick Time</p>

                        <div className="flex items-center justify-center gap-2">
                          {/* Hour */}
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={() => setClockHour(h => h === 12 ? 1 : h + 1)} className="p-1 text-neutral-500 hover:text-yellow-500 transition-colors"><ChevronUp size={16} /></button>
                            <div className="w-14 h-12 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center text-xl font-black text-white">
                              {String(clockHour).padStart(2, '0')}
                            </div>
                            <button onClick={() => setClockHour(h => h === 1 ? 12 : h - 1)} className="p-1 text-neutral-500 hover:text-yellow-500 transition-colors"><ChevronDown size={16} /></button>
                            <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">HR</span>
                          </div>

                          <span className="text-2xl font-black text-yellow-500 mb-4">:</span>

                          {/* Minute */}
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={() => setClockMinute(m => m === 55 ? 0 : m + 5)} className="p-1 text-neutral-500 hover:text-yellow-500 transition-colors"><ChevronUp size={16} /></button>
                            <div className="w-14 h-12 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center text-xl font-black text-white">
                              {String(clockMinute).padStart(2, '0')}
                            </div>
                            <button onClick={() => setClockMinute(m => m === 0 ? 55 : m - 5)} className="p-1 text-neutral-500 hover:text-yellow-500 transition-colors"><ChevronDown size={16} /></button>
                            <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">MIN</span>
                          </div>

                          {/* AM/PM */}
                          <div className="flex flex-col gap-1 ml-1">
                            {['AM', 'PM'].map(period => (
                              <button
                                key={period}
                                onClick={() => setClockAmPm(period)}
                                className={`w-12 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                  clockAmPm === period
                                    ? 'bg-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                                    : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                                }`}
                              >
                                {period}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setGameData({ ...gameData, time: formatTime(clockHour, clockMinute, clockAmPm) });
                            setShowClock(false);
                          }}
                          className="w-full mt-4 py-3 bg-yellow-500 text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all"
                        >
                          Set Time
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <label className="text-xs font-black text-neutral-400 uppercase tracking-widest block">Location (State & City)</label>
                <div className="grid grid-cols-2 gap-4">
                  {/* State Dropdown */}
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-yellow-500 transition-colors pointer-events-none" size={18} />
                    <select
                      value={gameData.state}
                      onChange={(e) => setGameData({ ...gameData, state: e.target.value, city: '' })}
                      disabled={loadingStates}
                      className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl py-4 pl-12 pr-4 appearance-none text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold disabled:opacity-50"
                    >
                      <option value="">{loadingStates ? 'Loading...' : 'Select State'}</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* City Dropdown */}
                  <select
                    value={gameData.city}
                    onChange={(e) => setGameData({ ...gameData, city: e.target.value })}
                    disabled={!gameData.state || loadingCities}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl py-4 px-4 appearance-none text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold disabled:opacity-50"
                  >
                    <option value="">
                      {loadingCities ? 'Loading cities...' : !gameData.state ? 'Select state first' : 'Select City'}
                    </option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </section>
            </div>

            <button
              disabled={!gameData.gameType || !gameData.date || !gameData.time || !gameData.city || !gameData.state}
              onClick={() => setStep(3)}
              className="w-full py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:grayscale text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)]"
            >
              CONTINUE TO VENUE SELECTION
            </button>
            <button onClick={() => setStep(1)} className="w-full mt-4 py-4 bg-neutral-900 text-neutral-400 font-black rounded-3xl border-2 border-neutral-800 hover:border-neutral-700 transition-all text-sm uppercase tracking-widest">Back to Mode Selection</button>
          </motion.div>
        )}

        {/* Step 3: Grounds & Umpires */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Hire Umpire / Coach</label>
                    <button 
                      onClick={() => setShowCustomUmpireModal(true)}
                      className="p-1 bg-yellow-500 text-black rounded-full hover:bg-yellow-400 transition-all shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-black px-3 py-1 bg-neutral-800 rounded-full uppercase tracking-tighter">Optional</span>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                  {customUmpireData.name && (
                    <div 
                      className="p-5 rounded-3xl border-2 border-yellow-500 bg-yellow-500/10 transition-all cursor-default"
                    >
                      <div className="flex gap-5 items-center">
                        <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center text-yellow-500 border border-yellow-500/30">
                          <Plus size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-black text-base tracking-tight">{customUmpireData.name}</h3>
                            <button 
                              onClick={() => setCustomUmpireData({ name: '', email: '', phone: '' })}
                              className="text-neutral-500 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-[11px] text-neutral-400 font-medium flex items-center gap-2">
                            <Mail size={10} /> {customUmpireData.email}
                          </p>
                          <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-500 text-[8px] font-black text-black rounded uppercase tracking-widest">Custom Invite</span>
                        </div>
                      </div>
                    </div>
                  )}
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

              {/* Streamers */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Hire Streamer</label>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-black px-3 py-1 bg-neutral-800 rounded-full uppercase tracking-tighter">Optional</span>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                  {streamers.length > 0 ? streamers.map(s => (
                    <div 
                      key={s._id}
                      onClick={() => {
                        if (selectedStreamer?._id === s._id) {
                          setSelectedStreamer(null);
                          setGameData({ ...gameData, streamerId: null });
                        } else {
                          setSelectedStreamer(s);
                          setGameData({ ...gameData, streamerId: s._id });
                        }
                      }}
                      className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group ${
                        selectedStreamer?._id === s._id 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <img src={s.profilePicture || "https://ui-avatars.com/api/?name="+s.name} className="w-16 h-16 rounded-full object-cover border-2 border-neutral-800" />
                        <div className="flex-1">
                          <h3 className="font-black text-base mb-1 tracking-tight">{s.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-500 font-black text-sm">₹{s.price}</span>
                            <div className="flex gap-1">
                              {s.gameTypes?.slice(0, 2).map(t => (
                                <span key={t} className="text-[8px] px-2 py-0.5 bg-neutral-800 text-neutral-500 rounded-full font-black uppercase tracking-tighter">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {selectedStreamer?._id === s._id && <CheckCircle2 className="text-yellow-500" size={24} />}
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 border-2 border-dashed border-neutral-800 rounded-3xl text-center bg-neutral-900/30">
                      <p className="text-neutral-500 text-sm italic font-medium">No {gameData.gameType} streamers available in {gameData.city}, {gameData.state}.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-5 bg-neutral-900 text-neutral-400 font-black rounded-3xl border-2 border-neutral-800 hover:border-neutral-700 transition-all text-lg uppercase tracking-widest">Back</button>
              <button
                onClick={() => setStep(4)}
                className="flex-[2] py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)] uppercase tracking-widest"
              >
                Continue to Player Setup
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Setup (Quick vs Professional) */}
        {step === 4 && gameData.gameMode === 'QUICK' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <div className="bg-neutral-900/50 border-2 border-neutral-800 rounded-[40px] p-10 text-center space-y-10">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-[28px] flex items-center justify-center mx-auto">
                  <Users className="text-yellow-500" size={40} />
                </div>
                <h2 className="text-3xl font-black tracking-tight">Total Players</h2>
                <p className="text-neutral-500 font-medium">How many players (including you) are playing in this quick game?</p>
              </div>

              {/* Number Input / Slider */}
              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={() => setGameData(prev => ({ ...prev, quickPlayerCount: Math.max(2, prev.quickPlayerCount - 1) }))}
                  className="w-16 h-16 rounded-2xl bg-neutral-800 text-white font-black text-2xl hover:bg-neutral-700 transition-all flex items-center justify-center border border-white/5"
                >
                  -
                </button>
                <div className="text-7xl font-black text-white tabular-nums tracking-tighter">
                  {gameData.quickPlayerCount || 0}
                </div>
                <button 
                  onClick={() => setGameData(prev => ({ ...prev, quickPlayerCount: Math.min(22, prev.quickPlayerCount + 1) }))}
                  className="w-16 h-16 rounded-2xl bg-neutral-800 text-white font-black text-2xl hover:bg-neutral-700 transition-all flex items-center justify-center border border-white/5"
                >
                  +
                </button>
              </div>

              {/* Pricing Section (Internal to Quick Setup) */}
              <div className="bg-black/40 p-8 rounded-3xl border border-white/5 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Entry Fee per Player</span>
                    <p className="text-xs text-neutral-400 font-medium">What each player pays to join (₹)</p>
                  </div>
                  <div className="flex items-center gap-4 bg-black p-2 px-4 rounded-2xl border border-neutral-800 focus-within:border-yellow-500/50 transition-all">
                    <Coins className="text-yellow-500" size={20} />
                    <input 
                      type="number"
                      placeholder="0"
                      value={gameData.perPlayerCharge || ''}
                      onChange={(e) => setGameData({ ...gameData, perPlayerCharge: parseInt(e.target.value) || 0 })}
                      className="w-24 bg-transparent border-none text-right font-black text-2xl outline-none focus:ring-0 text-white"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Users size={16} className="text-yellow-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-tight text-neutral-400">
                      {gameData.quickPlayerCount} Total Slots
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                    You + {gameData.quickPlayerCount - 1} Other Players
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(3)} className="flex-1 py-5 bg-neutral-900 text-neutral-400 font-black rounded-3xl border-2 border-neutral-800 hover:border-neutral-700 transition-all text-lg uppercase tracking-widest">Back</button>
              <button
                disabled={gameData.quickPlayerCount < 2}
                onClick={initQuickSlots}
                className="flex-[2] py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)] disabled:opacity-50 uppercase tracking-widest"
              >
                SETUP SLOTS
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4.5: Quick Slot Setup */}
        {step === 4.5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <h2 className="text-4xl font-black tracking-tight">Manage Slots</h2>
                <p className="text-neutral-500 font-medium italic">Assign players to slots or leave them open for the community</p>
              </div>
              <button 
                onClick={() => {
                  setFillingTeamKey('quick');
                  setShowTeamFillModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-500 font-black text-xs uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all"
              >
                <ShieldCheck size={16} /> Fill from My Team
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gameData.quickSlotsData.map((slot, idx) => (
                <div 
                  key={idx}
                  onClick={() => idx !== 0 && setActiveSlotPicker({ idx })}
                  className={`relative p-6 rounded-[32px] border-2 transition-all cursor-pointer group flex flex-col items-center justify-center text-center h-48 ${
                    slot.userId || slot.customPlayer
                    ? 'border-yellow-500/30 bg-yellow-500/5' 
                    : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-110 ${
                    slot.userId || slot.customPlayer ? 'bg-yellow-500 text-black' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {slot.userId === user?._id ? <ShieldCheck size={28} /> : (slot.userId || slot.customPlayer ? <UserCheck size={28} /> : <Plus size={28} />)}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Slot {idx + 1}</p>
                    <h4 className="font-black truncate w-full px-2">
                      {slot.userId === user?._id ? "You (Host)" : (slot.name || slot.customPlayer?.name || slot.customPlayer?.email || "Open Slot")}
                    </h4>
                  </div>

                  {idx !== 0 && (slot.userId || slot.customPlayer) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSlots = [...gameData.quickSlotsData];
                        newSlots[idx] = { role: 'Player', status: 'OPEN' };
                        setGameData({ ...gameData, quickSlotsData: newSlots });
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {idx === 0 && (
                    <div className="absolute top-4 right-4 text-yellow-500">
                      <CheckCircle2 size={16} />
                    </div>
                  )}

                  {slot.customPlayer && (
                    <div className="absolute bottom-4 right-4 text-neutral-600">
                      <Mail size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(4)} className="flex-1 py-5 bg-neutral-900 text-neutral-400 font-black rounded-3xl border-2 border-neutral-800 hover:border-neutral-700 transition-all text-lg uppercase tracking-widest">Back</button>
              <button
                onClick={() => setStep(5)}
                className="flex-[2] py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)] uppercase tracking-widest"
              >
                PREVIEW MATCH
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Team Configuration (Professional Only) */}
        {step === 4 && gameData.gameMode === 'PROFESSIONAL' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <div className="bg-neutral-900/50 border-2 border-neutral-800 rounded-[40px] p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-neutral-800 hidden md:block" />
                
                {["teamA", "teamB"].map((teamKey) => (
                  <div key={teamKey} className="space-y-8">
                    {/* Team Header */}
                    <div className="flex items-center justify-between gap-5">
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
                      <button 
                        onClick={() => {
                          setFillingTeamKey(teamKey);
                          setShowTeamFillModal(true);
                        }}
                        className="p-3 bg-neutral-800 rounded-2xl text-neutral-500 hover:text-yellow-500 transition-all border border-white/5"
                        title="Fill from My Team"
                      >
                        <ShieldCheck size={20} />
                      </button>
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
                          className="flex-1 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#55DEE8]/30 rounded-2xl cursor-pointer hover:border-[#55DEE8]/60 hover:bg-[#55DEE8]/5 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#55DEE8]/10 border border-[#55DEE8]/20 flex items-center justify-center group-hover:bg-[#55DEE8]/20 transition-all">
                            <ImageIcon size={16} className="text-[#55DEE8]" />
                          </div>
                          <span className="text-[10px] font-black text-[#55DEE8]/70 uppercase tracking-widest">
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
                                  ? 'border-[#55DEE8] shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                                  : 'border-transparent hover:border-white/20'
                              }`}
                            >
                              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                              {gameData[teamKey].image === img.url && (
                                <div className="absolute inset-0 bg-[#55DEE8]/20 flex items-center justify-center">
                                  <CheckCircle2 size={14} className="text-[#55DEE8]" />
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
                          <div className="flex-1 flex items-center gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl group-hover:border-[#55DEE8]/30 transition-all">
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
                      className="w-full py-4 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500 text-xs font-black uppercase tracking-widest hover:border-[#55DEE8]/30 hover:text-[#55DEE8] transition-all flex items-center justify-center gap-2 bg-neutral-900/30"
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
              <button onClick={() => setStep(3)} className="flex-1 py-5 bg-neutral-900 text-neutral-400 font-black rounded-3xl border-2 border-neutral-800 hover:border-neutral-700 transition-all text-lg uppercase tracking-widest">Back</button>
              <button
                onClick={() => setStep(5)}
                className="flex-[2] py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all text-lg shadow-[0_10px_30px_rgba(234,179,8,0.2)] uppercase tracking-widest"
              >
                PREVIEW MATCH
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Preview & Finalize */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
            <div className="bg-yellow-500/10 border-2 border-yellow-500/20 p-10 rounded-[40px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                  <div className="space-y-3">
                    <span className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      {gameData.gameMode === 'QUICK' ? 'Quick Game' : 'Professional Match'}
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

                {gameData.gameMode === 'QUICK' ? (
                  <div className="p-8 bg-black/40 border border-white/5 rounded-[32px] text-center space-y-4">
                    <div className="flex items-center justify-center -space-x-4">
                      {Array.from({ length: Math.min(gameData.quickPlayerCount, 8) }).map((_, i) => (
                        <div key={i} className="w-14 h-14 rounded-full border-4 border-neutral-900 bg-neutral-800 flex items-center justify-center text-yellow-500">
                          <Users size={20} />
                        </div>
                      ))}
                      {gameData.quickPlayerCount > 8 && (
                        <div className="w-14 h-14 rounded-full border-4 border-neutral-900 bg-neutral-700 flex items-center justify-center text-[10px] font-black">
                          +{gameData.quickPlayerCount - 8}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400">
                      Single Pool: <span className="text-yellow-500">{gameData.quickPlayerCount} Player Slots</span>
                    </p>
                  </div>
                ) : (
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
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(gameData.gameMode === 'QUICK' ? 4.5 : 4)} className="flex-1 py-5 bg-neutral-900 text-neutral-400 font-black rounded-3xl border-2 border-neutral-800 hover:border-neutral-700 transition-all text-lg uppercase tracking-widest">Back</button>
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

      <AnimatePresence>
        {showTeamFillModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTeamFillModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="relative bg-[#0a0a0a] border border-neutral-800 p-8 rounded-[40px] max-w-md w-full shadow-2xl overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 blur-[100px] rounded-full" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={24} className="text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Fill from Team</h2>
                  <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Bulk slot assignment</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {myTeams.length > 0 ? myTeams.map(team => (
                  <div 
                    key={team._id}
                    onClick={() => handleFillFromTeam(team)}
                    className="p-4 bg-neutral-900 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-yellow-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-white/5 overflow-hidden">
                        <img src={team.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${team.name}`} alt={team.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm group-hover:text-yellow-500 transition-colors">{team.name}</h4>
                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{team.members?.length || 0} Members</p>
                      </div>
                    </div>
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                      <Plus size={16} />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 space-y-4 bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-800">
                    <ShieldAlert className="mx-auto text-neutral-700" size={48} />
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500 font-medium italic">No teams found in your profile</p>
                      <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Create a team in the My Teams section first</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest text-center px-4">
                  Note: This will fill empty slots with team members. Host slot will not be overwritten.
                </p>
                <button 
                  onClick={() => setShowTeamFillModal(false)}
                  className="w-full py-4 bg-neutral-800 rounded-2xl font-black text-xs uppercase tracking-widest text-neutral-400 hover:bg-neutral-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      {/* Slot Picker Popup */}
      <SlotPickerPopup
        isOpen={!!activeSlotPicker}
        onClose={() => setActiveSlotPicker(null)}
        onSelect={handleSlotSelection}
        gameId={null} // Draft mode
        slotId={activeSlotPicker?.idx}
      />

      <AnimatePresence>
        {showCustomUmpireModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCustomUmpireModal(false)} 
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 30 }} 
              className="relative bg-[#0a0a0a] border border-neutral-800 p-8 rounded-[40px] max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 blur-[100px] rounded-full" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
                  <UserCheck size={24} className="text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Add Custom Umpire</h2>
                  <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Inviting off-platform</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text"
                    placeholder="Enter umpire name"
                    value={customUmpireData.name}
                    onChange={(e) => setCustomUmpireData({ ...customUmpireData, name: e.target.value })}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl py-4 px-6 text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email"
                    placeholder="name@example.com"
                    value={customUmpireData.email}
                    onChange={(e) => setCustomUmpireData({ ...customUmpireData, email: e.target.value })}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl py-4 px-6 text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                  <input 
                    type="tel"
                    placeholder="Enter phone number"
                    value={customUmpireData.phone}
                    onChange={(e) => setCustomUmpireData({ ...customUmpireData, phone: e.target.value })}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl py-4 px-6 text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => setShowCustomUmpireModal(false)}
                  className="flex-1 py-4 bg-neutral-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-neutral-400 hover:bg-neutral-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!customUmpireData.name || !customUmpireData.email}
                  onClick={() => {
                    setSelectedUmpire(null);
                    setGameData({ ...gameData, umpireId: null });
                    setShowCustomUmpireModal(false);
                    toast.success(`Custom umpire ${customUmpireData.name} added!`);
                  }}
                  className="flex-[2] py-4 bg-yellow-500 text-black font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Confirm Umpire
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
