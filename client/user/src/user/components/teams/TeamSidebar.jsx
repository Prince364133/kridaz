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
            <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {activeTab === 'myTeams' ? 'My Teams' : 'Opponents'}
            </h2>
            <p className="text-xs text-white/40 font-medium tracking-wide mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              {activeTab === 'myTeams' ? 'Manage your squads' : 'Rival discovery'}
            </p>
          </div>
          <button 
            onClick={activeTab === 'myTeams' ? onCreateTeam : () => setIsAddOpponentOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-xs font-black rounded-[15px] shadow-lg shadow-[#55DEE8]/10 hover:shadow-[#BFF367]/15 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus size={16} />
            <span className="uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>{activeTab === 'myTeams' ? 'Create' : 'Add'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
          <input 
            type="text" 
            placeholder="Search teams or ID..." 
            style={{ fontFamily: "'Inter', sans-serif" }}
            className="w-full bg-white/[0.03] border border-white/10 rounded-[15px] py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#55DEE8]/30 transition-colors uppercase font-bold tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/[0.03] rounded-[15px] border border-white/5">
          <button 
            onClick={() => setActiveTab('myTeams')}
            style={{ fontFamily: "'Inter', sans-serif" }}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[15px] transition-all ${
              activeTab === 'myTeams' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg shadow-[#55DEE8]/10' : 'text-white/40 hover:text-white'
            }`}
          >
            My Teams
          </button>
          <button 
            onClick={() => setActiveTab('opponentTeams')}
            style={{ fontFamily: "'Inter', sans-serif" }}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[15px] transition-all ${
              activeTab === 'opponentTeams' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg shadow-[#55DEE8]/10' : 'text-white/40 hover:text-white'
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
              <div key={i} className="h-20 bg-white/[0.03] animate-pulse rounded-[15px]" />
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
                style={{ fontFamily: "'Inter', sans-serif" }}
                className={`w-full flex items-center gap-3 p-3 rounded-[15px] transition-all group ${
                  isSelected 
                    ? 'bg-gradient-to-r from-[#55DEE8]/5 to-[#BFF367]/5 border border-[#55DEE8]/20 shadow-[0_0_15px_rgba(85,222,232,0.06)]' 
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-[15px] bg-black border-2 flex items-center justify-center text-[#55DEE8] font-bold overflow-hidden transition-colors ${isSelected ? 'border-[#55DEE8]' : 'border-white/10 group-hover:border-[#55DEE8]/50'}`}>
                    {team.image ? (
                      <img src={team.image} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{team.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-black text-[#55DEE8] text-[8px] px-1.5 py-0.5 rounded-full border border-white/10 font-black uppercase">
                    {team.sportType?.slice(0, 3)}
                  </div>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`font-black truncate transition-colors ${isSelected ? 'text-[#55DEE8]' : 'text-white/80 group-hover:text-white'}`}>
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
                <ChevronRight size={14} className={`transition-all ${isSelected ? 'text-[#55DEE8]' : 'text-white/20 -rotate-90 md:rotate-0'}`} />
              </motion.button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-[15px] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
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
