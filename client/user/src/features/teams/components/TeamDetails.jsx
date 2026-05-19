import React from 'react';
import { Users, UserPlus, Trophy, Calendar, Mail, Phone, Shield, ChevronRight, Check, X, Search, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHandleOpponentRequestMutation } from '@redux/api/teamApi';
import toast from 'react-hot-toast';

const TeamDetails = ({ team, onInviteClick, onCreateClick, onBack }) => {
  const [handleRequest, { isLoading: isHandling }] = useHandleOpponentRequestMutation();

  if (!team) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] text-white/40 p-12">
        <div className="w-24 h-24 rounded-[15px] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#55DEE8]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Users className="text-white/20 text-4xl group-hover:text-[#55DEE8]/50 transition-colors duration-500 relative z-10" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Open Sans', sans-serif" }}>Select a Team</h2>
        <p className="text-white/30 max-w-sm text-center text-sm font-medium leading-relaxed mb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
          Choose a team from the sidebar to manage members, view stats, and organize your squad for upcoming matches.
        </p>
        
        <button 
          onClick={onCreateClick}
          className="group relative px-8 py-4 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black rounded-[15px] flex items-center gap-3 shadow-lg shadow-[#55DEE8]/10 hover:shadow-[#BFF367]/15 hover:brightness-[1.04] transition-all hover:-translate-y-0.5 active:translate-y-0 overflow-hidden duration-300"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[30deg]" />
          <UserPlus className="text-lg" />
          <span className="uppercase tracking-widest text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>Create New Team</span>
        </button>
      </div>
    );
  }

  const members = team.members || [];
  const customMembers = team.customMembers || [];
  const opponents = team.opponents || [];
  const pendingRequests = team.opponentRequests?.filter(r => r.status === 'PENDING') || [];

  const onHandleOpponent = async (requestId, action) => {
    try {
      await handleRequest({ teamId: team._id, requestId, action }).unwrap();
      toast.success(`Opponent request ${action.toLowerCase()}ed`);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to handle request');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(team.teamCode);
    toast.success('Team ID copied to clipboard!');
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] overflow-hidden relative">
      {/* Mobile Back Button */}
      <button 
        onClick={onBack}
        className="md:hidden absolute top-4 left-4 z-20 p-2.5 bg-black/40 backdrop-blur-md rounded-[15px] text-white border border-white/10 shadow-lg"
      >
        <ChevronRight className="rotate-180" />
      </button>

      {/* Team Header Banner */}
      <div className="relative h-48 md:h-64 shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#55DEE8]/15 via-[#BFF367]/5 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[15px] group cursor-pointer hover:border-[#55DEE8]/50 transition-all" onClick={copyToClipboard}>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>Unique Team ID</span>
            <span className="text-sm font-black text-[#55DEE8] tracking-[0.2em]">{team.teamCode}</span>
          </div>
          <Copy size={16} className="text-white/20 group-hover:text-[#55DEE8] transition-colors" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row items-end gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[15px] bg-black border-4 border-[#0a0a0a] shadow-2xl flex items-center justify-center text-[#55DEE8] text-4xl font-bold overflow-hidden shrink-0">
            {team.image ? <img src={team.image} alt={team.name} className="w-full h-full object-cover" /> : team.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Open Sans', sans-serif" }}>{team.name}</h1>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 border border-[#55DEE8]/10 text-[#55DEE8] text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>{team.sportType}</span>
            </div>
            <p className="text-white/60 text-sm md:text-base max-w-2xl line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>{team.description || "No description provided."}</p>
          </div>
          <div className="pb-2">
            <button 
              onClick={onInviteClick}
              className="px-6 py-3 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] hover:brightness-[1.04] text-black font-black rounded-[15px] flex items-center gap-2 shadow-lg shadow-[#55DEE8]/10 hover:shadow-[#BFF367]/15 transition-all hover:-translate-y-0.5 active:translate-y-0 duration-300 whitespace-nowrap uppercase tracking-widest text-xs"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <UserPlus size={16} /> Add Members
            </button>
          </div>
        </div>
      </div>

      {/* Team Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 shrink-0">
        <div className="bg-[#121212] p-4 rounded-[15px] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[15px] bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Shield size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-white/40 text-[9px] uppercase font-black tracking-wider">Captain</p>
            <p className="text-white font-black truncate text-sm uppercase">{team.captainName || "Not set"}</p>
          </div>
        </div>
        <div className="bg-[#121212] p-4 rounded-[15px] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[15px] bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-white/40 text-[9px] uppercase font-black tracking-wider">Members</p>
            <p className="text-white font-black text-sm">{members.length + customMembers.length}</p>
          </div>
        </div>
        <div className="bg-[#121212] p-4 rounded-[15px] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[15px] bg-red-500/10 flex items-center justify-center text-red-500">
            <Users size={20} />
          </div>
          <div>
            <p className="text-white/40 text-[9px] uppercase font-black tracking-wider">Opponents</p>
            <p className="text-white font-black text-sm">{opponents.length}</p>
          </div>
        </div>
        <div className="bg-[#121212] p-4 rounded-[15px] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[15px] bg-green-500/10 flex items-center justify-center text-green-500">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-white/40 text-[9px] uppercase font-black tracking-wider">Created</p>
            <p className="text-white font-black text-sm">{new Date(team.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Members List (Left Column) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Opponent Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-bold text-lg tracking-tight flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="w-1 h-5 bg-orange-500 rounded-full" />
                  Opponent Requests ({pendingRequests.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map((req) => (
                    <div key={req._id} className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-[15px] flex items-center gap-4">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-white font-bold text-sm truncate uppercase italic">{req.fromTeam?.name}</p>
                        <p className="text-orange-500/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">Wants to be opponents</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          disabled={isHandling}
                          onClick={() => onHandleOpponent(req._id, 'ACCEPT')}
                          className="w-8 h-8 bg-orange-500 text-black rounded-[15px] flex items-center justify-center hover:bg-orange-400 transition-colors"
                        >
                          <Check size={12} />
                        </button>
                        <button 
                          disabled={isHandling}
                          onClick={() => onHandleOpponent(req._id, 'REJECT')}
                          className="w-8 h-8 bg-white/5 text-white/40 rounded-[15px] flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Members */}
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight mb-4 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                <span className="w-1 h-5 bg-gradient-to-b from-[#55DEE8] to-[#BFF367] rounded-full" />
                Platform Members ({members.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {members.map((member) => (
                  <div key={member._id} className="bg-white/[0.02] p-4 rounded-[15px] border border-white/5 hover:border-[#55DEE8]/20 transition-all flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-[15px] bg-white/5 overflow-hidden border border-white/10">
                      <img src={member.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} alt={member.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-black text-sm truncate uppercase tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>@{member.username}</h4>
                      <p className="text-[#55DEE8] text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Members */}
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight mb-4 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                <span className="w-1 h-5 bg-yellow-500 rounded-full" />
                Custom Players ({customMembers.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customMembers.map((member, index) => (
                  <div key={index} className="bg-white/[0.02] p-4 rounded-[15px] border border-white/5 border-l-4 border-l-yellow-500/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[15px] bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <span className="text-lg font-black uppercase">{member.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-black text-sm truncate uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>{member.name}</h4>
                      <div className="flex items-center gap-3 text-[9px] text-white/40 font-bold mt-1">
                        {member.phone && <span className="flex items-center gap-1 uppercase"><Phone size={10} /> {member.phone}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Opponents List (Right Column) */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg tracking-tight flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="w-1 h-5 bg-red-500 rounded-full" />
              Opponents ({opponents.length})
            </h3>
            <div className="space-y-3">
              {opponents.map((opp) => (
                <div key={opp._id} className="bg-white/[0.02] p-4 rounded-[15px] border border-white/5 flex items-center gap-4 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-[15px] bg-black border border-white/10 flex items-center justify-center text-red-500 overflow-hidden shrink-0">
                    {opp.image ? <img src={opp.image} alt="" className="w-full h-full object-cover" /> : <Users size={16} />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white font-black text-sm truncate uppercase italic tracking-tight">{opp.name}</p>
                    <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">{opp.city}</p>
                  </div>
                  <ChevronRight size={12} className="text-white/10 group-hover:text-red-500 transition-colors" />
                </div>
              ))}
              {opponents.length === 0 && (
                <div className="py-12 border border-dashed border-white/5 rounded-[15px] flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-white/5 rounded-[15px] flex items-center justify-center mb-3">
                    <Search className="text-white/10" />
                  </div>
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">No Opponents Linked</p>
                  <p className="text-white/10 text-[9px] mt-1">Use the "Add Opponent" search to find rivals</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeamDetails;
