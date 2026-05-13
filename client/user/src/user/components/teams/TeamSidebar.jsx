import React, { useState } from 'react';
import { useGetMyTeamsQuery } from '../../redux/api/teamApi';
import { FaPlus, FaUsers, FaSearch, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const TeamSidebar = ({ onSelectTeam, selectedTeamId, onCreateTeam }) => {
  const { data, isLoading } = useGetMyTeamsQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('myTeams'); // 'myTeams' or 'opponentTeams'

  const teams = data?.teams || [];

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    // For now, filtering is simple. In a real scenario, we might have a flag or logic to distinguish.
    // If team.owner is current user, it's "myTeam". If not, but user is member, it's also "myTeam" for this view.
    // Opponent teams might be teams the user has played against or public teams.
    // Let's stick to the user's request: "filter between 'my teams' and 'opponent teams'".
    // Since we don't have an "opponent" flag yet, let's assume all joined teams are "myTeams".
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#121212] border-r border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaUsers className="text-primary" /> Teams
          </h2>
          <button 
            onClick={onCreateTeam}
            className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
          >
            <FaPlus />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
          <input 
            type="text" 
            placeholder="Search teams..." 
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
          <button 
            onClick={() => setActiveTab('myTeams')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'myTeams' ? 'bg-primary text-black shadow-lg' : 'text-white/50 hover:text-white'
            }`}
          >
            My Teams
          </button>
          <button 
            onClick={() => setActiveTab('opponentTeams')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'opponentTeams' ? 'bg-primary text-black shadow-lg' : 'text-white/50 hover:text-white'
            }`}
          >
            Opponent
          </button>
        </div>
      </div>

      {/* Team List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredTeams.length > 0 ? (
          filteredTeams.map((team) => (
            <motion.button
              key={team._id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTeam(team)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedTeamId === team._id 
                  ? 'bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary border border-primary/20 overflow-hidden">
                  {team.image ? (
                    <img src={team.image} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold">{team.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <h4 className="text-white font-medium truncate">{team.name}</h4>
                <p className="text-white/40 text-xs truncate capitalize">{team.sport} • {team.members?.length + (team.customMembers?.length || 0)} Members</p>
              </div>
              <FaChevronRight className={`text-xs transition-transform ${selectedTeamId === team._id ? 'text-primary rotate-0' : 'text-white/20 -rotate-90 md:rotate-0'}`} />
            </motion.button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <FaUsers className="text-white/20 text-2xl" />
            </div>
            <p className="text-white/40 text-sm">No teams found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSidebar;
