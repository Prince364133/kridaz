import React, { useState } from 'react';
import { useGetMyTeamsQuery, useGetOpponentTeamsQuery } from '../../../redux/api/teamApi';
import { Plus, Users, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddOpponentModal from './AddOpponentModal';

const TeamSidebar = ({ onSelectTeam, selectedTeamId, onCreateTeam }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('myTeams'); // 'myTeams' or 'opponentTeams'
  const [isAddOpponentOpen, setIsAddOpponentOpen] = useState(false);

  const { data: myData, isLoading: isMyLoading } = useGetMyTeamsQuery();
  const { data: oppData, isLoading: isOppLoading } = useGetOpponentTeamsQuery(undefined, {
    skip: activeTab !== 'opponentTeams'
  });

  const data = activeTab === 'myTeams' ? myData : oppData;
  const isLoading = activeTab === 'myTeams' ? isMyLoading : isOppLoading;

  const teams = data?.teams || [];
  const currentUserId = data?.currentUserId;

  const filteredTeams = teams.filter(team => {
    return team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           team.teamCode?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full md:w-80 h-full border-r border-white/10 bg-black/20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-black/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight italic uppercase">
              {activeTab === 'myTeams' ? 'My Teams' : 'Opponents'}
            </h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-0.5">
              {activeTab === 'myTeams' ? 'Manage Your Squads' : 'Rival Discovery'}
            </p>
          </div>
          <button 
            onClick={activeTab === 'myTeams' ? onCreateTeam : () => setIsAddOpponentOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00] text-black text-xs font-black rounded-xl shadow-lg shadow-[#CCFF00]/20 hover:bg-[#b8e600] transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} />
            <span className="uppercase tracking-widest">{activeTab === 'myTeams' ? 'Create' : 'Add'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
          <input 
            type="text" 
            placeholder="Search teams or ID..." 
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#CCFF00]/50 transition-colors uppercase font-bold tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('myTeams')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'myTeams' ? 'bg-[#CCFF00] text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            My Teams
          </button>
          <button 
            onClick={() => setActiveTab('opponentTeams')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'opponentTeams' ? 'bg-[#CCFF00] text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            Opponents
          </button>
        </div>
      </div>

      {/* Team List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/[0.03] animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredTeams.length > 0 ? (
          filteredTeams.map((team) => {
            const isSelected = selectedTeamId === team._id;
            return (
              <motion.button
                key={team._id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectTeam(team)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${
                  isSelected 
                    ? 'bg-[#CCFF00]/10 border border-[#CCFF00]/20 shadow-[0_0_15px_rgba(204,255,0,0.1)]' 
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-2xl bg-black border-2 flex items-center justify-center text-[#CCFF00] font-bold overflow-hidden transition-colors ${isSelected ? 'border-[#CCFF00]' : 'border-white/10 group-hover:border-[#CCFF00]/50'}`}>
                    {team.image ? (
                      <img src={team.image} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{team.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-black text-[#CCFF00] text-[8px] px-1.5 py-0.5 rounded-full border border-white/10 font-black uppercase">
                    {team.sportType?.slice(0, 3)}
                  </div>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`font-black truncate transition-colors ${isSelected ? 'text-[#CCFF00]' : 'text-white/80 group-hover:text-white'}`}>
                      {team.name}
                    </h4>
                    <span className="text-[8px] font-black text-white/20 uppercase bg-white/5 px-1 rounded">{team.teamCode}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">{team.sportType}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[10px] text-white/40 font-bold">{team.members?.length + (team.customMembers?.length || 0)} Members</span>
                  </div>
                </div>
                <ChevronRight size={14} className={`transition-all ${isSelected ? 'text-[#CCFF00]' : 'text-white/20 -rotate-90 md:rotate-0'}`} />
              </motion.button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-[20px] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
              <Users className="text-white/10 text-2xl" />
            </div>
            <p className="text-white/40 text-sm font-bold">No teams found</p>
            <p className="text-white/20 text-xs mt-1">Start by creating your first squad or adding an opponent.</p>
          </div>
        )}
      </div>

      <AddOpponentModal 
        isOpen={isAddOpponentOpen}
        onClose={() => setIsAddOpponentOpen(false)}
        myTeams={teams.filter(t => t.members?.some(m => m.user === currentUserId || m._id === currentUserId || (typeof m === 'string' && m === currentUserId)))}
      />
    </div>
  );
};

export default TeamSidebar;
