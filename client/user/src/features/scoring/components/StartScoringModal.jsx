import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Shield, Video, Users, Trophy,
  Search, Check, MapPin, UserCheck, SkipForward, Loader2,
  Swords, Circle, Phone, MessageCircle, Sparkles, UserPlus, Plus
} from 'lucide-react';
import { useSetupScoringMatchMutation } from '@redux/api/scoringApi';
import {
  useGetMyTeamsQuery,
  useGetOpponentTeamsQuery,
  useLazyFindTeamByCodeQuery,
  useGetTeamByIdQuery,
  useLazySearchPlayersQuery,
  useInviteMemberMutation,
  useAddCustomMemberMutation,
} from '@redux/api/teamApi';
import { useGetGroundsQuery, useGetUmpiresQuery } from '@redux/api/gamesApi';
import toast from 'react-hot-toast';
import { fetchStates, fetchCities, searchLocations } from '../../../shared/utils/locationService';

// ─── Static Data ─────────────────────────────────────────────────────────────

const CRICKET_FORMATS = [
  { value: 'T20', label: 'T20', sub: '20 Overs' },
  { value: 'T10', label: 'T10', sub: '10 Overs' },
  { value: 'ODI', label: 'ODI', sub: '50 Overs' },
  { value: 'THE_HUNDRED', label: 'The Hundred', sub: '100 Balls' },
  { value: 'TEST', label: 'Test Match', sub: '5 Days' },
  { value: '5_DAY', label: '5 Day Match', sub: '90 Overs/day' },
  { value: '90_OVERS', label: '90 Overs', sub: '1 Day' },
  { value: '1_WEEK', label: 'One Week', sub: 'Multi-day' },
  { value: 'CUSTOM', label: 'Custom', sub: 'Set your own overs' },
];

const BALL_TYPES = [
  { value: 'TENNIS', label: 'Tennis Ball', emoji: '🎾' },
  { value: 'LEATHER', label: 'Leather Ball', emoji: '🏏' },
  { value: 'WHITE', label: 'White Ball', emoji: '⚪' },
  { value: 'PINK', label: 'Pink Ball', emoji: '🔴' },
  { value: 'RUBBER', label: 'Rubber Ball', emoji: '⚫' },
];

const GROUND_TYPES = [
  { value: 'OUTDOOR', label: 'Outdoor Ground', emoji: '🌳' },
  { value: 'INDOOR', label: 'Indoor Ground', emoji: '🏟️' },
  { value: 'TURF', label: 'Artificial Turf', emoji: '🟩' },
];

const MATCH_TIMINGS = [
  { value: 'DAY', label: 'Day Match', emoji: '☀️' },
  { value: 'NIGHT', label: 'Night Match', emoji: '🌙' },
  { value: 'D_N', label: 'Day/Night', emoji: '🌅' },
];

const PITCH_TYPES = [
  { value: 'ROUGH', label: 'Rough' },
  { value: 'CEMENT', label: 'Cement' },
  { value: 'TURF', label: 'Turf' },
  { value: 'ASTRO_TURF', label: 'Astro Turf' },
  { value: 'MATTING', label: 'Matting' },
];

