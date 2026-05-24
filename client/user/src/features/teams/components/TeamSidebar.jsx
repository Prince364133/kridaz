import React, { useState } from 'react';
import { useGetMyTeamsQuery, useGetOpponentTeamsQuery } from '@redux/api/teamApi';
import { useGetMyScoringGamesQuery } from '@redux/api/scoringApi';
import { Plus, Users, Search, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddOpponentModal from './AddOpponentModal';
import StartScoringModal from '@features/scoring/components/StartScoringModal';
import { useLocation, useNavigate } from 'react-router-dom';

const TeamSidebar = ({ onSelectTeam, selectedTeamId, onCreateTeam }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('myTeams'); // 'myTeams', 'opponentTeams', 'scoringMatches'
  const [isAddOpponentOpen, setIsAddOpponentOpen] = useState(false);
  const [isStartScoringOpen, setIsStartScoringOpen] = useState(false);
  const [startScoringInitialData, setStartScoringInitialData] = useState(null);

  React.useEffect(() => {
    if (location.state?.openStartScoringModal) {
      setIsStartScoringOpen(true);
      if (location.state?.initialGameData) {
        setStartScoringInitialData(location.state.initialGameData);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const { data: myData, isLoading: isMyLoading } = useGetMyTeamsQuery();
  const { data: oppData, isLoading: isOppLoading } = useGetOpponentTeamsQuery(undefined, {
    skip: activeTab !== 'opponentTeams' && activeTab !== 'myTeams'
  });
  const { data: scoringData, isLoading: isScoringLoading } = useGetMyScoringGamesQuery(undefined, {
    skip: activeTab !== 'scoringMatches'
  });

  let data = null;
  let isLoading = false;
  if (activeTab === 'myTeams') { data = myData; isLoading = isMyLoading; }
  else if (activeTab === 'opponentTeams') { data = oppData; isLoading = isOppLoading; }
  else if (activeTab === 'scoringMatches') { data = scoringData; isLoading = isScoringLoading; }

  const items = activeTab === 'scoringMatches' ? (data?.games || []) : (data?.teams || []);
  const currentUserId = data?.currentUserId;

  const filteredItems = items.filter(item => {
    const title = item.name || item.title || "";
    const code = item.teamCode || item.shortId || "";
    return title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full md:w-80 h-full border-r border-white/10 bg-black/20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-black/40">
        <div className="mb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {activeTab === 'myTeams' ? 'My Teams' : activeTab === 'opponentTeams' ? 'Opponents' : 'My Matches'}
            </h2>
            <p className="text-xs text-white/40 font-medium tracking-wide mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              {activeTab === 'myTeams' ? 'Manage your squads' : activeTab === 'opponentTeams' ? 'Rival discovery' : 'Manage your scoring matches'}
            </p>
          </div>
        </div>

        {/* Start Scoring Button */}
        <div className="mb-4">
          <button
            onClick={() => setIsStartScoringOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black uppercase tracking-widest text-sm rounded-[15px] shadow-lg shadow-[#55DEE8]/10 hover:shadow-[#BFF367]/15 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <Trophy size={16} />
            Start Scoring Match
          </button>
        </div>

        {/* Search and Action Button */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
            <input 
              type="text" 
              placeholder="Search..." 
              style={{ fontFamily: "'Inter', sans-serif" }}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[15px] py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#55DEE8]/30 transition-colors uppercase font-bold tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab !== 'scoringMatches' && (
            <button 
              onClick={activeTab === 'myTeams' ? onCreateTeam : () => setIsAddOpponentOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[10px] font-black rounded-[12px] shadow-lg shadow-[#55DEE8]/10 hover:shadow-[#BFF367]/15 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 shrink-0"
            >
              <Plus size={14} />
              <span className="uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                {activeTab === 'myTeams' ? 'Create Team' : 'Add Opponent'}
              </span>
            </button>
          )}
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
          <button 
            onClick={() => setActiveTab('scoringMatches')}
            style={{ fontFamily: "'Inter', sans-serif" }}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[15px] transition-all ${
              activeTab === 'scoringMatches' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg shadow-[#55DEE8]/10' : 'text-white/40 hover:text-white'
            }`}
          >
            Matches
          </button>
        </div>
      </div>

      {/* Team/Match List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/[0.03] animate-pulse rounded-[15px]" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isMatch = activeTab === 'scoringMatches';
            const itemId = isMatch ? item.id : item._id;
            const isSelected = selectedTeamId === itemId;
            
              const statusColors = {
                'NOT_STARTED': { bg: 'bg-white/10', text: 'text-white/50' },
                'LIVE':        { bg: 'bg-red-500/20', text: 'text-red-400' },
                'PAUSED':      { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
                'COMPLETED':   { bg: 'bg-[#BFF367]/10', text: 'text-[#BFF367]' },
              };
              const statusStyle = statusColors[item.scoringStatus] || statusColors['NOT_STARTED'];
              if (isMatch) return (
                <div key={itemId} className="w-full flex flex-col p-3 rounded-[15px] bg-white/[0.02] border border-white/5 mb-2 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-[#55DEE8] text-sm truncate flex-1 mr-2">{item.name || item.title}</h4>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                        {item.scoringStatus === 'NOT_STARTED' ? 'SETUP' : item.scoringStatus}
                      </span>
                      <span className="text-[10px] font-black text-black bg-[#BFF367] px-2 py-0.5 rounded uppercase">{item.shortId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] text-white/30 uppercase font-bold">{item.format}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-[10px] text-white/30 uppercase font-bold">{item.ballType}</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 text-center bg-black/40 rounded-lg py-1 border border-white/5">
                      <span className="text-xs text-white/80 font-bold">{item.teams?.[0]?.name || 'TBD'}</span>
                    </div>
                    <div className="flex items-center justify-center text-[10px] text-white/40 font-black">VS</div>
                    <div className="flex-1 text-center bg-black/40 rounded-lg py-1 border border-white/5">
                      <span className="text-xs text-white/80 font-bold">{item.teams?.[1]?.name || 'TBD'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <a href={`/scoring/${item.id}`} className="flex-1 text-center text-[10px] uppercase font-black tracking-widest text-[#55DEE8] border border-[#55DEE8]/30 rounded-lg py-1.5 hover:bg-[#55DEE8]/10 transition-colors">Launch App</a>
                    <a href={`/analytics/${item.shortId || item.id}`} target="_blank" rel="noreferrer" className="flex-1 text-center text-[10px] uppercase font-black tracking-widest text-[#BFF367] border border-[#BFF367]/30 rounded-lg py-1.5 hover:bg-[#BFF367]/10 transition-colors">Watch Live</a>
                  </div>
                </div>
              );

            return (
              <motion.button
                key={itemId}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectTeam(item)}
                style={{ fontFamily: "'Inter', sans-serif" }}
                className={`w-full flex items-center gap-3 p-3 rounded-[15px] transition-all group ${
                  isSelected 
                    ? 'bg-gradient-to-r from-[#55DEE8]/5 to-[#BFF367]/5 border border-[#55DEE8]/20 shadow-[0_0_15px_rgba(85,222,232,0.06)]' 
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-[15px] bg-black border-2 flex items-center justify-center text-[#55DEE8] font-bold overflow-hidden transition-colors ${isSelected ? 'border-[#55DEE8]' : 'border-white/10 group-hover:border-[#55DEE8]/50'}`}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{item.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-black text-[#55DEE8] text-[8px] px-1.5 py-0.5 rounded-full border border-white/10 font-black uppercase">
                    {item.sportType?.slice(0, 3)}
                  </div>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`font-black truncate transition-colors ${isSelected ? 'text-[#55DEE8]' : 'text-white/80 group-hover:text-white'}`}>
                      {item.name}
                    </h4>
                    <span className="text-[8px] font-black text-white/20 uppercase bg-white/5 px-1 rounded">{item.teamCode}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">{item.sportType}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[10px] text-white/40 font-bold">{item.members?.length + (item.customMembers?.length || 0)} Members</span>
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
        myTeams={(myData?.teams || []).filter(t => t.members?.some(m => m.user === currentUserId || m._id === currentUserId || (typeof m === 'string' && m === currentUserId)))}
      />

      <StartScoringModal
        isOpen={isStartScoringOpen}
        initialData={startScoringInitialData}
        onClose={() => {
          setIsStartScoringOpen(false);
          setStartScoringInitialData(null);
        }}
        onSuccess={() => {
          setIsStartScoringOpen(false);
          setStartScoringInitialData(null);
          setActiveTab('scoringMatches');
        }}
      />
    </div>
  );
};

export default TeamSidebar;
