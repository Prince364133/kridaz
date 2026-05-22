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

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-black tracking-tighter uppercase font-open-sans">MY JOINED MATCHES</h1>
        <p className="text-neutral-400 font-open-sans">Games you've requested to join or have already joined</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-48 bg-neutral-800 rounded-[15px] animate-pulse" />)
        ) : joinedGames.length === 0 ? (
          <div className="py-20 text-center bg-neutral-800/20 rounded-[15px] border-2 border-dashed border-neutral-800">
            <Trophy size={48} className="mx-auto mb-4 text-neutral-700" />
            <h3 className="text-xl font-bold font-open-sans">No matches joined yet</h3>
            <p className="text-neutral-500 mb-6 font-open-sans">Explore games hosted by the community and join one!</p>
            <button onClick={() => window.location.href='/join-games'} className="px-8 py-3 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-bold rounded-xl">
              Find Games
            </button>
          </div>
        ) : (
          joinedGames.map(game => (
            <div key={game._id} className="bg-neutral-800/50 border border-neutral-800 rounded-[15px] overflow-hidden relative">
              {game.status === 'CANCELLED' && (
                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                   <span className="bg-red-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-tighter transform -rotate-12 font-open-sans">
                     GAME CANCELLED
                   </span>
                </div>
              )}

              <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-[#55DEE8]/10 text-[#55DEE8] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-open-sans">
                      {game.gameType}
                    </span>
                    <h2 className="text-2xl font-black mt-1 uppercase tracking-tighter font-open-sans">
                      {game.gameMode === 'QUICK' 
                        ? `${game.gameType} Quick Match` 
                        : `${game.teams?.teamA?.name || 'Team A'} vs ${game.teams?.teamB?.name || 'Team B'}`}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest font-open-sans ${
                      game.mySlotStatus === 'PENDING' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {game.mySlotStatus}
                    </p>
                    <p className="text-xs text-neutral-500 mt-2 font-bold uppercase font-open-sans">{game.myRole}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-400">
                    <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full">
                      <Calendar size={14} className="text-[#55DEE8]" /> {new Date(game.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full">
                      <Clock size={14} className="text-[#BFF367]" /> {game.time}
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full">
                      <MapPin size={14} className="text-[#55DEE8]" /> {game.ground?.name || 'Self-Arranged'}
                    </div>
                  </div>
                  
                  {game.status !== 'CANCELLED' && (
                    <button 
                      onClick={() => handleLeave(game._id)}
                      className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 text-neutral-400 text-[10px] font-black rounded-full hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider font-open-sans"
                    >
                      <LogOut size={12} /> Leave Match
                    </button>
                  )}
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
                      <p className="text-neutral-500 font-bold uppercase font-open-sans">Hosted By</p>
                      <p className="font-black uppercase tracking-tighter font-open-sans">{game.host?.name}</p>
                   </div>
                </div>
                <div className="flex items-center gap-1 text-[#BFF367] font-black font-open-sans">
                  <Coins size={14} /> {game.perPlayerCharge}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyJoinedGames;
