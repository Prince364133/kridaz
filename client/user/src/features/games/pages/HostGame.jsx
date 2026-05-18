import React from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Trophy, 
  Coins, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Minus, 
  ChevronRight, 
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useHostGameForm, { MOCK_TEAM_IMAGES } from '../hooks/useHostGameForm';
import SlotSelectionModal from '../../teams/components/SlotSelectionModal';

const SPORTS = [
  { id: 'Cricket', name: 'Cricket', icon: '🏏' },
  { id: 'Football', name: 'Football', icon: '⚽' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀' },
  { id: 'Volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'Badminton', name: 'Badminton', icon: '🏸' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾' },
  { id: 'Table Tennis', name: 'Table Tennis', icon: '🏓' },
  { id: 'Pickleball', name: 'Pickleball', icon: '🥒' }
];

const HostGame = () => {
  const {
    step,
    setStep,
    loading,
    showCoinAnim,
    setShowCoinAnim,
    showConfirm,
    setShowConfirm,
    activeSlotPicker,
    setActiveSlotPicker,
    gameData,
    setGameData,
    grounds,
    umpires,
    streamers,
    selectedGround,
    setSelectedGround,
    selectedUmpire,
    setSelectedUmpire,
    selectedStreamer,
    setSelectedStreamer,
    states,
    cities,
    loadingStates,
    loadingCities,
    showCustomUmpireModal,
    setShowCustomUmpireModal,
    customUmpireData,
    setCustomUmpireData,
    showClock,
    setShowClock,
    clockHour,
    setClockHour,
    clockMinute,
    setClockMinute,
    clockAmPm,
    setClockAmPm,
    showTeamFillModal,
    setShowTeamFillModal,
    setFillingTeamKey,
    myTeams,
    handleFillFromTeam,
    displayTime,
    totalCost,
    initSlots,
    initQuickSlots,
    handleSlotSelection,
    handleCreateGame,
    addSlot,
    removeSlot,
    updateSlotRole
  } = useHostGameForm();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Host Game | Kridaz</title>
      </Helmet>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-violet-900/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-fuchsia-900/10 blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Wizard Progress Header */}
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Host a Game
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Create a custom matchmaking ledger and invite the community.
            </p>
          </div>
          
          {/* Step Indicators */}
          <div className="hidden sm:flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center h-8 w-8 rounded-full border text-xs font-bold transition-all duration-300 ${
                  step >= s 
                    ? 'bg-violet-600 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
                    : 'border-white/10 text-slate-500 bg-slate-900'
                }`}>
                  {s}
                </div>
                {s < 4 && <div className={`w-8 h-[2px] ${step > s ? 'bg-violet-600' : 'bg-white/10'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* STEP 1: Select Sport & Game Mode */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-200">1. Select Your Sport</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {SPORTS.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => {
                      initSlots(sport.id);
                      setStep(2);
                    }}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all duration-300 ${
                      gameData.gameType === sport.id
                        ? 'border-violet-500 bg-violet-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
                        : 'border-white/5 bg-slate-900/60 backdrop-blur hover:border-white/10 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-4xl mb-3 block">{sport.icon}</span>
                    <span className="font-bold text-slate-200">{sport.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location, Date & Match Setup */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-slate-200 border-b border-white/5 pb-3">
                2. Match Particulars
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* State Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">State</label>
                  <select
                    value={gameData.state}
                    onChange={(e) => setGameData({ ...gameData, state: e.target.value, city: '' })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500"
                    disabled={loadingStates}
                  >
                    <option value="">Select State</option>
                    {states.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* City Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">City</label>
                  <select
                    value={gameData.city}
                    onChange={(e) => setGameData({ ...gameData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500"
                    disabled={loadingCities || !gameData.state}
                  >
                    <option value="">Select City</option>
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Match Date</label>
                  <input
                    type="date"
                    value={gameData.date}
                    onChange={(e) => setGameData({ ...gameData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Time Picker */}
                <div className="space-y-2 relative">
                  <label className="text-sm font-semibold text-slate-300">Match Time</label>
                  <button
                    type="button"
                    onClick={() => setShowClock(!showClock)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-left text-slate-200 focus:outline-none focus:border-violet-500"
                  >
                    {gameData.time || "Select Time"}
                  </button>

                  {/* Clock Picker Modal inside the block */}
                  {showClock && (
                    <div className="absolute z-30 mt-2 p-4 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl space-y-4 w-64">
                      <div className="flex items-center justify-between text-slate-200 font-bold">
                        <span>Pick Time</span>
                        <button type="button" onClick={() => setShowClock(false)} className="text-xs text-violet-400">Done</button>
                      </div>
                      <div className="flex gap-2 justify-center items-center">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={clockHour}
                          onChange={(e) => setClockHour(parseInt(e.target.value) || 12)}
                          className="w-12 bg-slate-950 text-center border border-white/10 rounded px-2 py-1 text-slate-100"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={clockMinute}
                          onChange={(e) => setClockMinute(parseInt(e.target.value) || 0)}
                          className="w-12 bg-slate-950 text-center border border-white/10 rounded px-2 py-1 text-slate-100"
                        />
                        <select
                          value={clockAmPm}
                          onChange={(e) => setClockAmPm(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-slate-100"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const timeStr = displayTime(clockHour, clockMinute, clockAmPm);
                          setGameData({ ...gameData, time: timeStr });
                          setShowClock(false);
                        }}
                        className="w-full py-1 text-xs font-semibold rounded bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        Confirm Time
                      </button>
                    </div>
                  )}
                </div>

                {/* Game Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Match Layout Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setGameData({ ...gameData, gameMode: 'PROFESSIONAL' })}
                      className={`py-3 rounded-xl border font-semibold text-center transition-all ${
                        gameData.gameMode === 'PROFESSIONAL'
                          ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                          : 'border-white/5 bg-slate-950 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      Professional Squads
                    </button>
                    <button
                      type="button"
                      onClick={() => setGameData({ ...gameData, gameMode: 'QUICK' })}
                      className={`py-3 rounded-xl border font-semibold text-center transition-all ${
                        gameData.gameMode === 'QUICK'
                          ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                          : 'border-white/5 bg-slate-950 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      Quick / Street Roster
                    </button>
                  </div>
                </div>

                {/* Per Player Charge (Coins) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-400" />
                    Per-Player Spot Value (Coins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={gameData.perPlayerCharge}
                    onChange={(e) => setGameData({ ...gameData, perPlayerCharge: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Quick Mode Player count setting */}
              {gameData.gameMode === 'QUICK' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/40 border border-white/5">
                  <label className="text-sm font-semibold text-slate-300 block">Total Player Roster Capacity</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGameData({ ...gameData, quickPlayerCount: Math.max(2, gameData.quickPlayerCount - 1) })}
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-bold text-lg text-slate-200">{gameData.quickPlayerCount} Players</span>
                    <button
                      type="button"
                      onClick={() => setGameData({ ...gameData, quickPlayerCount: gameData.quickPlayerCount + 1 })}
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Next navigation */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!gameData.city || !gameData.state || !gameData.date || !gameData.time) {
                      toast.error("Please fill in state, city, date, and time.");
                      return;
                    }
                    if (gameData.gameMode === 'QUICK') {
                      if (gameData.quickPlayerCount < 2) {
                        toast.error("Please set total players to at least 2.");
                        return;
                      }
                      initQuickSlots();
                    } else {
                      setStep(3);
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold text-white flex items-center gap-2 shadow-[0_4px_20px_rgba(109,40,217,0.3)]"
                >
                  Next Setup <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Domain Assets Selection (Grounds, Umpires, Streamers) */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-slate-200 border-b border-white/5 pb-3 flex items-center justify-between">
                <span>3. Grounds & Professional Assets</span>
                <span className="text-xs font-semibold text-violet-400 uppercase">Step 3 of 4</span>
              </h2>

              {/* Ground Selector */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300 block">Select Match Pitch / Ground</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grounds.length === 0 ? (
                    <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center text-slate-500 text-xs">
                      No stadium rentals listed for {gameData.city}. Proceeding with free street matchmaking.
                    </div>
                  ) : (
                    grounds.map((ground) => (
                      <button
                        key={ground.id}
                        type="button"
                        onClick={() => {
                          setSelectedGround(ground);
                          setGameData({ ...gameData, groundId: ground.id });
                        }}
                        className={`p-4 rounded-xl border text-left flex gap-3 transition-all ${
                          selectedGround?.id === ground.id
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-white/5 bg-slate-950 hover:border-white/10'
                        }`}
                      >
                        <img src={ground.image || MOCK_TEAM_IMAGES[2].url} alt={ground.name} className="h-14 w-14 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-200 text-sm truncate">{ground.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{ground.address}</p>
                          <span className="text-[10px] font-bold text-emerald-400 block mt-1">{ground.pricePerHour} Coins/Hour</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Umpire / Referee Selector */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-300 block">Certified Umpire / Referee (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setShowCustomUmpireModal(true)}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Hire Guest Referee
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {umpires.map((umpire) => (
                    <button
                      key={umpire.id}
                      type="button"
                      onClick={() => {
                        setSelectedUmpire(umpire);
                        setGameData({ ...gameData, umpireId: umpire.id });
                      }}
                      className={`p-4 rounded-xl border text-left flex gap-3 transition-all ${
                        selectedUmpire?.id === umpire.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/5 bg-slate-950 hover:border-white/10'
                      }`}
                    >
                      <img src={umpire.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"} alt={umpire.name} className="h-12 w-12 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-200 text-sm truncate">{umpire.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Rating: ⭐ {umpire.rating || 'N/A'}</p>
                        <span className="text-[10px] font-bold text-emerald-400 block mt-1">{umpire.price} Coins/Match</span>
                      </div>
                    </button>
                  ))}
                </div>

                {customUmpireData.name && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-violet-500/20 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold tracking-wider text-[9px]">Hired Guest Referee</span>
                      <span className="font-semibold text-slate-200 block mt-0.5">{customUmpireData.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomUmpireData({ name: '', email: '', phone: '' })}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Streamer Broadcaster Selector */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-sm font-semibold text-slate-300 block">Live Broadcaster / Streamer (Optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {streamers.map((streamer) => (
                    <button
                      key={streamer.id}
                      type="button"
                      onClick={() => {
                        setSelectedStreamer(streamer);
                        setGameData({ ...gameData, streamerId: streamer.id });
                      }}
                      className={`p-4 rounded-xl border text-left flex gap-3 transition-all ${
                        selectedStreamer?.id === streamer.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/5 bg-slate-950 hover:border-white/10'
                      }`}
                    >
                      <img src={streamer.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"} alt={streamer.name} className="h-12 w-12 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-200 text-sm truncate">{streamer.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Coverage: {streamer.platform || 'YouTube'}</p>
                        <span className="text-[10px] font-bold text-emerald-400 block mt-1">{streamer.price} Coins/Match</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost Summary & Actions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Estimated Setup Cost</span>
                  <span className="text-xl font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <Coins className="h-5 w-5" /> {totalCost} Coins
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold text-white flex items-center gap-2"
                  >
                    Setup Teams <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Team Roles Setup (PROFESSIONAL Mode) */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A Customizer */}
              <div className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-lg font-bold text-slate-200">Team A</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFillingTeamKey('teamA');
                      setShowTeamFillModal(true);
                    }}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300"
                  >
                    Fill From Club Squad
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Team Name</label>
                    <input
                      type="text"
                      value={gameData.teamA.name}
                      onChange={(e) => setGameData({
                        ...gameData,
                        teamA: { ...gameData.teamA, name: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Team Banner/Image</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {MOCK_TEAM_IMAGES.map((img) => (
                        <button
                          key={img.label}
                          type="button"
                          onClick={() => setGameData({
                            ...gameData,
                            teamA: { ...gameData.teamA, image: img.url }
                          })}
                          className={`h-12 w-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                            gameData.teamA.image === img.url ? 'border-violet-500 scale-95' : 'border-transparent'
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-400">ROSTER SLOTS ({gameData.teamA.slots.length})</label>
                      <button
                        type="button"
                        onClick={() => addSlot('teamA')}
                        className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Slot
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {gameData.teamA.slots.map((slot, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={slot.role}
                            onChange={(e) => updateSlotRole('teamA', idx, e.target.value)}
                            placeholder="e.g. Batsman"
                            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeSlot('teamA', idx)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team B Customizer */}
              <div className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-lg font-bold text-slate-200">Team B</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFillingTeamKey('teamB');
                      setShowTeamFillModal(true);
                    }}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300"
                  >
                    Fill From Club Squad
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Team Name</label>
                    <input
                      type="text"
                      value={gameData.teamB.name}
                      onChange={(e) => setGameData({
                        ...gameData,
                        teamB: { ...gameData.teamB, name: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Team Banner/Image</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {MOCK_TEAM_IMAGES.map((img) => (
                        <button
                          key={img.label}
                          type="button"
                          onClick={() => setGameData({
                            ...gameData,
                            teamB: { ...gameData.teamB, image: img.url }
                          })}
                          className={`h-12 w-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                            gameData.teamB.image === img.url ? 'border-violet-500 scale-95' : 'border-transparent'
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-400">ROSTER SLOTS ({gameData.teamB.slots.length})</label>
                      <button
                        type="button"
                        onClick={() => addSlot('teamB')}
                        className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Slot
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {gameData.teamB.slots.map((slot, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={slot.role}
                            onChange={(e) => updateSlotRole('teamB', idx, e.target.value)}
                            placeholder="e.g. Bowler"
                            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeSlot('teamB', idx)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back & Submit block */}
            <div className="p-4 rounded-xl bg-slate-900 border border-white/5 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 font-semibold text-white flex items-center gap-2 shadow-[0_4px_20px_rgba(139,92,246,0.3)] animate-pulse"
              >
                Publish Match Ledger <Trophy className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4.5: QUICK Match Layout Slot Assignment */}
        {step === 4.5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xl font-bold text-slate-200">Assign Quick Roster Slots</h3>
                <button
                  type="button"
                  onClick={() => {
                    setFillingTeamKey('quick');
                    setShowTeamFillModal(true);
                  }}
                  className="text-xs font-bold text-violet-400 hover:text-violet-300"
                >
                  Fill From Club Squad
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gameData.quickSlotsData.map((slot, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-white/5 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Slot {idx + 1}</span>
                      <span className="font-semibold text-slate-200 block mt-0.5">
                        {slot.name || slot.customPlayer?.name || 'Open Slot'}
                      </span>
                    </div>

                    {idx === 0 ? (
                      <span className="text-xs font-semibold text-violet-400 px-3 py-1 rounded bg-violet-500/10">Host (Joined)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveSlotPicker({ idx })}
                        className="px-3 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        {slot.name || slot.customPlayer?.name ? 'Edit Player' : 'Assign Player'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Navigation button */}
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
                >
                  Back Setup
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 font-semibold text-white flex items-center gap-2"
                >
                  Publish Match Ledger <Trophy className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM BOOKING MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-200 mb-2">Confirm Match Creation</h3>
            <p className="text-sm text-slate-400 mb-6">
              Publishing this match ledger requires staking <span className="font-bold text-emerald-400">{totalCost} Coins</span>. The staked amount will be refunded if the match is canceled.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setShowConfirm(false);
                  await handleCreateGame();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-sm"
              >
                {loading ? 'Creating...' : 'Stake Coins & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COIN DEDUCTION CELEBRATION ANIMATION */}
      {showCoinAnim && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg">
          <div className="relative animate-bounce">
            <Coins className="h-28 w-28 text-amber-400 drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]" />
            <Sparkles className="absolute -top-4 -right-4 h-10 w-10 text-violet-400 animate-spin" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mt-8 tracking-tight">
            Ledger Published Successfully!
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-sm text-center">
            Your staked coins have been successfully registered in the matchmaking escrow escrow system.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowCoinAnim(false);
              window.location.href = '/games/hosted';
            }}
            className="mt-8 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 font-bold text-white shadow-xl hover:from-violet-600 hover:to-fuchsia-600 transition-all"
          >
            Manage Match
          </button>
        </div>
      )}

      {/* CUSTOM UMPIRE HIRE FORM MODAL */}
      {showCustomUmpireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Hire Custom Referee / Umpire</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={customUmpireData.name}
                  onChange={(e) => setCustomUmpireData({ ...customUmpireData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={customUmpireData.email}
                  onChange={(e) => setCustomUmpireData({ ...customUmpireData, email: e.target.value })}
                  placeholder="e.g. john@umpire.com"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={customUmpireData.phone}
                  onChange={(e) => setCustomUmpireData({ ...customUmpireData, phone: e.target.value })}
                  placeholder="e.g. +91 99999 99999"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCustomUmpireModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!customUmpireData.name || !customUmpireData.email) {
                    toast.error("Name and Email are required to hire a guest umpire.");
                    return;
                  }
                  setShowCustomUmpireModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"
              >
                Hire Referee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEAM FILL MODAL */}
      {showTeamFillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-200">Select Squad to Import</h3>
              <button onClick={() => setShowTeamFillModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {myTeams.length === 0 ? (
                <div className="p-4 rounded-xl border border-white/5 bg-slate-950 text-center text-xs text-slate-500">
                  You haven&apos;t joined any squads yet. Head to Teams tab to create one!
                </div>
              ) : (
                myTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleFillFromTeam(team)}
                    className="w-full p-3 rounded-xl border border-white/5 bg-slate-950/40 hover:bg-violet-500/10 hover:border-violet-500/30 text-left flex justify-between items-center transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">{team.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{team.members?.length || 0} active members</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SLOT PICKER MODAL FOR QUICK MODE */}
      {activeSlotPicker && (
        <SlotSelectionModal
          isOpen={true}
          onClose={() => setActiveSlotPicker(null)}
          onSelect={handleSlotSelection}
        />
      )}
    </div>
  );
};

export default HostGame;
