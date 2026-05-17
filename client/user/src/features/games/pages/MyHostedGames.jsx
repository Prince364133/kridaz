import React, { useState } from 'react';
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Activity,
  Tv,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useManageGames from '../hooks/useManageGames';

const MyHostedGames = () => {
  const {
    myGames,
    loading,
    hireModal,
    setHireModal,
    venueModal,
    setVenueModal,
    handleApprove,
    handleReject,
    handleCancelGame,
    handleProfessionalRequest,
    refetch
  } = useManageGames();

  const [expandedGameId, setExpandedGameId] = useState(null);

  const toggleExpand = (gameId) => {
    setExpandedGameId(expandedGameId === gameId ? null : gameId);
  };

  const getPendingPlayers = (game) => {
    const list = [];
    if (game.gameMode === 'QUICK') {
      game.quickSlotsData?.forEach((slot, idx) => {
        if (slot.status === 'HELD') {
          list.push({ ...slot, team: 'quick', index: idx });
        }
      });
    } else {
      game.teamA?.slots?.forEach((slot, idx) => {
        if (slot.status === 'HELD') {
          list.push({ ...slot, team: 'teamA', index: idx });
        }
      });
      game.teamB?.slots?.forEach((slot, idx) => {
        if (slot.status === 'HELD') {
          list.push({ ...slot, team: 'teamB', index: idx });
        }
      });
    }
    return list;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-violet-900/10 blur-[130px]" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-fuchsia-900/10 blur-[130px]" />
      </div>

      <div className="relative max-w-5xl mx-auto space-y-8">
        {/* Header section */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Hosted Matchups
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Administer rosters, assign certified referees, and manage match status.
            </p>
          </div>
        </div>

        {/* Listings Display */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : myGames.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-md">
            <Trophy className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-300">No Match Ledgers Hosted</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't created any matchmaking ledgers yet. Head to the host tab to launch your first matchup.
            </p>
            <button
              onClick={() => window.location.href = '/games/host'}
              className="mt-6 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold text-white inline-flex items-center gap-2 text-sm shadow"
            >
              Host Match
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myGames.map((game) => {
              const pendingPlayers = getPendingPlayers(game);
              const isExpanded = expandedGameId === game.id;
              
              return (
                <div 
                  key={game.id}
                  className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover:border-white/10 overflow-hidden"
                >
                  {/* Master row */}
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {game.gameType}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-white/5 text-slate-400">
                          {game.gameMode}
                        </span>
                        {pendingPlayers.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase font-bold animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            {pendingPlayers.length} Pending approvals
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
                    </div>

                    {/* Actions block */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(game.id)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-white/5"
                      >
                        Manage Match Details
                        <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleCancelGame(game.id)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                      >
                        Cancel Match
                      </button>
                    </div>
                  </div>

                  {/* Expanded Section containing roster details */}
                  {isExpanded && (
                    <div className="border-t border-white/5 bg-slate-950/40 p-6 space-y-6">
                      
                      {/* Invite Link generator */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-200 block">Share Match Invite link</span>
                          <span className="text-slate-400 block mt-0.5">Invite friends or teammates directly to lock custom roles.</span>
                        </div>
                        <button
                          onClick={() => {
                            const inviteUrl = `${window.location.origin}/games/join?inviteToken=${game.inviteToken}`;
                            navigator.clipboard.writeText(inviteUrl);
                            toast.success("Match invite link copied to clipboard!");
                          }}
                          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 font-semibold text-white shadow"
                        >
                          Copy Invite Link
                        </button>
                      </div>

                      {/* Pending approval roster grid */}
                      {pendingPlayers.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-amber-400" />
                            Pending Player Approvals
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {pendingPlayers.map((player, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-white/5 flex justify-between items-center">
                                <div>
                                  <span className="font-bold text-slate-200 text-sm block">{player.name || 'Anonymous Player'}</span>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">{player.role}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApprove(game.id, player.team, player.index)}
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(game.id, player.team, player.index)}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Professional Staff requests administration */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        
                        {/* Umpire slot status */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Match Referee</span>
                            <ShieldCheck className="h-4 w-4 text-blue-400" />
                          </div>
                          {game.umpireId ? (
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block">Official Hired</span>
                              {game.umpireRequestStatus === 'PENDING' && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleProfessionalRequest(game.id, 'umpire', 'ACCEPT')}
                                    className="flex-1 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleProfessionalRequest(game.id, 'umpire', 'REJECT')}
                                    className="flex-1 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {game.umpireRequestStatus === 'ACCEPTED' && (
                                <span className="text-[10px] font-semibold text-emerald-400 block mt-1">Request Confirmed</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 block">No certified referee selected</span>
                          )}
                        </div>

                        {/* Streamer slot status */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Broadcaster</span>
                            <Tv className="h-4 w-4 text-pink-400" />
                          </div>
                          {game.streamerId ? (
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block">Live Broadcast</span>
                              {game.streamerRequestStatus === 'PENDING' && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleProfessionalRequest(game.id, 'streamer', 'ACCEPT')}
                                    className="flex-1 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleProfessionalRequest(game.id, 'streamer', 'REJECT')}
                                    className="flex-1 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {game.streamerRequestStatus === 'ACCEPTED' && (
                                <span className="text-[10px] font-semibold text-emerald-400 block mt-1">Broadcast Live!</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 block">No live broadcast scheduled</span>
                          )}
                        </div>

                        {/* Scorer slot status */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Scorer</span>
                            <TrendingUp className="h-4 w-4 text-yellow-400" />
                          </div>
                          {game.scorerId ? (
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block">Assigned Scorer</span>
                              {game.scorerRequestStatus === 'PENDING' && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleProfessionalRequest(game.id, 'scorer', 'ACCEPT')}
                                    className="flex-1 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleProfessionalRequest(game.id, 'scorer', 'REJECT')}
                                    className="flex-1 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {game.scorerRequestStatus === 'ACCEPTED' && (
                                <span className="text-[10px] font-semibold text-emerald-400 block mt-1">Scoring Verified</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 block">Scorekeeping by players</span>
                          )}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyHostedGames;
