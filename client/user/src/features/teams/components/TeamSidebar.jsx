import React, { useState } from 'react';
import { useGetMyTeamsQuery, useGetOpponentTeamsQuery } from '@redux/api/teamApi';
import { useGetMyScoringGamesQuery } from '@redux/api/scoringApi';
import { Plus, Users, Search, ChevronRight } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  React.useEffect(() => {
    if (location.state?.openStartScoringModal) {
      setIsStartScoringOpen(true);
      if (location.state?.initialGameData) {
        setStartScoringInitialData(location.state.initialGameData);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const { data: myData, isLoading: isMyLoading } = useGetMyTeamsQuery(undefined, {
    pollingInterval: activeTab === 'myTeams' ? 15000 : undefined,
  });
  const { data: oppData, isLoading: isOppLoading } = useGetOpponentTeamsQuery(undefined, {
    skip: activeTab !== 'opponentTeams',
    pollingInterval: activeTab === 'opponentTeams' ? 15000 : undefined,
  });
  const { data: scoringData, isLoading: isScoringLoading } = useGetMyScoringGamesQuery(undefined, {
    skip: activeTab !== 'scoringMatches',
    pollingInterval: activeTab === 'scoringMatches' ? 15000 : undefined,
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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight uppercase" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {activeTab === 'myTeams' ? 'My Teams' : activeTab === 'opponentTeams' ? 'Opponents' : 'My Matches'}
            </h2>

          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsStartScoringOpen(true)}
              className="flex items-center justify-center px-4 h-8 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black rounded-[8px] hover:scale-105 shadow-lg shadow-[#BFF367]/10 hover:shadow-[#BFF367]/15 transition-all duration-300 shrink-0"
              title="Start Scoring"
            >
              <span className="text-[9px] font-black uppercase tracking-widest">Start Scoring</span>
            </button>
            <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black rounded-[8px] shadow-lg shadow-[#BFF367]/10 hover:shadow-[#BFF367]/15 hover:scale-105 transition-all duration-300 shrink-0"
              title="Add New"
            >
              <Plus size={18} strokeWidth={3} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-45' : ''}`} />
            </button>
            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-[8px] shadow-2xl overflow-hidden z-50"
                  >
                    <div className="flex flex-col py-1">
                      <button 
                        onClick={() => { onCreateTeam(); setIsDropdownOpen(false); }}
                        className="px-4 py-2.5 text-left text-sm text-white/80 hover:text-white hover:bg-white/5 font-medium transition-colors"
                      >
                        <span className="text-[#BFF367] font-bold text-[10px] uppercase tracking-wider block mb-0.5">My Teams</span>
                        Create New Squad
                      </button>
                      <div className="h-px bg-white/5 w-full" />
                      <button 
                        onClick={() => { setIsAddOpponentOpen(true); setIsDropdownOpen(false); }}
                        className="px-4 py-2.5 text-left text-sm text-white/80 hover:text-white hover:bg-white/5 font-medium transition-colors"
                      >
                        <span className="text-[#BFF367] font-bold text-[10px] uppercase tracking-wider block mb-0.5">Opponents</span>
                        Add Rival Team
                      </button>
                      <div className="h-px bg-white/5 w-full" />
                      <button 
                        onClick={() => { setIsStartScoringOpen(true); setIsDropdownOpen(false); }}
                        className="px-4 py-2.5 text-left text-sm text-white/80 hover:text-white hover:bg-white/5 font-medium transition-colors"
                      >
                        <span className="text-white/60 font-bold text-[10px] uppercase tracking-wider block mb-0.5">Matches</span>
                        Start Scoring Match
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
            <input 
              type="text" 
              placeholder="Search..." 
              style={{ fontFamily: "'Inter', sans-serif" }}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[8px] py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#BFF367]/30 transition-colors uppercase font-bold tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/[0.03] rounded-[8px] border border-white/5">
          <button 
            onClick={() => setActiveTab('myTeams')}
            style={{ fontFamily: "'Inter', sans-serif" }}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-all ${ activeTab === 'myTeams' ? 'bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black shadow-lg shadow-[#BFF367]/10' : 'text-white/40 hover:text-white' }`}
          >
            My Teams
          </button>
          <button 
            onClick={() => setActiveTab('opponentTeams')}
            style={{ fontFamily: "'Inter', sans-serif" }}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-all ${ activeTab === 'opponentTeams' ? 'bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black shadow-lg shadow-[#BFF367]/10' : 'text-white/40 hover:text-white' }`}
          >
            Opponents
          </button>
          <button 
            onClick={() => setActiveTab('scoringMatches')}
            style={{ fontFamily: "'Inter', sans-serif" }}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-all ${ activeTab === 'scoringMatches' ? 'bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black shadow-lg shadow-[#BFF367]/10' : 'text-white/40 hover:text-white' }`}
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
              <div key={i} className="h-20 bg-white/[0.03] animate-pulse rounded-[8px]" />
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
              // Games created on Flutter (or any hosted-game without a scoring
              // session yet) come through with `cricketMatch === null`. We show
              // them with a "Setup & Score" CTA instead of "Launch App", since
              // a CricketMatch row needs to be created on first open.
              const hasScoringSession = !!item.cricketMatch;
              const effectiveStatus = hasScoringSession ? item.scoringStatus : 'NOT_STARTED';
              const statusStyle = statusColors[effectiveStatus] || statusColors['NOT_STARTED'];
              const statusLabel = hasScoringSession
                ? (effectiveStatus === 'NOT_STARTED' ? 'SETUP' : effectiveStatus)
                : 'NOT SET UP';
              if (isMatch) return (
                <div key={itemId} className="w-full flex flex-col p-3 rounded-[8px] bg-white/[0.02] border border-white/5 mb-2 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-[#BFF367] text-sm truncate flex-1 mr-2">{item.name || item.title || '(unnamed match)'}</h4>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusLabel}
                      </span>
                      {item.shortId && (
                        <span className="text-[10px] font-black text-black bg-[#BFF367] px-2 py-0.5 rounded uppercase">{item.shortId}</span>
                      )}
                    </div>
                  </div>
                  {(item.format || item.ballType || item.gameType) && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] text-white/30 uppercase font-bold">{item.format || item.gameType}</span>
                      {item.ballType && (<>
                        <span className="text-white/20">·</span>
                        <span className="text-[10px] text-white/30 uppercase font-bold">{item.ballType}</span>
                      </>)}
                    </div>
                  )}
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
                    {hasScoringSession ? (
                      <>
                        <a href={`/scoring/${item.id}`} className="flex-1 text-center text-[10px] uppercase font-black tracking-widest text-[#BFF367] border border-[#BFF367]/30 rounded-lg py-1.5 hover:bg-[#BFF367]/10 transition-colors">Launch App</a>
                        <a href={`/analytics/${item.shortId || item.id}`} target="_blank" rel="noreferrer" className="flex-1 text-center text-[10px] uppercase font-black tracking-widest text-[#BFF367] border border-[#BFF367]/30 rounded-lg py-1.5 hover:bg-[#BFF367]/10 transition-colors">Watch Live</a>
                      </>
                    ) : (
                      <a href={`/scoring/${item.id}`} className="flex-1 text-center text-[10px] uppercase font-black tracking-widest text-black bg-[#BFF367] rounded-lg py-1.5 hover:opacity-90 transition-opacity shadow-lg shadow-[#BFF367]/10">⚡ Start Scoring</a>
                    )}
                  </div>
                </div>
              );

            return (
              <motion.button
                key={itemId}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (activeTab === 'scoringMatches') {
                    navigate(`/scoring/${item.shortId || item._id || item.id}`);
                  } else {
                    onSelectTeam(item);
                  }
                }}
                style={{ fontFamily: "'Open Sans', sans-serif" }}
                className={`w-full flex items-center gap-3 p-3 rounded-[8px] transition-all group ${ isSelected ? 'bg-gradient-to-r from-[#BFF367]/5 to-[#BFF367]/5 border border-[#BFF367]/20 shadow-[0_0_15px_rgba(85,222,232,0.06)]' : 'hover:bg-white/[0.03] border border-transparent' }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-[8px] bg-black border-2 flex items-center justify-center text-[#BFF367] font-bold overflow-hidden transition-colors ${isSelected ? 'border-[#BFF367]' : 'border-white/10 group-hover:border-[#BFF367]/50'}`}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{item.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-black text-[#BFF367] text-[8px] px-1.5 py-0.5 rounded-full border border-white/10 font-black uppercase">
                    {item.sportType?.slice(0, 3)}
                  </div>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`font-black truncate transition-colors ${isSelected ? 'text-[#BFF367]' : 'text-white/80 group-hover:text-white'}`}>
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
                <ChevronRight size={14} className={`transition-all ${isSelected ? 'text-[#BFF367]' : 'text-white/20 -rotate-90 md:rotate-0'}`} />
              </motion.button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-[8px] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
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
