import React from 'react';
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Clock, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import useJoinedGames from '../hooks/useJoinedGames';

const MyJoinedGames = () => {
  const {
    joinedGames,
    loading,
    isLeaving,
    handleLeave,
    refetch
  } = useJoinedGames();

  // Find user's slot status inside a specific game
  const getUserSlotDetails = (game) => {
    // Current user's slot
    let foundSlot = null;
    let foundTeam = '';

    if (game.gameMode === 'QUICK') {
      foundSlot = game.quickSlotsData?.find(s => s.status === 'JOINED' || s.status === 'HELD');
      foundTeam = 'Quick Roster';
    } else {
      const slotA = game.teamA?.slots?.find(s => s.status === 'JOINED' || s.status === 'HELD');
      if (slotA) {
        foundSlot = slotA;
        foundTeam = game.teamA.name || 'Team A';
      } else {
        const slotB = game.teamB?.slots?.find(s => s.status === 'JOINED' || s.status === 'HELD');
        if (slotB) {
          foundSlot = slotB;
          foundTeam = game.teamB.name || 'Team B';
        }
      }
    }
    return {
      role: foundSlot?.role || 'Player',
      status: foundSlot?.status || 'HELD',
      team: foundTeam
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-violet-900/10 blur-[130px]" />
        <div className="absolute -bottom-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-fuchsia-900/10 blur-[130px]" />
      </div>

      <div className="relative max-w-5xl mx-auto space-y-8">
        {/* Header section */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Joined Matchups
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Verify your roster status, check match locations, or exit reservation slots.
            </p>
          </div>
        </div>

        {/* Listings display */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : joinedGames.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-md">
            <Trophy className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-300">No Joined Matchups</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't staked any roster spots on active matches. Explore the board to join the action!
            </p>
            <button
              onClick={() => window.location.href = '/games/join'}
              className="mt-6 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold text-white inline-flex items-center gap-2 text-sm shadow"
            >
              Explore Match Board
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {joinedGames.map((game) => {
              const userSlot = getUserSlotDetails(game);
              const isPending = userSlot.status === 'HELD';
              
              return (
                <div 
                  key={game.id}
                  className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:border-white/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {game.gameType}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-white/5 text-slate-400">
                        {game.gameMode}
                      </span>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                          <AlertTriangle className="h-3 w-3" /> Pending Host Approval
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Confirmed Roster
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-slate-200 mt-2 truncate">
                      {game.ground?.name || 'Local Street Pitch'}
                    </h3>

                    {/* Sub details */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-500" /> {new Date(game.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-500" /> {game.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {game.city}</span>
                    </div>

                    {/* Personal roster details slot */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-white/5 inline-flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block uppercase font-bold tracking-wider text-[9px]">Assigned Role</span>
                        <span className="font-bold text-slate-200 block mt-0.5">{userSlot.role}</span>
                      </div>
                      <div className="border-l border-white/10 h-6" />
                      <div>
                        <span className="text-slate-500 block uppercase font-bold tracking-wider text-[9px]">Squad / Team</span>
                        <span className="font-bold text-slate-200 block mt-0.5">{userSlot.team}</span>
                      </div>
                    </div>
                  </div>

                  {/* Leave Action block */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLeave(game.id)}
                      disabled={isLeaving}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center gap-1.5"
                    >
                      <LogOut className="h-4 w-4" /> Leave Game
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJoinedGames;
