import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Users, LogOut, Clock, MapPin, 
  Trophy, Info, Calendar, Coins, User
} from 'lucide-react';

const MyJoinedGames = () => {
  const [joinedGames, setJoinedGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const [disputeModal, setDisputeModal] = useState({ isOpen: false, gameId: null, reason: "" });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJoinedGames = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/hosted-game/my-joined`, { withCredentials: true });
      setJoinedGames(res.data.games);
    } catch (err) {
      toast.error("Failed to fetch your joined games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoinedGames();
  }, []);

  const handleLeave = async (gameId) => {
    if (!window.confirm("Are you sure you want to leave this game? Your coins will be refunded or released.")) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/hosted-game/leave`, {
        gameId
      }, { withCredentials: true });

      if (res.data.success) {
        toast.success(res.data.message);
        fetchJoinedGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave game");
    }
  };

  const handleVoteStarted = async (gameId) => {
    if (!window.confirm("Confirm that this game has started? This will eventually release coins to the host once majority is reached.")) return;
    try {
      setActionLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/hosted-game/vote-started`, {
        gameId
      }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchJoinedGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to vote game started");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeModal.reason.trim()) {
      return toast.error("Please provide a reason for the dispute.");
    }
    try {
      setActionLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/hosted-game/raise-dispute`, {
        gameId: disputeModal.gameId,
        reason: disputeModal.reason
      }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        setDisputeModal({ isOpen: false, gameId: null, reason: "" });
        fetchJoinedGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to raise dispute");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">MY JOINED MATCHES</h1>
        <p className="text-neutral-400">Games you've requested to join or have already joined</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-48 bg-neutral-800 rounded-3xl animate-pulse" />)
        ) : joinedGames.length === 0 ? (
          <div className="py-20 text-center bg-neutral-800/20 rounded-3xl border-2 border-dashed border-neutral-800">
            <Trophy size={48} className="mx-auto mb-4 text-neutral-700" />
            <h3 className="text-xl font-bold">No matches joined yet</h3>
            <p className="text-neutral-500 mb-6">Explore games hosted by the community and join one!</p>
            <button onClick={() => window.location.href='/join-games'} className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-xl">
              Find Games
            </button>
          </div>
        ) : (
          joinedGames.map(game => (
            <div key={game._id} className="bg-neutral-800/50 border border-neutral-800 rounded-3xl overflow-hidden relative">
              {game.status === 'CANCELLED' && (
                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                   <span className="bg-red-500 text-white px-6 py-2 rounded-full font-black uppercase italic tracking-tighter transform -rotate-12">
                     GAME CANCELLED
                   </span>
                </div>
              )}

              <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {game.gameType}
                    </span>
                    <h2 className="text-2xl font-black mt-1 uppercase italic tracking-tighter">
                      {game.gameMode === 'QUICK' 
                        ? `${game.gameType} Quick Match` 
                        : `${game.teams?.teamA?.name || 'TBD'} vs ${game.teams?.teamB?.name || 'TBD'}`}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      game.mySlotStatus === 'PENDING' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {game.mySlotStatus}
                    </p>
                    <p className="text-xs text-neutral-500 mt-2 font-bold uppercase">{game.myRole}</p>
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
                  
                  <div className="flex flex-wrap gap-2">
                    {game.status !== 'CANCELLED' && game.mySlotStatus === 'JOINED' && game.perPlayerCharge > 0 && game.coinTransferStatus === 'PENDING' && (
                      <>
                        {!game.myVote ? (
                          <button 
                            onClick={() => handleVoteStarted(game._id)}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-1.5 bg-green-500/20 text-green-500 text-[10px] font-black rounded-full hover:bg-green-500 hover:text-white transition-all uppercase tracking-wider disabled:opacity-50"
                          >
                            <Trophy size={12} /> Game Started
                          </button>
                        ) : (
                          <span className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-black rounded-full uppercase tracking-wider">
                            Voted Started
                          </span>
                        )}
                        <button 
                          onClick={() => setDisputeModal({ isOpen: true, gameId: game._id, reason: "" })}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-1.5 bg-orange-500/20 text-orange-500 text-[10px] font-black rounded-full hover:bg-orange-500 hover:text-black transition-all uppercase tracking-wider disabled:opacity-50"
                        >
                          <Info size={12} /> Raise Dispute
                        </button>
                      </>
                    )}
                    {game.coinTransferStatus === 'DISPUTED' && (
                      <span className="flex items-center gap-2 px-4 py-1.5 bg-orange-500/20 text-orange-500 text-[10px] font-black rounded-full uppercase tracking-wider">
                        Dispute Active
                      </span>
                    )}
                    {game.coinTransferStatus === 'COMPLETED' && (
                      <span className="flex items-center gap-2 px-4 py-1.5 bg-green-500/20 text-green-500 text-[10px] font-black rounded-full uppercase tracking-wider">
                        Settled
                      </span>
                    )}
                    
                    {game.status !== 'CANCELLED' && (
                      <button 
                        onClick={() => handleLeave(game._id)}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 text-neutral-400 text-[10px] font-black rounded-full hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider disabled:opacity-50"
                      >
                        <LogOut size={12} /> Leave Match
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-neutral-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-[#55DEE8]/10 rounded-full flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                      {game.host?.profilePicture ? (
                        <img 
                          src={game.host.profilePicture} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ display: game.host?.profilePicture ? 'none' : 'flex' }}
                      >
                        <User size={16} className="text-[#55DEE8]" />
                      </div>
                   </div>
                   <div className="text-[10px]">
                      <p className="text-neutral-500 font-bold uppercase">Hosted By</p>
                      <p className="font-black uppercase tracking-tighter">{game.host?.name}</p>
                   </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 font-black">
                  <Coins size={14} /> {game.perPlayerCharge}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dispute Modal */}
      {disputeModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111] border border-neutral-800 p-8 rounded-[2rem] w-full max-w-md animate-slide-up shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Raise Dispute</h2>
                <p className="text-xs text-neutral-400 font-bold uppercase mt-2">Team will review your issue</p>
              </div>
              <button 
                onClick={() => setDisputeModal({ isOpen: false, gameId: null, reason: "" })}
                className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRaiseDispute} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-2">
                  Reason for Dispute
                </label>
                <textarea 
                  value={disputeModal.reason}
                  onChange={(e) => setDisputeModal({ ...disputeModal, reason: e.target.value })}
                  placeholder="Host didn't show up, match didn't happen, etc."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-orange-500 transition-colors h-32 resize-none font-medium"
                />
              </div>
              <button 
                type="submit" 
                disabled={actionLoading || !disputeModal.reason.trim()}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-black uppercase italic tracking-tighter text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                {actionLoading ? "Submitting..." : "Submit Dispute"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyJoinedGames;
