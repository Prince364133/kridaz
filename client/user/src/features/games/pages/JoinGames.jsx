import React from 'react';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Coins, 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  X,
  PlusCircle
} from 'lucide-react';
import useJoinGames from '../hooks/useJoinGames';
import GameCard from '../components/GameCard';
import GameDetailsModal from '../components/GameDetailsModal';

const SPORTS = [
  'All Sports',
  'Cricket',
  'Football',
  'Basketball',
  'Volleyball',
  'Badminton',
  'Tennis',
  'Table Tennis',
  'Pickleball'
];

const JoinGames = () => {
  const {
    games,
    filteredGames,
    loading,
    selectedGame,
    setSelectedGame,
    showCoinAnim,
    setShowCoinAnim,
    showConfirm,
    setShowConfirm,
    joiningSlot,
    setJoiningSlot,
    search,
    setSearch,
    sportFilter,
    setSportFilter,
    liveFilter,
    setLiveFilter,
    inviteData,
    showInvitePopup,
    setShowInvitePopup,
    states,
    cities,
    selectedState,
    selectedCity,
    loadingStates,
    loadingCities,
    handleStateChange,
    handleCityChange,
    handleClearLocation,
    handleSearch,
    handleJoinGame,
    handleClaimSlot,
    refetch,
    isAuthenticated
  } = useJoinGames();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-violet-900/10 blur-[130px]" />
        <div className="absolute -bottom-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-fuchsia-900/10 blur-[130px]" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
              Discover Matches
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Find open community matches, book slot reserves, and hit the court.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.location.href = '/games/host'}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 font-semibold text-white flex items-center gap-2 shadow-lg"
            >
              <PlusCircle className="h-4.5 w-4.5" /> Host a Match
            </button>
          </div>
        </div>

        {/* Filter Ledger */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <SlidersHorizontal className="h-4.5 w-4.5 text-violet-400" />
            <span>Search & Ledger Filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search grounds or modes..."
                value={search}
                onChange={handleSearch}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* State Selection */}
            <div>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                disabled={loadingStates}
              >
                <option value="">Filter by State</option>
                {states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* City Selection */}
            <div>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                disabled={loadingCities || !selectedState}
              >
                <option value="">Filter by City</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Clear Location & Live Toggle */}
            <div className="flex items-center justify-between gap-3">
              {(selectedState || selectedCity) && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  Reset Locations
                </button>
              )}
              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={liveFilter}
                  onChange={(e) => setLiveFilter(e.target.checked)}
                  className="rounded border-white/10 bg-slate-950 text-violet-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm font-semibold text-slate-300">Live Only</span>
              </label>
            </div>
          </div>

          {/* Sport Categories list */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-white/5 pt-4">
            {SPORTS.map((sport) => (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  sportFilter === sport
                    ? 'bg-violet-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 border border-white/5 hover:bg-slate-900'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {/* Listings display */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-md">
            <Trophy className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-300">No Match Ledgers Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't locate any matches matching your filters. Try clearing location search settings or hosting your own match!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                onSelect={(g) => setSelectedGame(g)}
              />
            ))}
          </div>
        )}
      </div>

      {/* MATCH DETAILS MODAL */}
      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          currentUserId={null} // Will automatically highlight inside check slots
          onJoinSlot={(slot) => {
            setJoiningSlot(slot);
            setShowConfirm(true);
          }}
        />
      )}

      {/* CONFIRM JOIN SLOT MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-200 mb-2">Stake Roster Spot</h3>
            <p className="text-sm text-slate-400 mb-6">
              Claiming this spot requires staking <span className="font-bold text-emerald-400">{selectedGame.perPlayerCharge || 0} Coins</span>. The staked coins will reside safely in the matchmaking escrow until the game commences.
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
                onClick={async () => {
                  setShowConfirm(false);
                  await handleJoinGame();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-sm"
              >
                Stake Coins & Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COIN JOIN CELEBRATION FLOW */}
      {showCoinAnim && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg">
          <div className="relative animate-bounce">
            <Coins className="h-28 w-28 text-amber-400 drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]" />
            <Sparkles className="absolute -top-4 -right-4 h-10 w-10 text-violet-400 animate-spin" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mt-8 tracking-tight">
            Spot Reserved!
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-sm text-center">
            Your staked coins are successfully escrowed. Check My Matches tab to view upcoming matchmaking queues.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowCoinAnim(false);
              window.location.href = '/games/joined';
            }}
            className="mt-8 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 font-bold text-white shadow-xl hover:from-violet-600 hover:to-fuchsia-600 transition-all"
          >
            Go to My Matches
          </button>
        </div>
      )}

      {/* DEEP LINK / INVITE VERIFIED CLAIM MODAL */}
      {showInvitePopup && inviteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600" />
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 mt-1.5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Verified Match Invite
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-1.5">
                  Join Match Matchup
                </h3>
              </div>
              <button 
                onClick={() => setShowInvitePopup(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invite details info */}
              <div className="flex gap-4 p-4 rounded-2xl bg-slate-950 border border-white/5">
                <img 
                  src={inviteData.game?.teamA?.image || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80'} 
                  alt="Match Banner" 
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-200 text-sm truncate">{inviteData.game?.ground?.name || 'Local Street Pitch'}</h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{inviteData.game?.date ? new Date(inviteData.game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{inviteData.game?.time || 'TBD'}</span>
                  </p>
                </div>
              </div>

              {/* Invited Role specs */}
              <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-center">
                <span className="text-xs text-violet-400 block uppercase font-bold tracking-wider">Your Reserved Role</span>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mt-1.5 block">
                  {inviteData.role}
                </span>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                  A roster spot has been reserved for you by the match host. Accept this invite to claim your spot on the field.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInvitePopup(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 text-sm"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={handleClaimSlot}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
                >
                  Accept & Secure Spot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinGames;
