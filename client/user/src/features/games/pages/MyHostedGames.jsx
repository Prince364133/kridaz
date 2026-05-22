import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Users, Check, X, Clock, MapPin, Video, MonitorPlay,
  ChevronRight, Trophy, Info, AlertCircle, Calendar, User, PlayCircle, Search, Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HireOfficialModal from '@components/official/HireOfficialModal';
import SelectVenueModal from '@components/official/SelectVenueModal';

const MyHostedGames = () => {
  const [myGames, setMyGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const [hireModal, setHireModal] = useState({ open: false, gameId: null, role: null });
  const [venueModal, setVenueModal] = useState({ open: false, gameId: null });

  const handleProfessionalRequest = async (gameId, role, action) => {
    try {
      const endpointMap = {
        streamer: 'handle-streamer-request',
        umpire: 'handle-umpire-request',
        scorer: 'handle-scorer-request'
      };
      const endpoint = endpointMap[role];
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/hosted-game/${endpoint}`, {
        gameId, action
      }, { withCredentials: true });

      if (res.data.success) {
        toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} request ${action.toLowerCase()}d!`);
        fetchMyGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action.toLowerCase()} request`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-black tracking-tighter font-open-sans text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] mb-2 uppercase">MY HOSTED GAMES</h1>
        <p className="text-neutral-400 font-inter text-[20px]">Manage your matches and approve players</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-48 bg-neutral-800 rounded-3xl animate-pulse" />)
        ) : myGames.length === 0 ? (
          <div className="py-20 text-center bg-neutral-800/20 rounded-3xl border-2 border-dashed border-neutral-800">
            <Trophy size={48} className="mx-auto mb-4 text-neutral-700" />
            <h3 className="text-2xl md:text-3xl font-black tracking-tighter font-open-sans text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] mb-2 uppercase">No games hosted yet</h3>
            <p className="text-neutral-500 mb-6 font-inter text-[20px]">Start hosting and build your community!</p>
            <button onClick={() => window.location.href='/host-game'} className="px-8 py-3 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-bold rounded-xl uppercase tracking-wider shadow-lg hover:scale-105 transition-all">
              Host Now
            </button>
          </div>
        ) : (
          myGames.map(game => (
            <div key={game._id} className="bg-neutral-800/50 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {game.gameType}
                      </span>
                      {game.shortId && (
                        <button
                          onClick={() => { navigator.clipboard?.writeText(game.shortId); toast.success('Game ID copied!'); }}
                          className="bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] hover:border-[#55DEE8]/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-all flex items-center gap-1"
                          title="Click to copy Game ID"
                        >
                          <Info size={10} />
                          ID: {game.shortId}
                        </button>
                      )}
                    </div>
                    <h2 className="text-2xl font-black mt-1 uppercase italic tracking-tighter">
                      {game.teams?.teamA?.name} vs {game.teams?.teamB?.name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Total Reserved</p>
                    <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]">{game.totalCost} Coins</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-400">
                    <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full">
                      <Calendar size={14} className="text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]" /> {new Date(game.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full">
                      <Clock size={14} className="text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]" /> {game.time}
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full">
                      <MapPin size={14} className="text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]" /> {game.ground?.name || 'Self-Arranged'}
                    </div>
                  </div>
                  
                  {game.status !== 'CANCELLED' && (
                     <>
                       {game.umpire && game.scorer && game.ground && game.streamer ? (
                         <button 
                           onClick={() => navigate(`/matches/${game._id}/stream-setup`)}
                           className="px-4 py-1.5 bg-violet-500 text-white text-[10px] font-black rounded-full hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all uppercase tracking-wider flex items-center gap-1"
                         >
                           <Video size={14} /> Setup Live Stream
                         </button>
                       ) : (
                         <button 
                           onClick={() => {
                             const el = document.getElementById(`pro-services-${game._id}`);
                             el?.scrollIntoView({ behavior: 'smooth' });
                             toast("Venue, Umpire, Scorer & Streamer required!", { icon: '⚠️' });
                           }}
                           className="px-4 py-1.5 bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] border border-[#55DEE8]/20 text-[10px] font-black rounded-full hover:bg-gradient-to-r from-[#55DEE8]/20 to-[#BFF367]/20 transition-all uppercase tracking-wider flex items-center gap-1"
                         >
                           <AlertCircle size={14} /> Setup Incomplete
                         </button>
                       )}
                       <button 
                         onClick={() => handleCancelGame(game._id)}
                         className="px-4 py-1.5 bg-neutral-800 text-neutral-400 text-[10px] font-black rounded-full hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider"
                       >
                         Cancel Game
                       </button>
                     </>
                   )}
                  {game.status === 'CANCELLED' && (
                    <span className="px-4 py-1.5 bg-neutral-900 text-neutral-500 text-[10px] font-black rounded-full uppercase tracking-wider">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Player Slot Management Section */}
              <div className="p-6 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} /> Player Slot Management
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team A Slots */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] uppercase tracking-[0.2em] mb-2 px-2">TEAM A SLOTS</h4>
                    {game.teams?.teamA?.slots?.map((slot, index) => (
                      <div key={`A-${index}`} className="flex items-center justify-between p-3 bg-neutral-900 rounded-2xl border border-neutral-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                            {slot.user?.profilePicture ? (
                              <img src={slot.user.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={14} className="text-neutral-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-tighter">
                              {slot.user?.name || "OPEN SLOT"}
                            </p>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                              slot.status === 'RESERVED' ? 'bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]' : 
                              slot.status === 'JOINED' ? 'bg-green-500/10 text-green-500' : 'text-neutral-600'
                            }`}>
                              {slot.status || 'EMPTY'}
                            </span>
                          </div>
                        </div>
                        {slot.status === 'RESERVED' && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleReject(game._id, 'teamA', index)}
                              className="p-1.5 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-lg transition-all"
                            >
                              <X size={14} />
                            </button>
                            <button 
                              onClick={() => handleApprove(game._id, 'teamA', index)}
                              className="p-1.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black rounded-lg hover:scale-105 transition-all"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Team B Slots */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] uppercase tracking-[0.2em] mb-2 px-2">TEAM B SLOTS</h4>
                    {game.teams?.teamB?.slots?.map((slot, index) => (
                      <div key={`B-${index}`} className="flex items-center justify-between p-3 bg-neutral-900 rounded-2xl border border-neutral-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                            {slot.user?.profilePicture ? (
                              <img src={slot.user.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={14} className="text-neutral-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-tighter">
                              {slot.user?.name || "OPEN SLOT"}
                            </p>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                              slot.status === 'RESERVED' ? 'bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]' : 
                              slot.status === 'JOINED' ? 'bg-green-500/10 text-green-500' : 'text-neutral-600'
                            }`}>
                              {slot.status || 'EMPTY'}
                            </span>
                          </div>
                        </div>
                        {slot.status === 'RESERVED' && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleReject(game._id, 'teamB', index)}
                              className="p-1.5 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-lg transition-all"
                            >
                              <X size={14} />
                            </button>
                            <button 
                              onClick={() => handleApprove(game._id, 'teamB', index)}
                              className="p-1.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black rounded-lg hover:scale-105 transition-all"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

               {/* Professional Requests Section */}
               <div id={`pro-services-${game._id}`} className="p-6 bg-neutral-900/30 border-t border-neutral-800">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Professional Services</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   {/* Venue Slot */}
                   <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col justify-between min-h-[140px]">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center gap-2">
                         <MapPin size={16} className="text-orange-500" />
                         <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Venue</span>
                       </div>
                        {game.ground ? (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase">Booked</span>
                        ) : (
                          <button 
                            onClick={() => setVenueModal({ open: true, gameId: game._id })}
                            className="px-2 py-0.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[10px] font-black rounded-full uppercase hover:scale-105 transition-all"
                          >
                            Assign
                          </button>
                        )}
                     </div>
                     
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px] font-bold text-orange-500 border border-orange-500/20">
                         {game.ground?.name?.[0] || 'V'}
                       </div>
                       <p className="text-xs font-black uppercase tracking-tighter text-white truncate max-w-[100px]">
                         {game.ground?.name || 'Self-Arranged'}
                       </p>
                     </div>
                   </div>
                  {/* Umpire Slot */}
                  <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-500" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Umpire</span>
                      </div>
                      {game.umpire ? (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase">Assigned</span>
                      ) : (
                        <button 
                          onClick={() => setHireModal({ open: true, gameId: game._id, role: 'umpire' })}
                          className="px-2 py-0.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[10px] font-black rounded-full uppercase hover:scale-105 transition-all"
                        >
                          Hire
                        </button>
                      )}
                    </div>
                    
                    {game.umpire ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-500 border border-blue-500/20">
                          {game.umpire?.name?.[0] || 'U'}
                        </div>
                        <p className="text-xs font-black uppercase tracking-tighter text-white">{game.umpire?.name}</p>
                      </div>
                    ) : game.umpireRequest?.status === 'PENDING' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 flex items-center justify-center text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] border border-[#55DEE8]/20">
                            {game.umpireRequest?.user?.name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tighter text-white">{game.umpireRequest?.user?.name}</p>
                            <p className="text-[8px] text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] font-bold uppercase tracking-widest leading-tight">Requested Assignment</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleProfessionalRequest(game._id, 'umpire', 'REJECT')}
                            className="flex-1 py-1.5 bg-neutral-800 text-neutral-400 text-[8px] font-black rounded-lg uppercase hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => handleProfessionalRequest(game._id, 'umpire', 'APPROVE')}
                            className="flex-1 py-1.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[8px] font-black rounded-lg uppercase hover:scale-105 transition-all"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-600 italic">No umpire assigned</p>
                    )}
                  </div>

                  {/* Scorer Slot */}
                  <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Edit3 size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Scorer</span>
                      </div>
                      {game.scorer ? (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase">Assigned</span>
                      ) : (
                        <button 
                          onClick={() => setHireModal({ open: true, gameId: game._id, role: 'scorer' })}
                          className="px-2 py-0.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[10px] font-black rounded-full uppercase hover:scale-105 transition-all"
                        >
                          Hire
                        </button>
                      )}
                    </div>
                    
                    {game.scorer ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                          {game.scorer?.name?.[0] || 'S'}
                        </div>
                        <p className="text-xs font-black uppercase tracking-tighter text-white">{game.scorer?.name}</p>
                      </div>
                    ) : game.scorerRequest?.status === 'PENDING' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 flex items-center justify-center text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] border border-[#55DEE8]/20">
                            {game.scorerRequest?.user?.name?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tighter text-white">{game.scorerRequest?.user?.name}</p>
                            <p className="text-[8px] text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] font-bold uppercase tracking-widest leading-tight">Requested Assignment</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleProfessionalRequest(game._id, 'scorer', 'REJECT')}
                            className="flex-1 py-1.5 bg-neutral-800 text-neutral-400 text-[8px] font-black rounded-lg uppercase hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => handleProfessionalRequest(game._id, 'scorer', 'APPROVE')}
                            className="flex-1 py-1.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[8px] font-black rounded-lg uppercase hover:scale-105 transition-all"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-600 italic">No scorer assigned</p>
                    )}
                  </div>

                  {/* Streamer Slot */}
                  <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Video size={16} className="text-violet-500" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Streamer</span>
                      </div>
                      {game.streamer ? (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase">Assigned</span>
                      ) : (
                        <button 
                          onClick={() => setHireModal({ open: true, gameId: game._id, role: 'streamer' })}
                          className="px-2 py-0.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[10px] font-black rounded-full uppercase hover:scale-105 transition-all"
                        >
                          Hire
                        </button>
                      )}
                    </div>
                    
                    {game.streamer ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-[10px] font-bold text-violet-500 border border-violet-500/20">
                            {game.streamer?.name?.[0] || 'S'}
                          </div>
                          <p className="text-xs font-black uppercase tracking-tighter text-white">{game.streamer?.name}</p>
                        </div>
                        <button 
                          onClick={() => navigate(`/matches/${game._id}/stream-setup`)}
                          className="p-2 bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white rounded-lg transition-all"
                          title="Stream Settings"
                        >
                          <MonitorPlay size={14} />
                        </button>
                      </div>
                    ) : game.streamerRequest?.status === 'PENDING' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 flex items-center justify-center text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] border border-[#55DEE8]/20">
                            {game.streamerRequest?.user?.name?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tighter text-white">{game.streamerRequest?.user?.name}</p>
                            <p className="text-[8px] text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] font-bold uppercase tracking-widest leading-tight">Requested Assignment</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleProfessionalRequest(game._id, 'streamer', 'REJECT')}
                            className="flex-1 py-1.5 bg-neutral-800 text-neutral-400 text-[8px] font-black rounded-lg uppercase hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => handleProfessionalRequest(game._id, 'streamer', 'APPROVE')}
                            className="flex-1 py-1.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[8px] font-black rounded-lg uppercase hover:scale-105 transition-all"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-600 italic">No streamer assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <HireOfficialModal
        isOpen={hireModal.open}
        onClose={() => setHireModal({ open: false, gameId: null, role: null })}
        gameId={hireModal.gameId}
        role={hireModal.role}
        onInviteSent={fetchMyGames}
      />

      <SelectVenueModal
        isOpen={venueModal.open}
        onClose={() => setVenueModal({ open: false, gameId: null })}
        gameId={venueModal.gameId}
        onVenueSelected={fetchMyGames}
      />
    </div>
  );
};

export default MyHostedGames;
