import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Shield, Video, Users, Trophy,
  Search, Check, MapPin, UserCheck, SkipForward, Loader2,
  Swords, Circle
} from 'lucide-react';
import { useSetupScoringMatchMutation } from '@redux/api/scoringApi';
import {
  useGetMyTeamsQuery,
  useGetOpponentTeamsQuery,
  useLazyFindTeamByCodeQuery,
  useGetTeamByIdQuery,
  useLazySearchPlayersQuery,
} from '@redux/api/teamApi';
import { useGetGroundsQuery, useGetUmpiresQuery } from '@redux/api/gamesApi';
import toast from 'react-hot-toast';

// ─── Static Data ─────────────────────────────────────────────────────────────

const CRICKET_FORMATS = [
  { value: 'T20',         label: 'T20',           sub: '20 Overs' },
  { value: 'T10',         label: 'T10',           sub: '10 Overs' },
  { value: 'ODI',         label: 'ODI',           sub: '50 Overs' },
  { value: 'THE_HUNDRED', label: 'The Hundred',  sub: '100 Balls' },
  { value: 'TEST',        label: 'Test Match',   sub: '5 Days' },
  { value: '5_DAY',       label: '5 Day Match',  sub: '90 Overs/day' },
  { value: '90_OVERS',    label: '90 Overs',     sub: '1 Day' },
  { value: '1_WEEK',      label: 'One Week',     sub: 'Multi-day' },
  { value: 'CUSTOM',      label: 'Custom',       sub: 'Set your own overs' },
];

const BALL_TYPES = [
  { value: 'TENNIS',  label: 'Tennis Ball',  emoji: '🎾' },
  { value: 'LEATHER', label: 'Leather Ball', emoji: '🏏' },
  { value: 'WHITE',   label: 'White Ball',   emoji: '⚪' },
  { value: 'PINK',    label: 'Pink Ball',    emoji: '🔴' },
  { value: 'RUBBER',  label: 'Rubber Ball',  emoji: '⚫' },
];

const GROUND_TYPES = [
  { value: 'OUTDOOR',  label: 'Outdoor Ground', emoji: '🌳' },
  { value: 'INDOOR',   label: 'Indoor Ground',  emoji: '🏟️' },
  { value: 'DAY',      label: 'Day Match',      emoji: '☀️' },
  { value: 'NIGHT',    label: 'Night Match',    emoji: '🌙' },
  { value: 'D_N',      label: 'Day/Night',      emoji: '🌅' },
  { value: 'TURF',     label: 'Artificial Turf',emoji: '🟩' },
];

const STEPS = [
  { id: 1, label: 'Match Setup' },
  { id: 2, label: 'Select Teams' },
  { id: 3, label: 'Team A XI' },
  { id: 4, label: 'Team B XI' },
  { id: 5, label: 'Add-ons' },
  { id: 6, label: 'Toss' },
  { id: 7, label: 'Review & Confirm' },
];

// ─── Field/Select components ─────────────────────────────────────────────────

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#55DEE8]/50 outline-none transition-colors placeholder:text-white/30';
const labelClass = 'text-xs text-white/50 mb-1 block font-medium uppercase tracking-wider';
const selectClass =
  'w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-white outline-none transition-colors focus:border-[#55DEE8]/50';

// ─── Main Component ──────────────────────────────────────────────────────────

const StartScoringModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    matchName: '',
    sportType: 'CRICKET',
    format: 'T20',
    ballType: 'TENNIS',
    groundType: 'OUTDOOR',
    maxMembers: 11,
    teamAId: '',
    teamBId: '',
    teamAPlayers: [],
    teamBPlayers: [],
    venueId: null,
    professionals: [],
    tossWinner: '',
    tossDecision: 'BAT',
    scoringPassword: '',
    youtubeLiveUrl: '',
  });

  // Team selector popup state
  const [selectingTeam, setSelectingTeam] = useState(null); // 'A' | 'B'
  const [teamTab, setTeamTab] = useState('myTeams');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Player selection popup state
  const [playerPopup, setPlayerPopup] = useState(null); // { teamKey: 'A' | 'B', action: 'ADD' | 'REPLACE', replaceId: null }
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [addonsTab, setAddonsTab] = useState('VENUE');

  // Toss animation state
  const [isTossFlipping, setIsTossFlipping] = useState(false);
  const [tossFlipDeg, setTossFlipDeg] = useState(0);

  const [setupMatch, { isLoading }] = useSetupScoringMatchMutation();
  const { data: myTeamsData } = useGetMyTeamsQuery(undefined, { skip: !isOpen });
  const { data: oppTeamsData } = useGetOpponentTeamsQuery(undefined, { skip: !isOpen });
  const [findTeamByCode, { data: searchedTeamData, isFetching: isSearching }] = useLazyFindTeamByCodeQuery();

  // Load team details when teams are selected (for player list)
  const { data: teamADetails } = useGetTeamByIdQuery(formData.teamAId, { skip: !formData.teamAId });
  const { data: teamBDetails } = useGetTeamByIdQuery(formData.teamBId, { skip: !formData.teamBId });

  // Addons queries
  const { data: groundsData, isLoading: isLoadingGrounds } = useGetGroundsQuery({}, { skip: step !== 5 });
  const { data: umpiresData, isLoading: isLoadingUmpires } = useGetUmpiresQuery({ gameType: formData.sportType }, { skip: step !== 5 });
  
  const [searchPlayers, { data: searchPlayersData, isFetching: isSearchingPlayers }] = useLazySearchPlayersQuery();

  const myTeams = myTeamsData?.teams || [];
  const oppTeams = oppTeamsData?.teams || [];
  const allTeams = [...myTeams, ...oppTeams];

  const selectedTeamA = allTeams.find(t => t._id === formData.teamAId || t.id === formData.teamAId);
  const selectedTeamB = allTeams.find(t => t._id === formData.teamBId || t.id === formData.teamBId);

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleClose = () => {
    setStep(1);
    setSelectingTeam(null);
    onClose();
  };

  // ─── Team selection ──────────────────────────────────────────────────────────
  const handleTeamSearch = async () => {
    if (teamSearchQuery.trim()) await findTeamByCode(teamSearchQuery.trim());
  };

  const selectTeam = (teamId) => {
    const key = selectingTeam === 'A' ? 'teamAId' : 'teamBId';
    const playerKey = selectingTeam === 'A' ? 'teamAPlayers' : 'teamBPlayers';
    setFormData(f => ({ ...f, [key]: teamId, [playerKey]: [] }));
    setSelectingTeam(null);
    setTeamSearchQuery('');
  };

  const getTeamName = (id) => {
    const t = allTeams.find(t => (t._id || t.id) === id);
    return t?.name || (searchedTeamData?.team && (searchedTeamData.team._id || searchedTeamData.team.id) === id ? searchedTeamData.team.name : 'Team Selected');
  };

  // ─── Playing XI ─────────────────────────────────────────────────────────────
  const initPlayersFromTeam = (teamKey) => {
    const details = teamKey === 'A' ? teamADetails : teamBDetails;
    if (!details?.team) return;
    const members = (details.team.members || []).map(m => ({
      id: m.user?.id || m.userId,
      name: m.user?.name || 'Player',
      profilePicture: m.user?.profilePicture || null,
      role: m.role || 'PLAYER',
    })).slice(0, formData.maxMembers);
    const playerKey = teamKey === 'A' ? 'teamAPlayers' : 'teamBPlayers';
    setFormData(f => ({ ...f, [playerKey]: members }));
  };

  const removePlayer = (teamKey, playerId) => {
    const playerKey = teamKey === 'A' ? 'teamAPlayers' : 'teamBPlayers';
    setFormData(f => ({ ...f, [playerKey]: f[playerKey].filter(p => p.id !== playerId) }));
  };

  const handlePlayerSearch = async () => {
    if (playerSearchQuery.trim()) await searchPlayers(playerSearchQuery.trim());
  };

  const selectPlayer = (player) => {
    if (!playerPopup) return;
    const { teamKey, action, replaceId } = playerPopup;
    const playerKey = teamKey === 'A' ? 'teamAPlayers' : 'teamBPlayers';
    
    setFormData(f => {
      let newList = [...f[playerKey]];
      const newPlayer = {
        id: player.id || player._id || Math.random().toString(36).substr(2, 9),
        name: player.name || player.username || customPlayerName,
        profilePicture: player.profilePicture || null,
        role: player.role || 'PLAYER',
        isCustom: !(player.id || player._id),
      };
      
      if (action === 'REPLACE' && replaceId) {
        newList = newList.map(p => p.id === replaceId ? newPlayer : p);
      } else {
        // ADD
        if (newList.length < formData.maxMembers) {
          if (!newList.find(p => p.id === newPlayer.id)) {
            newList.push(newPlayer);
          } else {
            toast.error("Player already in Playing XI");
            return f;
          }
        } else {
          toast.error("Maximum players reached for this format");
          return f;
        }
      }
      return { ...f, [playerKey]: newList };
    });
    setPlayerPopup(null);
    setPlayerSearchQuery('');
    setCustomPlayerName('');
  };

  // ─── Toss ────────────────────────────────────────────────────────────────────
  const doToss = () => {
    if (isTossFlipping) return;
    setIsTossFlipping(true);
    let deg = 0;
    const interval = setInterval(() => {
      deg += 40;
      setTossFlipDeg(deg);
      if (deg >= 720) {
        clearInterval(interval);
        setIsTossFlipping(false);
        const winner = Math.random() > 0.5 ? formData.teamAId : formData.teamBId;
        setFormData(f => ({ ...f, tossWinner: winner }));
      }
    }, 60);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        teamAData: { name: getTeamName(formData.teamAId) },
        teamBData: { name: getTeamName(formData.teamBId) },
      };
      await setupMatch(payload).unwrap();
      toast.success('Scoring match created!');
      // Invoke onSuccess before closing to ensure tab switch occurs while modal is still mounted
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create match');
    }
  };

  // ─── Step Validation ─────────────────────────────────────────────────────────
  const canGoNext = () => {
    switch (step) {
      case 1: return formData.matchName.trim().length > 0;
      case 2: return !!formData.teamAId && !!formData.teamBId && formData.teamAId !== formData.teamBId;
      case 3: return formData.teamAPlayers.length > 0;
      case 4: return formData.teamBPlayers.length > 0;
      case 6: return !!formData.tossWinner;
      // Password is optional: blank (no password) or minimum 4 characters
      case 7: return formData.scoringPassword.trim() === '' || formData.scoringPassword.length >= 4;
      default: return true;
    }
  };

  if (!isOpen) return null;

  // ─── Team Selection Popup ────────────────────────────────────────────────────
  if (selectingTeam) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectingTeam(null)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-[20px] shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              Select Team {selectingTeam}
            </h3>
            <button onClick={() => setSelectingTeam(null)} className="p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/5">
              {['myTeams', 'opponentTeams'].map(tab => (
                <button key={tab} onClick={() => setTeamTab(tab)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${teamTab === tab ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  {tab === 'myTeams' ? 'My Teams' : 'Opponents'}
                </button>
              ))}
            </div>
            {/* Opponent search */}
            {teamTab === 'opponentTeams' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={e => setTeamSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTeamSearch()}
                  placeholder="Search by Team Code..."
                  className={inputClass}
                />
                <button onClick={handleTeamSearch} disabled={isSearching}
                  className="px-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white">
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            )}
            {/* Team list */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {teamTab === 'myTeams' && myTeams.map(t => {
                const tid = t._id || t.id;
                const isSelected = formData.teamAId === tid || formData.teamBId === tid;
                return (
                  <button key={tid} onClick={() => selectTeam(tid)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left">
                    <div className="flex items-center gap-3">
                      {t.logo ? <img src={t.logo} className="w-8 h-8 rounded-lg object-cover" alt={t.name} /> : <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40"><Users size={14} /></div>}
                      <span className="font-bold text-white text-sm">{t.name}</span>
                    </div>
                    {isSelected && <Check size={16} className="text-[#BFF367]" />}
                  </button>
                );
              })}
              {teamTab === 'opponentTeams' && (
                <>
                  {!searchedTeamData && oppTeams.map(t => {
                    const tid = t._id || t.id;
                    const isSelected = formData.teamAId === tid || formData.teamBId === tid;
                    return (
                      <button key={tid} onClick={() => selectTeam(tid)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left">
                        <div className="flex items-center gap-3">
                          {t.logo ? <img src={t.logo} className="w-8 h-8 rounded-lg object-cover" alt={t.name} /> : <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40"><Swords size={14} /></div>}
                          <div>
                            <div className="font-bold text-white text-sm">{t.name}</div>
                            <div className="text-[10px] text-white/40">{t.teamCode}</div>
                          </div>
                        </div>
                        {isSelected && <Check size={16} className="text-[#BFF367]" />}
                      </button>
                    );
                  })}
                  {searchedTeamData?.team && (
                    <button onClick={() => selectTeam(searchedTeamData.team._id || searchedTeamData.team.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 border border-[#55DEE8]/30 hover:border-[#55DEE8] transition-all text-left mt-2">
                      <div>
                        <div className="font-bold text-white text-sm">{searchedTeamData.team.name}</div>
                        <div className="text-[10px] text-[#55DEE8]">Search Result · {searchedTeamData.team.teamCode}</div>
                      </div>
                      <Check size={14} className="text-[#55DEE8]" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Player Selection Popup ──────────────────────────────────────────────────
  if (playerPopup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPlayerPopup(null)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              {playerPopup.action === 'REPLACE' ? 'Replace Player' : 'Add Player'}
            </h3>
            <button onClick={() => setPlayerPopup(null)} className="p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={playerSearchQuery}
                onChange={e => setPlayerSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePlayerSearch()}
                placeholder="Search by username or name..."
                className={inputClass}
              />
              <button onClick={handlePlayerSearch} disabled={isSearchingPlayers}
                className="px-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white flex-shrink-0">
                {isSearchingPlayers ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
            
            <div className="space-y-1.5 pr-1">
              {searchPlayersData?.players?.map(p => (
                <button key={p._id} onClick={() => selectPlayer(p)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left">
                  <div className="flex items-center gap-3">
                    {p.profilePicture ? <img src={p.profilePicture} className="w-8 h-8 rounded-full object-cover" alt={p.username} /> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40"><Users size={14} /></div>}
                    <div>
                      <div className="font-bold text-white text-sm">{p.username}</div>
                      <div className="text-[10px] text-white/40">{p.name}</div>
                    </div>
                  </div>
                  <Check size={16} className="text-[#BFF367]" opacity={0} />
                </button>
              ))}
              
              {!isSearchingPlayers && playerSearchQuery && (!searchPlayersData?.players?.length) && (
                <div className="text-center py-4 text-white/40 text-sm">No players found.</div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <label className={labelClass}>Or Add Custom Player</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPlayerName}
                  onChange={e => setCustomPlayerName(e.target.value)}
                  placeholder="Enter player name..."
                  className={inputClass}
                />
                <button onClick={() => selectPlayer({ name: customPlayerName })} disabled={!customPlayerName.trim()}
                  className="px-4 bg-[#BFF367] text-black font-bold rounded-xl transition-colors disabled:opacity-50">
                  Add
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Steps renderer ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Step 1: Match Setup ───────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Match Name</label>
              <input type="text" value={formData.matchName}
                onChange={e => setFormData(f => ({ ...f, matchName: e.target.value }))}
                className={inputClass} placeholder="e.g. Weekend Championship Final" />
            </div>
            <div>
              <label className={labelClass}>Sport Type</label>
              <select value={formData.sportType}
                onChange={e => setFormData(f => ({ ...f, sportType: e.target.value }))}
                className={selectClass}>
                <option value="CRICKET">🏏 Cricket</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Match Format</label>
              <div className="grid grid-cols-3 gap-2">
                {CRICKET_FORMATS.map(f => (
                  <button key={f.value} type="button"
                    onClick={() => setFormData(fd => ({ ...fd, format: f.value }))}
                    className={`p-2.5 rounded-xl border text-left transition-all ${formData.format === f.value ? 'border-[#55DEE8] bg-[#55DEE8]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                    <div className="text-white text-xs font-bold">{f.label}</div>
                    <div className="text-white/40 text-[10px]">{f.sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Ball Type</label>
                <div className="space-y-1.5">
                  {BALL_TYPES.map(b => (
                    <button key={b.value} type="button"
                      onClick={() => setFormData(f => ({ ...f, ballType: b.value }))}
                      className={`w-full flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${formData.ballType === b.value ? 'border-[#55DEE8] bg-[#55DEE8]/10 text-white' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'}`}>
                      <span>{b.emoji}</span> {b.label}
                      {formData.ballType === b.value && <Check size={12} className="ml-auto text-[#55DEE8]" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Ground Type</label>
                <div className="space-y-1.5">
                  {GROUND_TYPES.map(g => (
                    <button key={g.value} type="button"
                      onClick={() => setFormData(f => ({ ...f, groundType: g.value }))}
                      className={`w-full flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${formData.groundType === g.value ? 'border-[#BFF367] bg-[#BFF367]/10 text-white' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'}`}>
                      <span>{g.emoji}</span> {g.label}
                      {formData.groundType === g.value && <Check size={12} className="ml-auto text-[#BFF367]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Max Members per Team</label>
              <div className="flex gap-2 items-center">
                {[5, 6, 7, 8, 9, 10, 11, 12, 15].map(n => (
                  <button key={n} type="button"
                    onClick={() => setFormData(f => ({ ...f, maxMembers: n }))}
                    className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all ${formData.maxMembers === n ? 'border-[#55DEE8] bg-[#55DEE8] text-black' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Step 2: Select Teams ──────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wide">Select Competing Teams</h3>
            {[{ key: 'A', label: 'Team A', color: '#55DEE8' }, { key: 'B', label: 'Team B', color: '#BFF367' }].map(({ key, label, color }) => {
              const id = key === 'A' ? formData.teamAId : formData.teamBId;
              const name = id ? getTeamName(id) : null;
              const team = allTeams.find(t => (t._id || t.id) === id);
              return (
                <button key={key} onClick={() => setSelectingTeam(key)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    {team?.logo ? <img src={team.logo} className="w-10 h-10 rounded-xl object-cover" alt="" /> : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                        <Users size={18} style={{ color }} />
                      </div>
                    )}
                    <div className="text-left">
                      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</div>
                      <div className="text-white font-bold text-sm">{name || `Select ${label}`}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/30" />
                </button>
              );
            })}
            {formData.teamAId && formData.teamBId && formData.teamAId === formData.teamBId && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3">
                Team A and Team B cannot be the same team.
              </p>
            )}
          </div>
        );

      // ── Step 3: Team A Playing XI ─────────────────────────────────────────────
      case 3:
        return (
          <PlayingXIStep
            teamKey="A"
            teamName={getTeamName(formData.teamAId)}
            players={formData.teamAPlayers}
            maxMembers={formData.maxMembers}
            teamDetails={teamADetails?.team}
            onInit={() => initPlayersFromTeam('A')}
            onRemove={(id) => removePlayer('A', id)}
            onAdd={() => setPlayerPopup({ teamKey: 'A', action: 'ADD', replaceId: null })}
            onReplace={(id) => setPlayerPopup({ teamKey: 'A', action: 'REPLACE', replaceId: id })}
          />
        );

      // ── Step 4: Team B Playing XI ─────────────────────────────────────────────
      case 4:
        return (
          <PlayingXIStep
            teamKey="B"
            teamName={getTeamName(formData.teamBId)}
            players={formData.teamBPlayers}
            maxMembers={formData.maxMembers}
            teamDetails={teamBDetails?.team}
            onInit={() => initPlayersFromTeam('B')}
            onRemove={(id) => removePlayer('B', id)}
            onAdd={() => setPlayerPopup({ teamKey: 'B', action: 'ADD', replaceId: null })}
            onReplace={(id) => setPlayerPopup({ teamKey: 'B', action: 'REPLACE', replaceId: id })}
          />
        );

      // ── Step 5: Add-ons (Venue + Professionals) ───────────────────────────────
      case 5:
        return (
          <div className="space-y-5 h-full flex flex-col">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide">Add-ons</h3>
              <p className="text-sm text-white/40">Optionally hire a venue or professionals. You can skip this step.</p>
            </div>
            
            <div className="flex gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/5 flex-shrink-0">
              <button onClick={() => setAddonsTab('VENUE')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${addonsTab === 'VENUE' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>
                Venue
              </button>
              <button onClick={() => setAddonsTab('PROFESSIONALS')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${addonsTab === 'PROFESSIONALS' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>
                Professionals
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {addonsTab === 'VENUE' && (
                <div className="space-y-2 pr-1">
                  {isLoadingGrounds ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white/40" /></div>
                  ) : groundsData?.turfs?.length > 0 ? (
                    groundsData.turfs.map(g => (
                      <button key={g._id} onClick={() => setFormData(f => ({ ...f, venueId: f.venueId === g._id ? null : g._id }))}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${formData.venueId === g._id ? 'bg-[#55DEE8]/10 border-[#55DEE8]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                        <div className="flex items-center gap-3">
                          <MapPin size={18} className={formData.venueId === g._id ? 'text-[#55DEE8]' : 'text-white/40'} />
                          <div>
                            <div className="font-bold text-white text-sm">{g.name}</div>
                            <div className="text-[10px] text-white/40">{g.city} • ₹{g.hourlyRate}/hr</div>
                          </div>
                        </div>
                        {formData.venueId === g._id && <Check size={16} className="text-[#55DEE8]" />}
                      </button>
                    ))
                  ) : (
                    <div className="text-center p-4 text-sm text-white/40">No venues available for your area.</div>
                  )}
                </div>
              )}
              {addonsTab === 'PROFESSIONALS' && (
                <div className="space-y-2 pr-1">
                  {isLoadingUmpires ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white/40" /></div>
                  ) : umpiresData?.umpires?.length > 0 ? (
                    umpiresData.umpires.map(u => {
                      const isSelected = formData.professionals.includes(u._id);
                      return (
                        <button key={u._id} onClick={() => setFormData(f => ({ ...f, professionals: isSelected ? f.professionals.filter(id => id !== u._id) : [...f.professionals, u._id] }))}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-[#BFF367]/10 border-[#BFF367]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                          <div className="flex items-center gap-3">
                            {u.user?.profilePicture ? <img src={u.user.profilePicture} className="w-8 h-8 rounded-full object-cover" alt={u.user.name} /> : <UserCheck size={18} className={isSelected ? 'text-[#BFF367]' : 'text-white/40'} />}
                            <div>
                              <div className="font-bold text-white text-sm">{u.user?.name || 'Professional'}</div>
                              <div className="text-[10px] text-white/40">Umpire/Scorer • ₹{u.matchFee || 500}/match</div>
                            </div>
                          </div>
                          {isSelected && <Check size={16} className="text-[#BFF367]" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center p-4 text-sm text-white/40">No professionals available for your area.</div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 flex-shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Total Estimated Add-ons Cost</span>
                <span className="text-white font-bold">₹{
                  (formData.venueId ? (groundsData?.turfs?.find(g => g._id === formData.venueId)?.hourlyRate || 0) : 0) + 
                  (formData.professionals.reduce((sum, id) => sum + (umpiresData?.umpires?.find(u => u._id === id)?.matchFee || 500), 0))
                }</span>
              </div>
            </div>
          </div>
        );

      // ── Step 6: Toss ──────────────────────────────────────────────────────────
      case 6: {
        const teamAName = getTeamName(formData.teamAId);
        const teamBName = getTeamName(formData.teamBId);
        const winnerName = formData.tossWinner === formData.teamAId ? teamAName : formData.tossWinner === formData.teamBId ? teamBName : null;
        return (
          <div className="space-y-6 text-center">
            <h3 className="text-lg font-black text-white uppercase tracking-wide">Toss</h3>
            {/* Coin */}
            <div className="flex justify-center">
              <div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-[#55DEE8] to-[#BFF367] flex items-center justify-center shadow-2xl cursor-pointer select-none"
                style={{ transform: `rotateY(${tossFlipDeg}deg)`, transition: isTossFlipping ? 'transform 0.06s linear' : 'none' }}
                onClick={!isTossFlipping && !formData.tossWinner ? doToss : undefined}
              >
                <span className="text-3xl">{isTossFlipping ? '🪙' : formData.tossWinner ? '👑' : '🪙'}</span>
              </div>
            </div>
            {!formData.tossWinner && !isTossFlipping && (
              <button onClick={doToss}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black uppercase tracking-wider text-sm">
                Flip Coin
              </button>
            )}
            {isTossFlipping && <p className="text-white/50 text-sm">Flipping...</p>}
            {formData.tossWinner && !isTossFlipping && (
              <div className="space-y-4">
                <div className="text-[#BFF367] font-black text-xl">🏆 {winnerName} won the toss!</div>
                <div>
                  <label className={labelClass}>Choose to</label>
                  <div className="flex gap-3">
                    {['BAT', 'BOWL'].map(d => (
                      <button key={d} type="button"
                        onClick={() => setFormData(f => ({ ...f, tossDecision: d }))}
                        className={`flex-1 py-3 rounded-xl border font-black text-sm uppercase tracking-widest transition-all ${formData.tossDecision === d ? 'bg-[#55DEE8] text-black border-[#55DEE8]' : 'border-white/20 text-white hover:bg-white/5'}`}>
                        {d === 'BAT' ? '🏏 Bat' : '🎯 Bowl'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-white/40 text-xs">Or override winner manually:</p>
                <div className="flex gap-2">
                  {[{ id: formData.teamAId, name: teamAName }, { id: formData.teamBId, name: teamBName }].map(({ id, name }) => (
                    <button key={id} type="button"
                      onClick={() => setFormData(f => ({ ...f, tossWinner: id }))}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${formData.tossWinner === id ? 'border-[#BFF367] bg-[#BFF367]/10 text-[#BFF367]' : 'border-white/10 text-white/50 hover:text-white'}`}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      // ── Step 7: Final Review + Confirm ────────────────────────────────────────
      case 7: {
        const teamAName = getTeamName(formData.teamAId);
        const teamBName = getTeamName(formData.teamBId);
        const winnerName = formData.tossWinner === formData.teamAId ? teamAName : teamBName;
        const formatLabel = CRICKET_FORMATS.find(f => f.value === formData.format)?.label || formData.format;
        const ballLabel = BALL_TYPES.find(b => b.value === formData.ballType)?.label || formData.ballType;
        const groundLabel = GROUND_TYPES.find(g => g.value === formData.groundType)?.label || formData.groundType;
        return (
          <div className="space-y-5">
            {/* Match Summary */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-black text-lg truncate">{formData.matchName}</span>
                <span className="text-xs px-2 py-1 rounded-lg bg-[#55DEE8]/10 text-[#55DEE8] border border-[#55DEE8]/20 font-bold">{formatLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 font-bold">
                <span className="truncate">{teamAName}</span>
                <span className="text-white/30 text-xs">vs</span>
                <span className="truncate">{teamBName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded-xl p-2">
                  <div className="text-[10px] text-white/40 uppercase">Ball</div>
                  <div className="text-white text-xs font-bold">{ballLabel}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <div className="text-[10px] text-white/40 uppercase">Ground</div>
                  <div className="text-white text-xs font-bold">{groundLabel}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <div className="text-[10px] text-white/40 uppercase">Players</div>
                  <div className="text-white text-xs font-bold">{formData.maxMembers} per side</div>
                </div>
              </div>
              {formData.tossWinner && (
                <div className="text-xs text-[#BFF367] bg-[#BFF367]/10 border border-[#BFF367]/20 rounded-xl px-3 py-2">
                  🏆 {winnerName} won toss · Chose to {formData.tossDecision}
                </div>
              )}
              <div className="text-xs text-white/40">
                Team A: {formData.teamAPlayers.length} players · Team B: {formData.teamBPlayers.length} players
              </div>
            </div>
            {/* Security */}
            <div>
              <label className={labelClass}><Shield size={12} className="inline mr-1" />Scoring App Password <span className="text-white/30">(Optional)</span></label>
              <input type="password" value={formData.scoringPassword}
                onChange={e => setFormData(f => ({ ...f, scoringPassword: e.target.value }))}
                className={inputClass} placeholder="Leave blank for open access, or set min 4 chars" />
              <p className="text-[10px] text-white/30 mt-1">If set, anyone opening the scoring terminal will need this password to start scoring.</p>
            </div>
            {/* YouTube Live URL */}
            <div>
              <label className={labelClass}><Video size={12} className="inline mr-1" />YouTube Live URL <span className="text-white/30">(Optional)</span></label>
              <input type="url" value={formData.youtubeLiveUrl}
                onChange={e => setFormData(f => ({ ...f, youtubeLiveUrl: e.target.value }))}
                className={inputClass} placeholder="https://youtube.com/live/..." />
              <p className="text-[10px] text-white/30 mt-1">Provide this after going live on YouTube. Viewers on the Watch Live page will see the stream.</p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ─── Main Modal ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Start Scoring Match</h2>
            <p className="text-xs text-white/40 mt-0.5">{STEPS[step - 1].label}</p>
          </div>
          <button onClick={handleClose} className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 py-3 border-b border-white/5 flex-shrink-0">
          {STEPS.map(s => (
            <div key={s.id} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step > s.id ? 'bg-[#BFF367]' : step === s.id ? 'bg-[#55DEE8]' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="flex gap-3 p-5 border-t border-white/10 bg-white/[0.01] flex-shrink-0">
          {step > 1 && (
            <button onClick={handlePrev}
              className="px-5 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all flex items-center gap-2 text-sm uppercase tracking-wider">
              <ChevronLeft size={14} /> Back
            </button>
          )}
          {step === 5 && (
            <button onClick={handleNext}
              className="px-5 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white font-bold hover:bg-white/5 transition-all flex items-center gap-2 text-sm uppercase tracking-wider">
              <SkipForward size={14} /> Skip
            </button>
          )}
          {step < STEPS.length ? (
            <button onClick={handleNext} disabled={!canGoNext()}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-wider disabled:opacity-40 disabled:cursor-not-allowed">
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isLoading || !canGoNext()}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-wider disabled:opacity-40 disabled:cursor-not-allowed">
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Trophy size={16} /> Create Match</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Playing XI Sub-component ─────────────────────────────────────────────────

// ─── Playing XI Sub-component ─────────────────────────────────────────────────

const PlayingXIStep = ({ teamKey, teamName, players, maxMembers, teamDetails, onInit, onRemove, onAdd, onReplace }) => {
  const color = teamKey === 'A' ? '#55DEE8' : '#BFF367';
  const hasAutoLoaded = players.length > 0;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wide">Team {teamKey} Playing XI</h3>
          <p className="text-xs text-white/40">{teamName}</p>
        </div>
        <span className="text-sm font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10" style={{ color }}>
          {players.length}/{maxMembers}
        </span>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {!hasAutoLoaded && teamDetails?.members?.length > 0 && (
          <button onClick={onInit}
            className="flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            style={{ borderColor: `${color}40`, color, background: `${color}10` }}>
            <Users size={14} /> Auto-load Roster
          </button>
        )}
        <button onClick={onAdd} disabled={players.length >= maxMembers}
          className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
          + Add Player
        </button>
      </div>

      {players.length === 0 && (
        <div className="text-center py-8 text-white/30 text-sm bg-white/5 rounded-xl border border-white/5 border-dashed flex-shrink-0">
          No players added yet.<br />Auto-load from roster or add manually.
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {players.map((p, idx) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 group hover:border-white/20 transition-all">
            <span className="text-white/30 text-xs w-5 text-right font-mono">{idx + 1}</span>
            {p.profilePicture
              ? <img src={p.profilePicture} className="w-8 h-8 rounded-full object-cover border border-white/10" alt={p.name} />
              : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold border border-white/10">{p.name?.[0]?.toUpperCase()}</div>
            }
            <span className="text-white text-sm font-medium flex-1 truncate">{p.name}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onReplace(p.id)} className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded text-[10px] uppercase font-bold tracking-wider transition-colors">
                Replace
              </button>
              <button onClick={() => onRemove(p.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {players.length > 0 && players.length < maxMembers && (
        <p className="text-[10px] uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8]/80 to-[#BFF367]/80 bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 border border-[#55DEE8]/20 rounded-xl p-3 flex-shrink-0 text-center font-bold">
          Needs {maxMembers - players.length} more player(s) for a full XI
        </p>
      )}
    </div>
  );
};

export default StartScoringModal;
