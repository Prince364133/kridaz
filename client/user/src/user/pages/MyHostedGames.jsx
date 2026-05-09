import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Users, Check, X, Clock, MapPin, 
  ChevronRight, Trophy, Info, AlertCircle, Calendar
} from 'lucide-react';

const MyHostedGames = () => {
  const [myGames, setMyGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyGames = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/hosted-game/my-hosted`, { withCredentials: true });
      setMyGames(res.data.games);
    } catch (err) {
      toast.error("Failed to fetch your hosted games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGames();
  }, []);

  const handleApprove = async (gameId, team, slotIndex) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/hosted-game/approve`, {
        gameId, team, slotIndex
      }, { withCredentials: true });

      if (res.data.success) {
        toast.success("Player approved!");
        fetchMyGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve player");
    }
  };

  const handleReject = async (gameId, team, slotIndex) => {
    if (!window.confirm("Reject this player? Their reserved coins will be released.")) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/hosted-game/reject`, {
        gameId, team, slotIndex
      }, { withCredentials: true });

      if (res.data.success) {
        toast.success("Player rejected and coins released.");
        fetchMyGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject player");
    }
  };

  const handleCancelGame = async (gameId) => {
    if (!window.confirm("Cancel this game? All reserved coins for pending players will be released.")) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/hosted-game/cancel`, {
        gameId
      }, { withCredentials: true });

      if (res.data.success) {
        toast.success("Game cancelled successfully.");
        fetchMyGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel game");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-black italic tracking-tighter">MY HOSTED GAMES</h1>
        <p className="text-neutral-400">Manage your matches and approve players</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-48 bg-neutral-800 rounded-3xl animate-pulse" />)
        ) : myGames.length === 0 ? (
          <div className="py-20 text-center bg-neutral-800/20 rounded-3xl border-2 border-dashed border-neutral-800">
            <Trophy size={48} className="mx-auto mb-4 text-neutral-700" />
            <h3 className="text-xl font-bold">No games hosted yet</h3>
            <p className="text-neutral-500 mb-6">Start hosting and build your community!</p>
            <button onClick={() => window.location.href='/host-game'} className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-xl">
              Host Now
            </button>
          </div>
        ) : (
          myGames.map(game => (
            <div key={game._id} className="bg-neutral-800/50 border border-neutral-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {game.gameType}
                    </span>
                    <h2 className="text-2xl font-black mt-1 uppercase italic tracking-tighter">
                      {game.teams?.teamA?.name} vs {game.teams?.teamB?.name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Total Reserved</p>
                    <p className="text-xl font-black text-yellow-500">{game.totalCost} Coins</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-400">
                    <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full">
                      <Calendar size={14} className="text-yellow-500" /> {new Date(game.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full">
                      <Clock size={14} className="text-yellow-500" /> {game.time}
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full">
                      <MapPin size={14} className="text-yellow-500" /> {game.ground?.name || 'Self-Arranged'}
                    </div>
                  </div>
                  
                  {game.status !== 'CANCELLED' && (
                    <button 
                      onClick={() => handleCancelGame(game._id)}
                      className="px-4 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-black rounded-full hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider"
                    >
                      Cancel Game
                    </button>
                  )}
                  {game.status === 'CANCELLED' && (
                    <span className="px-4 py-1.5 bg-neutral-900 text-neutral-500 text-[10px] font-black rounded-full uppercase tracking-wider">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Pending Requests</h3>
                <div className="space-y-3">
                  {['teamA', 'teamB'].map((teamKey, tIdx) => (
                    game.teams?.[teamKey]?.slots?.map((slot, sIdx) => (
                      slot.status === 'PENDING' && (
                        <div key={`${teamKey}-${sIdx}`} className="flex items-center justify-between p-4 bg-neutral-900 rounded-2xl border border-neutral-800 group hover:border-yellow-500/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#84CC16]/10 rounded-full flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                              {slot.user?.profilePicture ? (
                                <img 
                                  src={slot.user.profilePicture} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{ display: slot.user?.profilePicture ? 'none' : 'flex' }}
                              >
                                <span className="text-[#84CC16] font-black text-sm">
                                  {slot.user?.name ? slot.user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : '?'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="font-black uppercase tracking-tighter">{slot.user?.name}</p>
                              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                                TEAM {tIdx === 0 ? 'A' : 'B'} • {slot.role}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleReject(game._id, tIdx === 0 ? 'A' : 'B', sIdx)}
                              className="p-2 bg-neutral-800 text-neutral-400 hover:text-red-500 rounded-xl transition-colors"
                            >
                              <X size={20} />
                            </button>
                            <button 
                              onClick={() => handleApprove(game._id, tIdx === 0 ? 'A' : 'B', sIdx)}
                              className="p-2 bg-yellow-500 text-black rounded-xl hover:scale-105 transition-transform"
                            >
                              <Check size={20} />
                            </button>
                          </div>
                        </div>
                      )
                    ))
                  ))}
                  {!myGames.some(g => g._id === game._id && (g.teams?.teamA?.slots?.some(s => s.status === 'PENDING') || g.teams?.teamB?.slots?.some(s => s.status === 'PENDING'))) && (
                    <div className="text-center py-4 text-neutral-600 text-sm italic">
                      No pending join requests
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyHostedGames;