const STEPS = [
  { id: 1, label: 'Match Setup' },
  { id: 2, label: 'Select Teams' },
  { id: 3, label: 'Playing XIs' },
  { id: 4, label: 'Add-ons' },
  { id: 5, label: 'Review & Confirm' },
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
    customVenue: '',
    professionals: [],
    customProfessionals: [],
    tossWinner: '',
    tossDecision: 'BAT',
    scoringPassword: '',
    youtubeLiveUrl: '',
    customDays: 1,
    customOversPerDay: 20,
    powerPlayOvers: 6,
    location: '',
    matchDateTime: '',
    pitchType: 'TURF',
    matchTiming: 'DAY',
  });

  // Team selector popup state
  const [selectingTeam, setSelectingTeam] = useState(null); // 'A' | 'B'
  const [teamTab, setTeamTab] = useState('myTeams');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Player selection popup state
  const [playerPopup, setPlayerPopup] = useState(null); // { teamKey: 'A' | 'B', action: 'ADD' | 'REPLACE', replaceId: null }
  const [activePlayerTab, setActivePlayerTab] = useState('search'); // 'search' or 'custom'
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [customPlayerPhone, setCustomPlayerPhone] = useState('');
  const [customPlayerCountryCode, setCustomPlayerCountryCode] = useState('91');
  const [customInviteData, setCustomInviteData] = useState(null);

  const [xiTab, setXiTab] = useState('A');
  const [addonsTab, setAddonsTab] = useState('VENUE');

  // Venue & Professional Filters
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [proSearchQuery, setProSearchQuery] = useState('');
  const [venueStateFilter, setVenueStateFilter] = useState('');
  const [venueCityFilter, setVenueCityFilter] = useState('');
  const [proRoleFilter, setProRoleFilter] = useState('');
  const [proStateFilter, setProStateFilter] = useState('');
  const [proCityFilter, setProCityFilter] = useState('');
  const [proCities, setProCities] = useState([]);

  const handleProStateChange = async (stateVal) => {
    setProStateFilter(stateVal);
    setProCityFilter('');
    if (stateVal) {
      const c = await fetchCities(stateVal);
      setProCities(c);
    } else {
      setProCities([]);
    }
  };

  // Custom Venue & Pro
  const [customVenueInput, setCustomVenueInput] = useState('');
  const [customProfessionalName, setCustomProfessionalName] = useState('');
  const [customProfessionalPhone, setCustomProfessionalPhone] = useState('');
  const [customProfessionalRole, setCustomProfessionalRole] = useState('UMPIRE');
  const [showCustomProInvite, setShowCustomProInvite] = useState(false);
  const [customProInviteData, setCustomProInviteData] = useState(null);

  // Location state
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      if (locationInput.trim().length >= 2) {
        try {
          const results = await searchLocations(locationInput);
          setLocationSuggestions(results || []);
        } catch (error) {
          console.error("Location search failed:", error);
        }
      } else {
        setLocationSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [locationInput]);

  // Fetch initial location (Auto-detect)
  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`);
              const data = await res.json();
              const userState = data.address?.state;
              let userCity = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb;

              if (userState && isMounted) {
                const locString = userCity ? `${userCity}, ${userState}` : userState;
                setLocationInput(locString);
                setFormData(f => ({ ...f, location: locString }));
              }
            } catch (err) {
              console.log('Reverse geocoding failed', err);
            }
          }, () => {
            console.log('Geolocation permission denied or failed');
          });
        }
      } catch (err) {
        console.error('Failed to init location', err);
      }
    };
    initLocation();
    return () => { isMounted = false; };
  }, []);

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
  const { data: groundsData, isLoading: isLoadingGrounds } = useGetGroundsQuery(
    {
      sportType: formData.sportType,
      state: venueStateFilter || undefined,
      city: venueCityFilter || undefined,
      query: venueSearchQuery || undefined
    },
    { skip: step !== 4 && step !== 5 }
  );
  const { data: umpiresData, isLoading: isLoadingUmpires } = useGetUmpiresQuery(
    {
      gameType: formData.sportType,
      state: proStateFilter || undefined,
      city: proCityFilter || undefined,
      query: proSearchQuery || undefined
    },
    { skip: step !== 4 && step !== 5 }
  );

  const [searchPlayers, { data: searchPlayersData, isFetching: isSearchingPlayers }] = useLazySearchPlayersQuery();
  const [invitePlayer, { isLoading: isInviting }] = useInviteMemberMutation();
  const [addCustomPlayer, { isLoading: isAddingCustom }] = useAddCustomMemberMutation();

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
    const regularMembers = (details.team.members || []).map(m => ({
      id: m.user?.id || m.userId,
      name: m.user?.name || m.user?.username || 'Player',
      profilePicture: m.user?.profilePicture || null,
      role: m.role || 'PLAYER',
      isCustom: false,
    }));
    const customMembers = (details.team.customMembers || []).map(m => ({
      id: m.id,
      name: m.name || 'Custom Player',
      profilePicture: null,
      role: 'PLAYER',
      isCustom: true,
    }));
    const allMembers = [...regularMembers, ...customMembers].slice(0, formData.maxMembers);
    const playerKey = teamKey === 'A' ? 'teamAPlayers' : 'teamBPlayers';
    setFormData(f => ({ ...f, [playerKey]: allMembers }));
  };

  useEffect(() => {
    if (step === 3) {
      if (formData.teamAPlayers.length === 0 && teamADetails?.team) {
        initPlayersFromTeam('A');
      }
      if (formData.teamBPlayers.length === 0 && teamBDetails?.team) {
        initPlayersFromTeam('B');
      }
    }
  }, [step, teamADetails, teamBDetails]);

  const removePlayer = (teamKey, playerId) => {
    const playerKey = teamKey === 'A' ? 'teamAPlayers' : 'teamBPlayers';
    setFormData(f => ({ ...f, [playerKey]: f[playerKey].filter(p => p.id !== playerId) }));
  };

  const handleInviteAndAdd = async (player) => {
    const teamId = playerPopup?.teamKey === 'A' ? formData.teamAId : formData.teamBId;
    if (teamId) {
      try {
        await invitePlayer({ teamId, userId: player._id || player.id }).unwrap();
        toast.success('Invitation sent to player!');
      } catch (err) {
        toast.error(err.data?.message || 'Failed to send invitation');
      }
    }
    selectPlayer(player);
  };

  const handleAddCustomPlayerSubmit = async (e) => {
    e?.preventDefault();
    if (!customPlayerName.trim()) return toast.error('Player Name is required');

    const teamId = playerPopup?.teamKey === 'A' ? formData.teamAId : formData.teamBId;
    if (!teamId) {
      selectPlayer({ name: customPlayerName, isCustom: true });
      return;
    }

    try {
      const result = await addCustomPlayer({
        teamId,
        name: customPlayerName,
        phone: customPlayerPhone,
      }).unwrap();

      if (result.success) {
        const inviteResult = result.results?.[0];

        if (inviteResult?.status === "error" && inviteResult?.existingUserId) {
          toast.success(`User exists (${inviteResult.existingUserName}). Inviting them...`);
          await invitePlayer({ teamId, userId: inviteResult.existingUserId }).unwrap();
          selectPlayer({ id: inviteResult.existingUserId, name: inviteResult.existingUserName, username: inviteResult.existingUserName });
          setCustomPlayerName('');
          setCustomPlayerPhone('');
          return;
        }

        if (inviteResult?.status === "invited_custom") {
          setCustomInviteData({
            token: inviteResult.token,
            phone: customPlayerPhone,
            countryCode: customPlayerCountryCode,
            name: customPlayerName
          });
          toast.success('Player added! Send them a WhatsApp invite.');
          selectPlayer({ id: inviteResult.customMemberId || Math.random().toString(), name: customPlayerName, isCustom: true });
        } else {
          toast.success('Custom player added to team!');
          selectPlayer({ id: inviteResult?.customMemberId || Math.random().toString(), name: customPlayerName, isCustom: true });
          setCustomPlayerName('');
          setCustomPlayerPhone('');
        }
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to add player');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (playerSearchQuery.trim()) {
        searchPlayers(playerSearchQuery.trim());
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [playerSearchQuery, searchPlayers]);

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
    if (action === 'REPLACE') {
      setPlayerPopup(null);
    }
    setPlayerSearchQuery('');
    setCustomPlayerName('');
  };

  const changePlayerRole = (teamKey, playerId, role) => {
    const key = teamKey === 'A' ? 'teamAPlayers' : 'teamBPlayers';
    setFormData(f => {
      let players = [...f[key]];

      // Enforce unique roles
      if (role !== 'PLAYER') {
        players = players.map(p => p.role === role ? { ...p, role: 'PLAYER' } : p);
      }

      players = players.map(p => p.id === playerId ? { ...p, role } : p);
      return { ...f, [key]: players };
    });
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
      case 3: return formData.teamAPlayers.length > 0 && formData.teamBPlayers.length > 0;
      case 5: return formData.scoringPassword.trim() === '' || formData.scoringPassword.length >= 4;
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
    const teamDetailsForPopup = playerPopup.teamKey === 'A' ? teamADetails : teamBDetails;
    const rosterMembers = teamDetailsForPopup?.team ? [
      ...(teamDetailsForPopup.team.members || []).map(m => ({
        id: m.user?.id || m.userId,
        name: m.user?.name || m.user?.username || 'Player',
        username: m.user?.username,
        profilePicture: m.user?.profilePicture || null,
        role: m.role || 'PLAYER',
        isCustom: false,
      })),
      ...(teamDetailsForPopup.team.customMembers || []).map(m => ({
        id: m.id,
        name: m.name || 'Custom Player',
        profilePicture: null,
        role: 'PLAYER',
        isCustom: true,
      }))
    ] : [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => {
          setPlayerPopup(null);
          setCustomInviteData(null);
        }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              {playerPopup.action === 'REPLACE' ? 'Replace Player' : 'Add Player'}
            </h3>
            <button onClick={() => {
              setPlayerPopup(null);
              setCustomInviteData(null);
            }} className="p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            <button
              onClick={() => setActivePlayerTab('roster')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activePlayerTab === 'roster' ? 'text-[#BFF367] border-b-2 border-[#BFF367]' : 'text-white/40 hover:text-white/80'}`}
            >
              Roster
            </button>
            <button
              onClick={() => setActivePlayerTab('search')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activePlayerTab === 'search' ? 'text-[#BFF367] border-b-2 border-[#BFF367]' : 'text-white/40 hover:text-white/80'}`}
            >
              Search
            </button>
            <button
              onClick={() => setActivePlayerTab('custom')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activePlayerTab === 'custom' ? 'text-[#BFF367] border-b-2 border-[#BFF367]' : 'text-white/40 hover:text-white/80'}`}
            >
              Custom
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            {activePlayerTab === 'roster' ? (
              <div className="space-y-2">
                {rosterMembers.length > 0 ? rosterMembers.map(p => {
                  const currentList = playerPopup.teamKey === 'A' ? formData.teamAPlayers : formData.teamBPlayers;
                  const isAdded = currentList.some(cp => cp.id === p.id);
                  return (
                    <button key={p.id} onClick={() => {
                      if (isAdded) {
                        setFormData(f => {
                          const key = playerPopup.teamKey === 'A' ? 'teamAPlayers' : 'teamBPlayers';
                          return { ...f, [key]: f[key].filter(cp => cp.id !== p.id) };
                        });
                      } else {
                        selectPlayer(p);
                      }
                    }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isAdded ? 'bg-[#BFF367]/10 border-[#BFF367]/30' : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10'}`}>
                      <div className="flex items-center gap-3">
                        {p.profilePicture ? <img src={p.profilePicture} className="w-10 h-10 rounded-full object-cover" alt={p.name} /> : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40"><Users size={16} /></div>}
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {p.username || p.name}
                          </div>
                          <div className="text-xs text-white/40">{p.isCustom ? 'Custom Player' : p.name}</div>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full ${isAdded ? 'bg-white/10 text-white/40' : 'bg-[#BFF367]/10 text-[#BFF367]'}`}>
                        {isAdded ? <Check size={16} /> : <Plus size={16} />}
                      </div>
                    </button>
                  );
                }) : (
                  <div className="text-center py-8 text-white/40">
                    <Users size={32} className="mx-auto mb-3 opacity-50" />
                    <div className="text-sm font-bold text-white mb-1">No players in roster</div>
                    <div className="text-xs">Add players via Search or Custom</div>
                  </div>
                )}
              </div>
            ) : activePlayerTab === 'search' ? (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    {isSearchingPlayers ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  </div>
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={e => setPlayerSearchQuery(e.target.value)}
                    placeholder="Search by name, username, or phone..."
                    className={`${inputClass} pl-10`}
                  />
                </div>

                <div className="space-y-2">
                  {searchPlayersData?.players?.map(p => (
                    <button key={p._id} onClick={() => handleInviteAndAdd(p)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left">
                      <div className="flex items-center gap-3">
                        {p.profilePicture ? <img src={p.profilePicture} className="w-10 h-10 rounded-full object-cover" alt={p.username} /> : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40"><Users size={16} /></div>}
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {p.username}
                          </div>
                          <div className="text-xs text-white/40">{p.name}</div>
                        </div>
                      </div>
                      <div className="bg-[#BFF367]/10 text-[#BFF367] p-2 rounded-full">
                        <UserPlus size={16} />
                      </div>
                    </button>
                  ))}

                  {!isSearchingPlayers && playerSearchQuery && (!searchPlayersData?.players?.length) && (
                    <div className="text-center py-8 text-white/40">
                      <UserCheck size={32} className="mx-auto mb-3 opacity-50" />
                      <div className="text-sm font-bold text-white mb-1">No players found</div>
                      <div className="text-xs">Try searching by a different name or phone</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!customInviteData ? (
                  <form onSubmit={handleAddCustomPlayerSubmit} className="space-y-4">
                    <div className="bg-[#55DEE8]/10 border border-[#55DEE8]/20 rounded-xl p-4 flex gap-3">
                      <Sparkles size={20} className="text-[#55DEE8] flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-[#55DEE8]">
                        Create a custom player placeholder. If you add their phone number, they'll get an invite to join Kridaz!
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Player Name *</label>
                      <input
                        type="text"
                        value={customPlayerName}
                        onChange={e => setCustomPlayerName(e.target.value)}
                        placeholder="E.g., Virat Kohli"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number (Optional)</label>
                      <div className="flex">
                        <select
                          value={customPlayerCountryCode}
                          onChange={e => setCustomPlayerCountryCode(e.target.value)}
                          className={`${selectClass} w-24 rounded-r-none border-r-0`}
                        >
                          <option value="91">+91</option>
                          <option value="1">+1</option>
                          <option value="44">+44</option>
                          <option value="61">+61</option>
                          <option value="971">+971</option>
                        </select>
                        <input
                          type="tel"
                          value={customPlayerPhone}
                          onChange={e => setCustomPlayerPhone(e.target.value)}
                          placeholder="9876543210"
                          className={`${inputClass} rounded-l-none`}
                        />
                      </div>
                      <p className="text-[10px] text-white/40 mt-1.5 ml-1 flex items-center gap-1">
                        <Phone size={10} /> Add phone to send them a WhatsApp invite
                      </p>
                    </div>
                    <button type="submit" disabled={isAddingCustom || !customPlayerName.trim()}
                      className="w-full py-3.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black rounded-xl uppercase tracking-wider text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2">
                      {isAddingCustom ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Add Custom Player
                    </button>
                  </form>
                ) : (
                  <div className="text-center space-y-5 py-4">
                    <div className="w-16 h-16 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto border-2 border-[#25D366]/30">
                      <MessageCircle size={32} className="text-[#25D366]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white mb-2">Invite Ready!</h4>
                      <p className="text-sm text-white/60 mb-6">
                        {customInviteData.name} has been added to the team. Send them a WhatsApp invite so they can claim their profile.
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const message = `Hey ${customInviteData.name}! I've added you to our team on Kridaz. Click here to join: ${window.location.origin}/invite?token=${customInviteData.token}`;
                            window.open(`https://wa.me/${customInviteData.countryCode}${customInviteData.phone}?text=${encodeURIComponent(message)}`, '_blank');
                            setPlayerPopup(null);
                            setCustomInviteData(null);
                          }}
                          className="flex-1 py-3 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors"
                        >
                          <MessageCircle size={18} />
                          Send WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            setPlayerPopup(null);
                            setCustomInviteData(null);
                          }}
                          className="py-3 px-6 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Sport Type</label>
                <select value={formData.sportType}
                  onChange={e => setFormData(f => ({ ...f, sportType: e.target.value }))}
                  className={selectClass}>
                  <option value="CRICKET">🏏 Cricket</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Match Date & Time</label>
                <input type="datetime-local" value={formData.matchDateTime}
                  onChange={e => setFormData(f => ({ ...f, matchDateTime: e.target.value }))}
                  className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Match Format</label>
                <select value={formData.format}
                  onChange={e => {
                    const format = e.target.value;
                    let defaultPowerPlay = 6;
                    if (format === 'T10') defaultPowerPlay = 3;
                    if (format === 'ODI') defaultPowerPlay = 10;
                    setFormData(f => ({ ...f, format, powerPlayOvers: defaultPowerPlay }));
                  }}
                  className={selectClass}>
                  {CRICKET_FORMATS.map(f => (
                    <option key={f.value} value={f.value}>{f.label} ({f.sub})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Power Play Overs</label>
                <input type="number" min="0" max="100" value={formData.powerPlayOvers}
                  onChange={e => setFormData(f => ({ ...f, powerPlayOvers: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  className={inputClass} />
              </div>
            </div>

            {formData.format === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div>
                  <label className={labelClass}>Days</label>
                  <input type="number" min="1" max="10" value={formData.customDays}
                    onChange={e => setFormData(f => ({ ...f, customDays: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)) }))}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Overs per Day</label>
                  <input type="number" min="1" max="100" value={formData.customOversPerDay}
                    onChange={e => setFormData(f => ({ ...f, customOversPerDay: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) }))}
                    className={inputClass} />
                </div>
              </div>
            )}

            <div className="relative z-[90]" ref={locationRef}>
              <label className={labelClass}>Location</label>
              <div className="relative">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setFormData(f => ({ ...f, location: e.target.value }));
                    setShowLocationSuggestions(true);
                  }}
                  onFocus={() => locationInput.length >= 2 && setShowLocationSuggestions(true)}
                  className={inputClass}
                  placeholder="Search City or State"
                />
              </div>
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[100]">
                  <div className="max-h-[200px] overflow-y-auto">
                    {locationSuggestions.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault();
                          const displayName = typeof loc === 'object' ? loc.display_name : loc;
                          setLocationInput(displayName);
                          setFormData(f => ({ ...f, location: displayName }));
                          setShowLocationSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-bold text-gray-300 hover:bg-[#55DEE8] hover:text-black transition-colors"
                      >
                        {typeof loc === 'object' ? loc.display_name : loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Ball Type</label>
                <select value={formData.ballType}
                  onChange={e => setFormData(f => ({ ...f, ballType: e.target.value }))}
                  className={selectClass}>
                  {BALL_TYPES.map(b => <option key={b.value} value={b.value}>{b.emoji} {b.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Ground Type</label>
                <select value={formData.groundType}
                  onChange={e => setFormData(f => ({ ...f, groundType: e.target.value }))}
                  className={selectClass}>
                  {GROUND_TYPES.map(g => <option key={g.value} value={g.value}>{g.emoji} {g.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Pitch Type</label>
                <select value={formData.pitchType}
                  onChange={e => setFormData(f => ({ ...f, pitchType: e.target.value }))}
                  className={selectClass}>
                  {PITCH_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Match Timing</label>
                <select value={formData.matchTiming}
                  onChange={e => setFormData(f => ({ ...f, matchTiming: e.target.value }))}
                  className={selectClass}>
                  {MATCH_TIMINGS.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Max Members per Team</label>
              <select value={formData.maxMembers}
                onChange={e => setFormData(f => ({ ...f, maxMembers: parseInt(e.target.value) || 11 }))}
                className={selectClass}>
                {[5, 6, 7, 8, 9, 10, 11, 12, 15].map(n => <option key={n} value={n}>{n} Players</option>)}
              </select>
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

      // ── Step 3: Playing XIs ───────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex border-b border-white/10 flex-shrink-0">
              <button
                onClick={() => setXiTab('A')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors truncate px-2 ${xiTab === 'A' ? 'text-[#55DEE8] border-b-2 border-[#55DEE8]' : 'text-white/40 hover:text-white/80'}`}
              >
                {getTeamName(formData.teamAId) || 'Team A'}
              </button>
              <button
                onClick={() => setXiTab('B')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors truncate px-2 ${xiTab === 'B' ? 'text-[#BFF367] border-b-2 border-[#BFF367]' : 'text-white/40 hover:text-white/80'}`}
              >
                {getTeamName(formData.teamBId) || 'Team B'}
              </button>
            </div>
            {xiTab === 'A' ? (
              <PlayingXIStep
                teamKey="A"
                teamName={getTeamName(formData.teamAId)}
                players={formData.teamAPlayers}
                maxMembers={formData.maxMembers}
                teamDetails={teamADetails?.team}
                onInit={() => initPlayersFromTeam('A')}
                onRemove={(id) => removePlayer('A', id)}
                onAdd={() => {
                  setPlayerPopup({ teamKey: 'A', action: 'ADD', replaceId: null });
                  setActivePlayerTab('roster');
                }}
                onReplace={(id) => {
                  setPlayerPopup({ teamKey: 'A', action: 'REPLACE', replaceId: id });
                  setActivePlayerTab('roster');
                }}
                onRoleChange={(id, role) => changePlayerRole('A', id, role)}
              />
            ) : (
              <PlayingXIStep
                teamKey="B"
                teamName={getTeamName(formData.teamBId)}
                players={formData.teamBPlayers}
                maxMembers={formData.maxMembers}
                teamDetails={teamBDetails?.team}
                onInit={() => initPlayersFromTeam('B')}
                onRemove={(id) => removePlayer('B', id)}
                onAdd={() => {
                  setPlayerPopup({ teamKey: 'B', action: 'ADD', replaceId: null });
                  setActivePlayerTab('roster');
                }}
                onReplace={(id) => {
                  setPlayerPopup({ teamKey: 'B', action: 'REPLACE', replaceId: id });
                  setActivePlayerTab('roster');
                }}
                onRoleChange={(id, role) => changePlayerRole('B', id, role)}
              />
            )}
          </div>
        );

      // ── Step 4: Add-ons (Venue + Professionals) ───────────────────────────────
      case 4:
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
                <div className="space-y-4 pr-1">
                  {/* Venue Search & Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                      <input
                        type="text"
                        placeholder="Search venues..."
                        className={`${inputClass} pl-10 py-2 text-sm`}
                        value={venueSearchQuery}
                        onChange={e => setVenueSearchQuery(e.target.value)}
                      />
                    </div>

                  </div>

                  {/* Venue List */}
                  <div className="space-y-2">
                    {isLoadingGrounds ? (
                      <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white/40" /></div>
                    ) : (() => {
                      const filteredVenues = groundsData?.grounds?.filter(g =>
                        (!venueStateFilter || g.state === venueStateFilter) &&
                        (!venueCityFilter || g.city === venueCityFilter) &&
                        (!venueSearchQuery || g.name.toLowerCase().includes(venueSearchQuery.toLowerCase()))
                      ) || [];

                      return filteredVenues.length > 0 ? (
                        filteredVenues.map(g => (
                          <button key={g.id} onClick={() => setFormData(f => ({ ...f, venueId: f.venueId === g.id ? null : g.id, customVenue: '' }))}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${formData.venueId === g.id ? 'bg-[#55DEE8]/10 border-[#55DEE8]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                            <div className="flex items-center gap-3">
                              <MapPin size={18} className={formData.venueId === g.id ? 'text-[#55DEE8]' : 'text-white/40'} />
                              <div>
                                <div className="font-bold text-white text-sm">{g.name}</div>
                                <div className="text-[10px] text-white/40">{g.city}</div>
                              </div>
                            </div>
                            {formData.venueId === g.id && <Check size={16} className="text-[#55DEE8]" />}
                          </button>
                        ))
                      ) : (
                        <div className="text-center p-4 text-sm text-white/40">No listed venues match your filters.</div>
                      );
                    })()}
                  </div>

                  {/* Custom Venue Input */}
                  <div className="pt-4 border-t border-white/10">
                    <label className={labelClass}>Add Custom Venue</label>
                    <input
                      type="text"
                      placeholder="Enter custom venue name..."
                      className={inputClass}
                      value={formData.customVenue}
                      onChange={e => {
                        setFormData(f => ({ ...f, customVenue: e.target.value, venueId: null }));
                      }}
                    />
                    {formData.customVenue && <div className="text-[#BFF367] text-[10px] mt-1 flex items-center gap-1"><Check size={12} /> Custom venue selected</div>}
                  </div>
                </div>
              )}
              {addonsTab === 'PROFESSIONALS' && (
                <div className="space-y-4 pr-1">
                  {/* Professionals Search & Filters */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                        <input
                          type="text"
                          placeholder="Search professionals (name or phone)..."
                          className={`${inputClass} pl-10 py-2 text-sm`}
                          value={proSearchQuery}
                          onChange={e => setProSearchQuery(e.target.value)}
                        />
                      </div>
                      <select className={`${selectClass} py-2 text-sm w-1/3`} value={proRoleFilter} onChange={e => setProRoleFilter(e.target.value)}>
                        <option value="">All Roles</option>
                        <option value="UMPIRE">Umpire</option>
                        <option value="SCORER">Scorer</option>
                        <option value="COMMENTATOR">Commentator</option>
                      </select>
                    </div>

                  </div>

                  <button onClick={() => setShowCustomProInvite(true)} className="w-full py-3 rounded-xl border border-dashed border-[#55DEE8]/50 text-[#55DEE8] flex items-center justify-center gap-2 text-sm font-bold hover:bg-[#55DEE8]/10 transition-colors">
                    <UserPlus size={16} />
                    Invite Custom Professional
                  </button>

                  <div className="space-y-2">
                    {/* List Custom Professionals already added */}
                    {formData.customProfessionals?.map((cp, idx) => (
                      <div key={`custom-${idx}`} className="w-full flex items-center justify-between p-3 rounded-xl border bg-[#BFF367]/10 border-[#BFF367]">
                        <div className="flex items-center gap-3">
                          <UserCheck size={18} className="text-[#BFF367]" />
                          <div>
                            <div className="font-bold text-white text-sm">{cp.name} <span className="text-[10px] text-[#BFF367] ml-1">(Custom)</span></div>
                            <div className="text-[10px] text-white/40">{cp.role} • {cp.phone}</div>
                          </div>
                        </div>
                        <button onClick={() => setFormData(f => ({ ...f, customProfessionals: f.customProfessionals.filter((_, i) => i !== idx) }))}>
                          <X size={16} className="text-white/40 hover:text-red-400" />
                        </button>
                      </div>
                    ))}

                    {isLoadingUmpires ? (
                      <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white/40" /></div>
                    ) : (() => {
                      const filteredPros = umpiresData?.umpires?.filter(u =>
                        (!proRoleFilter || u.role === proRoleFilter)
                      ) || [];

                      return filteredPros.length > 0 ? (
                        filteredPros.map(u => {
                          const isSelected = formData.professionals.includes(u.id);
                          return (
                            <button key={u.id} onClick={() => setFormData(f => ({ ...f, professionals: isSelected ? f.professionals.filter(id => id !== u.id) : [...f.professionals, u.id] }))}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-[#BFF367]/10 border-[#BFF367]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                              <div className="flex items-center gap-3">
                                {u.profilePicture ? <img src={u.profilePicture} className="w-8 h-8 rounded-full object-cover" alt={u.name} /> : <UserCheck size={18} className={isSelected ? 'text-[#BFF367]' : 'text-white/40'} />}
                                <div>
                                  <div className="font-bold text-white text-sm">{u.name || 'Professional'}</div>
                                  <div className="text-[10px] text-white/40">{(u.role || 'Umpire').toLowerCase()}{u.city ? ` • ${u.city}` : ''}</div>
                                </div>
                              </div>
                              {isSelected && <Check size={16} className="text-[#BFF367]" />}
                            </button>
                          );
                        })
                      ) : (
                        formData.customProfessionals?.length === 0 && <div className="text-center p-4 text-sm text-white/40">No professionals match your search.</div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Pro Invite Popup */}
            <AnimatePresence>
              {showCustomProInvite && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 z-50 bg-[#0a0a0a] flex flex-col p-4"
                >
                  {customProInviteData ? (
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">Invite Sent</h3>
                        <button onClick={() => { setShowCustomProInvite(false); setCustomProInviteData(null); }} className="p-2 bg-white/10 rounded-full text-white/60 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-[#BFF367]/20 rounded-full flex items-center justify-center border border-[#BFF367]">
                          <MessageCircle size={32} className="text-[#BFF367]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">Send WhatsApp Invite</h4>
                          <p className="text-sm text-white/50 mt-1">
                            {customProInviteData.name} has been added to the match setup. Send them a WhatsApp message to join and onboard as {customProInviteData.role}.
                          </p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg text-left w-full mt-4 border border-white/10">
                          <p className="text-xs text-white/60 font-mono break-words">
                            Hey {customProInviteData.name}, I've invited you to officiate as a {customProInviteData.role} for an upcoming match on Kridaz! Click here to join:
                            https://kridaz.com/invite?token=CUSTOM&role={customProInviteData.role}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const text = encodeURIComponent(`Hey ${customProInviteData.name}, I've invited you to officiate as a ${customProInviteData.role} for an upcoming match on Kridaz! Click here to join: https://kridaz.com/invite?token=CUSTOM&role=${customProInviteData.role}`);
                            window.open(`https://wa.me/${customProInviteData.phone}?text=${text}`, '_blank');
                            setShowCustomProInvite(false);
                            setCustomProInviteData(null);
                          }}
                          className="w-full py-4 rounded-xl bg-[#BFF367] text-black font-black uppercase tracking-wider hover:bg-[#a5db4e] transition-colors mt-6"
                        >
                          Send via WhatsApp
                        </button>
                        <button onClick={() => { setShowCustomProInvite(false); setCustomProInviteData(null); }} className="text-sm text-white/40 hover:text-white uppercase font-bold tracking-wider mt-4">
                          Skip for now
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">Invite Professional</h3>
                        <button onClick={() => setShowCustomProInvite(false)} className="p-2 bg-white/10 rounded-full text-white/60 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className={labelClass}>Professional's Name</label>
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="e.g. John Doe"
                            value={customProfessionalName}
                            onChange={(e) => setCustomProfessionalName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>WhatsApp Number</label>
                          <div className="flex gap-2">
                            <select
                              className={`${selectClass} w-24`}
                              value={customPlayerCountryCode}
                              onChange={(e) => setCustomPlayerCountryCode(e.target.value)}
                            >
                              <option value="91">+91 (IN)</option>
                              <option value="1">+1 (US)</option>
                              <option value="44">+44 (UK)</option>
                              <option value="61">+61 (AU)</option>
                            </select>
                            <input
                              type="tel"
                              className={`${inputClass} flex-1`}
                              placeholder="9876543210"
                              value={customProfessionalPhone}
                              onChange={(e) => setCustomProfessionalPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Role</label>
                          <select
                            className={selectClass}
                            value={customProfessionalRole}
                            onChange={(e) => setCustomProfessionalRole(e.target.value)}
                          >
                            <option value="UMPIRE">Umpire</option>
                            <option value="SCORER">Scorer</option>
                            <option value="COMMENTATOR">Commentator</option>
                            <option value="STREAMER">Streamer</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!customProfessionalName || !customProfessionalPhone) {
                            toast.error('Please enter name and phone number');
                            return;
                          }
                          const newPro = {
                            name: customProfessionalName,
                            phone: `+${customPlayerCountryCode}${customProfessionalPhone}`,
                            role: customProfessionalRole
                          };
                          setFormData(f => ({ ...f, customProfessionals: [...(f.customProfessionals || []), newPro] }));
                          setCustomProInviteData(newPro);
                          setCustomProfessionalName('');
                          setCustomProfessionalPhone('');
                        }}
                        disabled={!customProfessionalName || !customProfessionalPhone}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black uppercase tracking-wider disabled:opacity-50 mt-auto hover:opacity-90 transition-opacity shadow-lg shadow-[#55DEE8]/20"
                      >
                        Add to Match & Invite
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-[#55DEE8]/10 border border-[#55DEE8]/20 rounded-xl p-4 flex gap-3 flex-shrink-0">
              <Sparkles size={20} className="text-[#55DEE8] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#55DEE8]">
                Venues and professionals selected here are added to your scoring match directly. No payment or coin transaction is required.
              </div>
            </div>
          </div>
        );

      // ── Step 5: Final Review + Confirm ─────────────────────────────────────────
      case 5: {
        const teamAName = getTeamName(formData.teamAId);
        const teamBName = getTeamName(formData.teamBId);
        const formatLabel = CRICKET_FORMATS.find(f => f.value === formData.format)?.label || formData.format;
        const ballLabel = BALL_TYPES.find(b => b.value === formData.ballType)?.label || formData.ballType;
        const groundLabel = GROUND_TYPES.find(g => g.value === formData.groundType)?.label || formData.groundType;
        const timingLabel = MATCH_TIMINGS.find(t => t.value === formData.matchTiming)?.label || formData.matchTiming;
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
          {step === 4 && (
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

const PlayingXIStep = ({ teamKey, teamName, players, maxMembers, teamDetails, onInit, onRemove, onAdd, onReplace, onRoleChange }) => {
  const color = teamKey === 'A' ? '#55DEE8' : '#BFF367';
  const hasAutoLoaded = players.length > 0;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wide max-w-[200px] truncate" title={teamName ? `${teamName} Playing XI` : `Team ${teamKey} Playing XI`}>
            {teamName ? `${teamName} Playing XI` : `Team ${teamKey} Playing XI`}
          </h3>
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
            <select
              value={p.role || 'PLAYER'}
              onChange={(e) => onRoleChange && onRoleChange(p.id, e.target.value)}
              className="bg-black/50 border border-white/10 text-[10px] text-white rounded p-1 focus:outline-none"
            >
              <option value="PLAYER">Player</option>
              <option value="CAPTAIN">Captain</option>
              <option value="WICKET_KEEPER_1">Wicket Keeper</option>
              <option value="WICKET_KEEPER_2">2nd Wicket Keeper</option>
            </select>
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
        <p className="text-[10px] uppercase tracking-wider text-yellow-400/80 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 flex-shrink-0 text-center font-bold">
          Needs {maxMembers - players.length} more player(s) for a full XI
        </p>
      )}
    </div>
  );
};

export default StartScoringModal;
