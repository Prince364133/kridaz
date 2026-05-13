import React from 'react';
import { FaUsers, FaUserPlus, FaTrophy, FaCalendarAlt, FaEnvelope, FaPhone, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const TeamDetails = ({ team, onInviteClick }) => {
  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#0a0a0a]">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <FaUsers className="text-white/10 text-4xl" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Select a Team</h2>
        <p className="text-white/40 max-w-xs">Choose a team from the sidebar to view details, members, and manage invitations.</p>
      </div>
    );
  }

  const members = team.members || [];
  const customMembers = team.customMembers || [];

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Team Header Banner */}
      <div className="relative h-48 md:h-64 shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row items-end gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-black border-4 border-[#0a0a0a] shadow-2xl flex items-center justify-center text-primary text-4xl font-bold overflow-hidden">
            {team.image ? <img src={team.image} alt={team.name} className="w-full h-full object-cover" /> : team.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-4xl font-bold text-white">{team.name}</h1>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">{team.sport}</span>
            </div>
            <p className="text-white/60 text-sm md:text-base max-w-2xl line-clamp-2">{team.description || "No description provided."}</p>
          </div>
          <div className="pb-2">
            <button 
              onClick={onInviteClick}
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all whitespace-nowrap"
            >
              <FaUserPlus /> Add Members
            </button>
          </div>
        </div>
      </div>

      {/* Team Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 shrink-0">
        <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <FaShieldAlt />
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Captain</p>
            <p className="text-white font-medium">{team.captainName || "Not set"}</p>
          </div>
        </div>
        <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <FaTrophy />
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Total Members</p>
            <p className="text-white font-medium">{members.length + customMembers.length}</p>
          </div>
        </div>
        <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
            <FaCalendarAlt />
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Created On</p>
            <p className="text-white font-medium">{new Date(team.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Members List Section */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
        <div className="space-y-6">
          {/* Platform Members */}
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full" />
              Platform Members ({members.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div key={member._id} className="bg-[#121212] p-4 rounded-2xl border border-white/5 hover:border-primary/20 transition-all flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden">
                    <img src={member.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt={member.username} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">@{member.username}</h4>
                    <p className="text-white/40 text-xs truncate capitalize">{member.role}</p>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="col-span-full py-8 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/20">
                  <FaUsers className="text-2xl mb-2" />
                  <p className="text-sm">No platform members yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Custom Members / Pending Invites */}
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full" />
              Custom Players ({customMembers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customMembers.map((member, index) => (
                <div key={index} className="bg-[#121212] p-4 rounded-2xl border border-white/5 border-l-4 border-l-yellow-500/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <span className="text-lg font-bold">{member.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{member.name}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-white/40 mt-1">
                      {member.email && <span className="flex items-center gap-1"><FaEnvelope /> {member.email}</span>}
                      {member.phone && <span className="flex items-center gap-1"><FaPhone /> {member.phone}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {customMembers.length === 0 && (
                <div className="col-span-full py-8 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/20">
                  <FaUserPlus className="text-2xl mb-2" />
                  <p className="text-sm">No custom players added</p>
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
