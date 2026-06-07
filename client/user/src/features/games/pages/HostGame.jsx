import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '@hooks/useAxiosInstance';
import { toast } from 'react-hot-toast';
import SlotPickerPopup from '@components/SlotPickerPopup';
import MaterialDateTimePicker from '../../../shared/components/MaterialDateTimePicker';
import { 
  Trophy, Calendar, Clock, MapPin, 
  Users, UserCheck, Search, Coins, CheckCircle2,
  ShieldCheck, Zap, Trash2, Plus, Minus, ImageIcon, ChevronDown, Mail, ShieldAlert, Receipt, ArrowRight
} from 'lucide-react';
import { useGetMyTeamsQuery } from '@redux/api/teamApi';
import CoinAnimation from '@components/CoinAnimation';
import { fetchStates, fetchCities } from '@utils/locationService';

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

const MOCK_TEAM_IMAGES = [
  { label: "Stadium Night",  url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80" },
  { label: "Football Arena", url: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80" },
  { label: "Cricket Ground", url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },
  { label: "Indoor Court",   url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" },
  { label: "Night Match",    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80" },
  { label: "Floodlit Pitch", url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80" },
  { label: "Basketball",     url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80" },
  { label: "Running Track",  url: "https://images.unsplash.com/photo-1564769610726-59cead6a6f8f?w=800&q=80" },
];

const SPORT_DEFAULTS = {
  "Cricket": [
    { role: "Batsman", count: 4 },
    { role: "Bowler", count: 4 },
    { role: "All-rounder", count: 2 },
    { role: "Wicket Keeper", count: 1 }
  ],
  "Football": [
    { role: "Forward", count: 3 },
    { role: "Midfielder", count: 3 },
    { role: "Defender", count: 4 },
    { role: "GK", count: 1 }
  ],
  "Basketball": [
    { role: "Guard", count: 2 },
    { role: "Forward", count: 2 },
    { role: "Center", count: 1 }
  ],
  "Volleyball": [
    { role: "Attacker", count: 2 },
    { role: "Setter", count: 1 },
    { role: "Blocker", count: 2 },
    { role: "Libero", count: 1 }
  ],
  "Badminton": [
    { role: "Player", count: 2 }
  ],
  "Tennis": [
    { role: "Player", count: 2 }
  ],
  "Table Tennis": [
    { role: "Player", count: 2 }
  ],
  "Pickleball": [
    { role: "Player", count: 2 }
  ]
};
﻿const SPORT_ICONS = {
  "Cricket": (
    <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M25 75 L65 35 M30 80 L70 40 M30 80 A5 5 0 0 1 25 75" />
      <path d="M65 35 L70 40" strokeWidth="3" />
      <path d="M67 37 L82 22 M68 38 L83 23" />
      <path d="M82 22 L83 23" />
      <path d="M71 33 L73 35 M74 30 L76 32 M77 27 L79 29" />
      <circle cx="65" cy="70" r="7" />
      <path d="M58 70 A7 7 0 0 1 72 70" strokeDasharray="2,2" />
    </svg>
  ),
  "Football": (
    <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="35" />
      <path d="M50 38 L60 45 L56 57 L44 57 L40 45 Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M50 38 L50 15 M60 45 L82 38 M56 57 L72 78 M44 57 L28 78 M40 45 L18 38" />
      <path d="M50 15 L38 20 M50 15 L62 20" />
      <path d="M82 38 L85 50 M82 38 L80 26" />
      <path d="M72 78 L60 83 M72 78 L81 68" />
      <path d="M28 78 L40 83 M28 78 L19 68" />
      <path d="M18 38 L20 26 M18 38 L15 50" />
    </svg>
  ),
  "Basketball": (
    <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="35" />
      <path d="M15 50 H85 M50 15 V85" />
      <path d="M25 25 Q50 50 25 75 M75 25 Q50 50 75 75" />
    </svg>
  ),
  "Volleyball": (
    <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="35" />
      <path d="M50 50 Q30 25 50 15" />
      <path d="M50 50 Q70 25 50 15" />
      <path d="M50 50 Q75 60 83 40" />
      <path d="M50 50 Q65 75 83 40" />
      <path d="M50 50 Q25 65 17 45" />
      <path d="M50 50 Q35 75 17 45" />
      <path d="M32 30 Q45 23 48 16" />
      <path d="M68 30 Q55 23 52 16" />
      <path d="M70 65 Q78 52 82 43" />
      <path d="M60 77 Q68 64 72 58" />
      <path d="M30 65 Q22 52 18 43" />
      <path d="M40 77 Q32 64 28 58" />
    </svg>
  ),
  "Badminton": (
    <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M42 62 A12 12 0 0 0 58 62 Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M42 62 C42 72 58 72 58 62" />
      <path d="M42 62 L32 25 H68 L58 62" />
      <path d="M47 62 L41 25" />
      <path d="M50 62 L50 25" />
      <path d="M53 62 L59 25" />
      <path d="M37 44 Q50 48 63 44" />
      <path d="M35 34 Q50 38 65 34" />
    </svg>
  ),
  "Tennis": (
    <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="35" />
      <path d="M22 35 Q50 50 22 65 M78 35 Q50 50 78 65" />
    </svg>
  ),
  "Table Tennis": (
    <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="45" cy="45" r="22" fill="currentColor" fillOpacity="0.1" />
      <path d="M60 60 L78 78 A4 4 0 0 1 72 84 L54 66 M54 66 L60 60" />
      <path d="M40 61 Q45 55 52 50" />
      <circle cx="68" cy="40" r="7" />
      <path d="M64 36 A7 7 0 0 1 72 44" strokeWidth="1" />
    </svg>
  ),
  "Pickleball": (
    <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="35" />
      <circle cx="50" cy="30" r="2.5" fill="currentColor" />
      <circle cx="50" cy="70" r="2.5" fill="currentColor" />
      <circle cx="30" cy="50" r="2.5" fill="currentColor" />
      <circle cx="70" cy="50" r="2.5" fill="currentColor" />
      <circle cx="37" cy="37" r="2.5" fill="currentColor" />
      <circle cx="63" cy="37" r="2.5" fill="currentColor" />
      <circle cx="37" cy="63" r="2.5" fill="currentColor" />
      <circle cx="63" cy="63" r="2.5" fill="currentColor" />
      <circle cx="50" cy="50" r="2.5" fill="currentColor" />
    </svg>
  )
};


const HostGame = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useSelector((/** @type {any} */ state) => state.auth);
  const [step, setStep] = useState(parseInt(searchParams.get('step')) || 1);
  const [loading, setLoading] = useState(false);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSlotPicker, setActiveSlotPicker] = useState(null);

  // Coupon & Billing State
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Form State
  const storedData = JSON.parse(sessionStorage.getItem('hostGameData'));
  const initialGameData = storedData ? {
    ...storedData,
    quickPlayerCount: storedData.quickPlayerCount || 2
  } : {
    gameType: '',
    gameMode: '', // QUICK or FULL
    date: '',
    time: '',
    quickPlayerCount: 2,
    quickSlotsData: [],
    city: user?.city || '',
    state: user?.state || '',
    teamA: { name: '', slots: [], image: MOCK_TEAM_IMAGES[0].url },
    teamB: { name: '', slots: [], image: MOCK_TEAM_IMAGES[1].url }
  };
  const [gameData, setGameData] = useState(initialGameData);

  useEffect(() => {
    sessionStorage.setItem('hostGameData', JSON.stringify(gameData));
  }, [gameData]);

  // Persist step across reloads if coming from URL
  useEffect(() => {
    const urlStep = searchParams.get('step');
    if (urlStep) {
      setStep(parseInt(urlStep));
    }
  }, [searchParams]);

  const [grounds, setGrounds] = useState([]);
  const [umpires, setUmpires] = useState([]);
  const [selectedGround, setSelectedGround] = useState(null);
  const [selectedUmpire, setSelectedUmpire] = useState(null);

  // Location dropdown state
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Custom Umpire Modal
  const [showCustomUmpireModal, setShowCustomUmpireModal] = useState(false);
  const [customUmpireData, setCustomUmpireData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Clock picker state
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showClock, setShowClock] = useState(false); // Legacy, can be removed later
  const [clockHour, setClockHour] = useState(9);
  const [clockMinute, setClockMinute] = useState(0);
  const [clockAmPm, setClockAmPm] = useState('AM');

  const displayFullDateTime = () => {
    if (gameData.date && gameData.time) {
      const d = new Date(`${gameData.date}T${gameData.time}`);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${gameData.time} local time`;
    }
    return "Select Date & Time";
  };

  // Team Fill state
  const [showTeamFillModal, setShowTeamFillModal] = useState(false);
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [fillingTeamKey, setFillingTeamKey] = useState(null); // 'teamA', 'teamB', or 'quick'
  const [activeTeamTab, setActiveTeamTab] = useState('teamA');
  const { data: teamsData } = useGetMyTeamsQuery();
  const myTeams = teamsData?.teams || [];

  const handleFillFromTeam = (team) => {
    if (fillingTeamKey === 'quick') {
      const newSlots = [...gameData.quickSlotsData];
      let slotIdx = 1; // Start from slot 2 (index 1) as slot 1 is host
      
      team.members.forEach(member => {
        if (slotIdx < newSlots.length && member.user?._id !== user?._id) {
          if (member.user) {
            newSlots[slotIdx] = { ...newSlots[slotIdx], userId: member.user._id, name: member.user.name, profilePicture: member.user.profilePicture, status: 'HELD' };
          } else {
            newSlots[slotIdx] = { ...newSlots[slotIdx], customPlayer: { name: member.name, email: member.email }, status: 'HELD' };
          }
          slotIdx++;
        }
      });
      setGameData({ ...gameData, quickSlotsData: newSlots });
    } else {
      // Professional mode
      const teamKey = fillingTeamKey;
      const otherTeamKey = teamKey === 'teamA' ? 'teamB' : 'teamA';
      
      if (gameData[otherTeamKey].name === team.name) {
        toast.error("You cannot select the same team for both sides");
        return;
      }

      const newSlots = [...gameData[teamKey].slots];
      let slotIdx = 0;
      
      team.members.forEach(member => {
        if (slotIdx >= newSlots.length) {
          newSlots.push({ role: 'Player', status: 'OPEN' });
        }
        if (member.user) {
          newSlots[slotIdx] = { ...newSlots[slotIdx], userId: member.user._id, name: member.user.name, status: 'HELD' };
        } else {
          newSlots[slotIdx] = { ...newSlots[slotIdx], customPlayer: { name: member.name, email: member.email }, status: 'HELD' };
        }
        slotIdx++;
      });
      setGameData({ 
        ...gameData, 
        [teamKey]: { 
          ...gameData[teamKey], 
          slots: newSlots,
          name: team.name,
          image: team.logo || gameData[teamKey].image,
          logo: team.logo || null,
          imageName: team.logo ? 'Team Logo' : null
        } 
      });
    }
    setShowTeamFillModal(false);
    toast.success(`Slots filled from ${team.name}`);
  };

  const formatTime = (h, m, ampm) => {
    const hour24 = ampm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const displayTime = (h, m, ampm) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const normalizeString = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  };

  useEffect(() => {
    setMounted(true);
    
    // Check for popup trigger in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('popup') === 'customUmpire') {
      setShowCustomUmpireModal(true);
    }

    const initLocation = async () => {
      setLoadingStates(true);
      const statesData = await fetchStates();
      setStates(statesData);
      setLoadingStates(false);

      if (user?.city || user?.state) {
        const uState = user.state || '';
        const uCity = user.city || '';
        
        let matchedState = '';
        if (uState) {
          matchedState = statesData.find(s => normalizeString(s) === normalizeString(uState)) || '';
        }
        
        let matchedCity = '';
        if (matchedState && uCity) {
          const citiesData = await fetchCities(matchedState);
          // Set cities early so it doesn't blink empty
          setCities(citiesData); 
          matchedCity = citiesData.find(c => normalizeString(c) === normalizeString(uCity)) || '';
        }

        if (matchedCity || matchedState) {
          setGameData(prev => ({ 
            ...prev, 
            city: matchedCity || prev.city, 
            state: matchedState || prev.state 
          }));
        }
      }
    };
    
    initLocation();
  }, [user]);

  // When state changes, load its cities
  useEffect(() => {
    if (!gameData.state) { setCities([]); return; }
    const loadCities = async () => {
      setLoadingCities(true);
      const data = await fetchCities(gameData.state);
      setCities(data);
      setLoadingCities(false);
    };
    loadCities();
  }, [gameData.state]);

  const fetchGrounds = async () => {
    try {
      const res = await axiosInstance.get(`/api/hosted-game/grounds?city=${gameData.city}&state=${gameData.state}&sportType=${gameData.gameType}`);
      setGrounds(res.data.grounds);
    } catch (err) {
      toast.error("Failed to fetch grounds");
    }
  };

  const fetchUmpires = async () => {
    try {
      const res = await axiosInstance.get(`/api/hosted-game/umpires?city=${gameData.city}&state=${gameData.state}&gameType=${gameData.gameType}`);
      setUmpires(res.data.umpires);
    } catch (err) {
      toast.error("Failed to fetch umpires");
    }
  };

  useEffect(() => {
    if (step === 3 && gameData.gameType) {
      fetchGrounds();
      fetchUmpires();
    }
  }, [step, gameData.gameType, gameData.city, gameData.state]);

  // Handle return from Venue/Professional selection
  useEffect(() => {
    if (step === 3) {
      const urlGroundId = searchParams.get('groundId');
      const urlUmpireId = searchParams.get('umpireId');
      const urlDate = searchParams.get('date');
      const urlTime = searchParams.get('time');

      if (urlGroundId && (!selectedGround || selectedGround._id !== urlGroundId)) {
        axiosInstance.get(`/api/user/turf/details/${urlGroundId}`)
          .then(res => {
            const turf = res.data.turf || res.data;
            setSelectedGround(turf);
            setGameData(prev => ({ 
              ...prev, 
              groundId: turf._id,
              date: urlDate ? new Date(urlDate).toISOString().split('T')[0] : prev.date,
              time: urlTime || prev.time,
              groundPrice: searchParams.get('price') ? Number(searchParams.get('price')) : turf.pricePerHour
            }));
          })
          .catch(err => console.error("Error fetching ground details:", err));
      }

      if (urlUmpireId && (!selectedUmpire || selectedUmpire._id !== urlUmpireId)) {
        axiosInstance.get(`/api/professional/details/${urlUmpireId}?date=${urlDate || new Date().toISOString()}`)
          .then(res => {
            const pro = res.data.professional;
            setSelectedUmpire(pro);
            setGameData(prev => ({ 
              ...prev, 
              umpireId: pro._id,
              date: urlDate ? new Date(urlDate).toISOString().split('T')[0] : prev.date,
              time: urlTime || prev.time
            }));
          })
          .catch(err => console.error("Error fetching professional details:", err));
      }
    }
  }, [step, searchParams, selectedGround, selectedUmpire]);

  const groundCost = gameData.groundPrice !== undefined ? gameData.groundPrice : (selectedGround?.pricePerHour || 0);
  const subTotal = groundCost + (selectedUmpire?.price || 0);
  const discountAmount = couponData?.discountAmount || 0;
  const platformFee = couponData ? couponData.platformFee : ((subTotal - discountAmount) * 0.015);
  const totalCost = couponData ? couponData.finalCost : ((subTotal - discountAmount) + platformFee);

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await axiosInstance.post("/api/hosted-game/validate-coupon", {
        code: couponCode,
        groundCost: groundCost,
        umpireCost: selectedUmpire?.price || 0
      });
      if (res.data.success) {
        setCouponData(res.data.coupon);
        toast.success("Coupon applied successfully");
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon code");
      setCouponData(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const initSlots = (sport) => {
    const defaults = SPORT_DEFAULTS[sport] || [{ role: "Player", count: 5 }];
    const slots = [];
    defaults.forEach(d => {
      for (let i = 0; i < d.count; i++) {
        slots.push({ role: d.role, status: "OPEN" });
      }
    });
    
    setGameData(prev => ({
      ...prev,
      gameType: sport,
      teamA: { ...prev.teamA, slots: [...slots] },
      teamB: { ...prev.teamB, slots: [...slots] }
    }));
  };

  const initQuickSlots = () => {
    const slots = [];
    // First slot is always the host
    slots.push({ role: 'Player', userId: user?._id, name: user?.name, profilePicture: user?.profilePicture, status: 'JOINED' });
    
    // Remaining slots are open
    for (let i = 1; i < gameData.quickPlayerCount; i++) {
      slots.push({ role: 'Player', status: 'OPEN' });
    }
    
    setGameData(prev => ({ ...prev, quickSlotsData: slots }));
    setStep(4.5);
  };

  const handleSlotSelection = (player) => {
    if (!activeSlotPicker) return;
    const { idx } = activeSlotPicker;
    
    const newSlots = [...gameData.quickSlotsData];
    if (player.isCustom) {
      newSlots[idx] = { 
        ...newSlots[idx], 
        customPlayer: { name: player.name || 'Guest', email: player.email },
        status: 'HELD' 
      };
    } else {
      newSlots[idx] = { 
        ...newSlots[idx], 
        userId: player._id, 
        name: player.name,
        profilePicture: player.profilePicture,
        status: 'HELD' 
      };
    }
    
    setGameData({ ...gameData, quickSlotsData: newSlots });
    setActiveSlotPicker(null);
  };

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const payload = {
        ...gameData,
        ...(gameData.gameMode === 'QUICK' ? {
          teamA: {
            ...gameData.teamA,
            name: 'Casual Pool'
          }
        } : {}),
        couponCode: couponData ? couponCode : undefined,
        customUmpireData: customUmpireData.name ? customUmpireData : undefined
      };
      const res = await axiosInstance.post("/api/hosted-game/create", payload);
      if (res.data.success) {
        // Send automated chat invites to invited users
        const invitedUserIds = [];
        if (gameData.gameMode === "QUICK") {
          gameData.quickSlotsData.forEach(slot => {
            if (slot.userId && slot.userId !== user?._id && slot.status === 'HELD') {
              invitedUserIds.push(slot.userId);
            }
          });
        } else {
          ['teamA', 'teamB'].forEach(teamKey => {
            gameData[teamKey].slots.forEach(slot => {
              if (slot.userId && slot.userId !== user?._id && slot.status === 'HELD') {
                invitedUserIds.push(slot.userId);
              }
            });
          });
        }
        
        if (invitedUserIds.length > 0) {
          const inviteLink = `${window.location.origin}/game/${res.data.game.id}`;
          const messageContent = `Hey! I've invited you to join a game. Click here to confirm your slot: ${inviteLink}`;
          try {
            await axiosInstance.post('/api/chat/message/broadcast', {
              content: messageContent,
              userIds: invitedUserIds
            });
          } catch(e) {
            console.error("Failed to send auto-invites in chat", e);
          }
        }

        setShowCoinAnim(true);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create game";
      toast.error(errorMsg);
      if (errorMsg.toLowerCase().includes("insufficient coins") || errorMsg.toLowerCase().includes("insufficient wallet balance")) {
        navigate("/wallet");
      }
    } finally {
      setLoading(false);
    }
  };

  const addSlot = (teamKey) => {
    const newSlots = [...gameData[teamKey].slots, { role: 'Player', status: 'OPEN' }];
    setGameData({ ...gameData, [teamKey]: { ...gameData[teamKey], slots: newSlots } });
  };

  const removeSlot = (teamKey, idx) => {
    const newSlots = gameData[teamKey].slots.filter((_, i) => i !== idx);
    setGameData({ ...gameData, [teamKey]: { ...gameData[teamKey], slots: newSlots } });
  };

  const updateSlotRole = (teamKey, idx, role) => {
    const newSlots = [...gameData[teamKey].slots];
    newSlots[idx].role = role;
    setGameData({ ...gameData, [teamKey]: { ...gameData[teamKey], slots: newSlots } });
  };

  const handleTeamImageUpload = (teamKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setGameData(prev => ({
        ...prev,
        [teamKey]: { ...prev[teamKey], image: ev.target.result, imageName: file.name }
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full bg-[#000] text-white pt-4 pb-4 px-3 sm:px-6">
      <div className={`max-w-4xl mx-auto transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Header */}
        <div className="hidden sm:flex items-center justify-between mb-4 gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] sm:text-3xl xl:text-4xl 2xl:text-5xl font-black mb-1 sm:mb-2 tracking-tight font-open-sans normal-case truncate">Host a Match</h1>
            <p className="text-xs sm:text-[20px] text-neutral-500 truncate sm:truncate-none sm:whitespace-normal whitespace-nowrap" style={SUBHEADING_STYLE}>Create a game and find players in your area</p>
          </div>
          <div className="hidden md:flex gap-2 shrink-0">
            {[1, 2, 3, 4, 5].map(s => (
              <div 
                key={s}
                className={`w-8 h-1.5 rounded-full transition-all duration-500 ${ step >= s ? 'bg-gradient-to-r from-[#BFF367] to-[#BFF367]' : 'bg-neutral-800' }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Game Mode Selection */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-3xl mx-auto py-2">


            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGameData({ ...gameData, gameMode: 'QUICK' })}
                className={`px-3 py-4 sm:px-8 sm:py-5 rounded-[8px] border-[1.5px] transition-all text-center flex flex-col items-center justify-center relative overflow-hidden ${ gameData.gameMode === 'QUICK' ? 'border-transparent shadow-[0_0_30px_rgba(85,222,232,0.1)]' : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700' }`}
                style={
                  gameData.gameMode === 'QUICK'
                  ? {
                      border: '1.5px solid transparent',
                      backgroundImage: 'linear-gradient(#0c0d0f, #0c0d0f), linear-gradient(90deg, #BFF367, #BFF367)',
                      backgroundClip: 'padding-box, border-box',
                      backgroundOrigin: 'border-box',
                    }
                  : {}
                }
              >
                <div className="flex flex-col items-center justify-center w-full">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-2.5 border transition-all duration-500 relative ${ gameData.gameMode === 'QUICK' ? 'border-transparent bg-neutral-900 text-white' : 'border-neutral-800 bg-neutral-900/50 text-neutral-500' }`}
                  style={
                    gameData.gameMode === 'QUICK'
                    ? {
                        border: '2px solid transparent',
                        backgroundImage: 'linear-gradient(#0c0d0f, #0c0d0f), linear-gradient(135deg, #BFF367, #BFF367, transparent, transparent)',
                        backgroundClip: 'padding-box, border-box',
                        backgroundOrigin: 'border-box',
                      }
                    : {}
                  }
                  >
                    <Zap className={`w-5 h-5 sm:w-6 sm:h-6 ${gameData.gameMode === 'QUICK' ? 'text-white animate-pulse' : 'text-neutral-500'}`} />
                  </div>
                  <h3 className={`text-xs sm:text-xl font-black mb-0 font-open-sans tracking-wide uppercase ${gameData.gameMode === 'QUICK' ? 'text-white' : 'text-neutral-400'}`}>QUICK GAME</h3>
                  <div className="hidden sm:block w-8 h-[2px] bg-neutral-800 my-2 rounded-full mx-auto" />
                  <p className="hidden sm:block text-[20px] text-neutral-400 leading-relaxed font-medium font-inter text-center">
                    One simple pool of players. No team split required. Best for casual matches or single-team practice.
                  </p>
                </div>
                {gameData.gameMode === 'QUICK' && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                    <CheckCircle2 className="text-[#BFF367] w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
              </button>

              <button
                onClick={() => setGameData({ ...gameData, gameMode: 'PROFESSIONAL' })}
                className={`px-3 py-4 sm:px-8 sm:py-5 rounded-[8px] border-[1.5px] transition-all text-center flex flex-col items-center justify-center relative overflow-hidden ${ gameData.gameMode === 'PROFESSIONAL' ? 'border-transparent shadow-[0_0_30px_rgba(85,222,232,0.15)]' : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700' }`}
                style={
                  gameData.gameMode === 'PROFESSIONAL'
                  ? {
                      border: '1.5px solid transparent',
                      backgroundImage: 'linear-gradient(#0c0d0f, #0c0d0f), linear-gradient(90deg, #BFF367, #BFF367)',
                      backgroundClip: 'padding-box, border-box',
                      backgroundOrigin: 'border-box',
                    }
                  : {}
                }
              >
                <div className="flex flex-col items-center justify-center w-full">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-2.5 border transition-all duration-500 relative ${ gameData.gameMode === 'PROFESSIONAL' ? 'border-transparent bg-neutral-900 text-white' : 'border-neutral-800 bg-neutral-900/50 text-neutral-500' }`}
                  style={
                    gameData.gameMode === 'PROFESSIONAL'
                    ? {
                        border: '2px solid transparent',
                        backgroundImage: 'linear-gradient(#0c0d0f, #0c0d0f), linear-gradient(135deg, #BFF367, #BFF367, transparent, transparent)',
                        backgroundClip: 'padding-box, border-box',
                        backgroundOrigin: 'border-box',
                      }
                    : {}
                  }
                  >
                    <ShieldCheck className={`w-5 h-5 sm:w-6 sm:h-6 ${gameData.gameMode === 'PROFESSIONAL' ? 'text-white animate-pulse' : 'text-neutral-500'}`} />
                  </div>
                  <h3 className={`text-xs sm:text-xl font-black mb-0 font-open-sans tracking-wide uppercase ${gameData.gameMode === 'PROFESSIONAL' ? 'text-white' : 'text-neutral-400'}`}>PROFESSIONAL</h3>
                  <div className="hidden sm:block w-8 h-[2px] bg-neutral-800 my-2 rounded-full mx-auto" />
                  <p className="hidden sm:block text-[20px] text-neutral-400 leading-relaxed font-medium font-inter text-center">
                    Two balanced teams (A vs B). Assign specific roles and define unique team identities.
                  </p>
                </div>
                {gameData.gameMode === 'PROFESSIONAL' && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                    <CheckCircle2 className="text-[#BFF367] w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
              </button>
            </div>


            {/* Step 2 integrated here */}
            {gameData.gameMode && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-8 border-t border-white/10 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-[3px] h-[18px] bg-gradient-to-b from-cyan-400 to-lime-400 rounded-full" />
                <label className="text-xs font-bold text-white uppercase tracking-widest block">Select Sport</label>
              </div>

              {/* Dropdown Toggle Button */}
              <button
                onClick={() => setIsSportDropdownOpen(!isSportDropdownOpen)}
                className="w-full flex items-center justify-between bg-[#000] border border-neutral-800/80 hover:border-cyan-400/60 rounded-[8px] py-4 px-4 text-sm font-bold transition-all text-white mb-3"
              >
                <div className="flex items-center gap-3">
                  {gameData.gameType ? (
                    <>
                      <div className="w-6 h-6 flex items-center justify-center">
                        {SPORT_ICONS[gameData.gameType]}
                      </div>
                      <span>{gameData.gameType}</span>
                    </>
                  ) : (
                    <>
                      <Trophy size={18} className="text-cyan-400" />
                      <span className="text-neutral-500">Select a Sport</span>
                    </>
                  )}
                </div>
                <ChevronDown size={16} className={`text-neutral-500 transition-transform duration-300 ${isSportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isSportDropdownOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {Object.keys(SPORT_DEFAULTS).map(sport => (
                        <div 
                          key={sport}
                          className={`rounded-[8px] p-[1.5px] transition-all duration-300 ${ gameData.gameType === sport ? 'bg-gradient-to-b from-cyan-400 to-lime-400 shadow-[0_0_15px_rgba(6,182,212,0.12)] scale-[1.015]' : 'bg-neutral-800/40 hover:bg-neutral-700/40' }`}
                        >
                          <button
                            onClick={() => {
                              initSlots(sport);
                              setIsSportDropdownOpen(false);
                            }}
                            className={`w-full bg-[#000] rounded-[8px] p-4 flex flex-col items-center justify-center gap-2 relative transition-all duration-300 group overflow-hidden ${ gameData.gameType === sport ? '' : 'hover:bg-neutral-900/60' }`}
                          >
                      {/* Diagonal Corner Hover Glow Effects (Only when selected) */}
                      {gameData.gameType === sport && (
                        <>
                          <div className="absolute top-0 left-0 w-24 h-24 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.22),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tl-[14px]" />
                          <div className="absolute bottom-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_bottom_right,rgba(163,230,53,0.22),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-br-[14px]" />
                        </>
                      )}
                      
                      <div className="w-16 h-16 rounded-full border border-neutral-800 flex items-center justify-center transition-colors group-hover:border-neutral-750 bg-black/40 z-10">
                        {SPORT_ICONS[sport] || <Trophy className="text-neutral-500 w-8 h-8" />}
                      </div>
                      
                      <div className="flex flex-col items-center z-10">
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${ gameData.gameType === sport ? 'text-white' : 'text-neutral-400 group-hover:text-white' }`}>
                          {sport}
                        </span>
                        {gameData.gameType === sport && (
                          <div className="w-5 h-[2px] bg-gradient-to-r from-cyan-400 to-lime-400 mt-1.5 rounded-full" />
                        )}
                      </div>
                      
                      {gameData.gameType === sport && (
                        <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-cyan-400 to-lime-400 text-black rounded-full p-0.5 flex items-center justify-center w-4 h-4 shadow-[0_0_10px_rgba(6,182,212,0.35)] z-10">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" className="w-2.5 h-2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-[3px] h-[18px] bg-gradient-to-b from-cyan-400 to-lime-400 rounded-full" />
                  <label className="text-xs font-bold text-white uppercase tracking-widest block">Date & Time</label>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDateTimePicker(true)}
                    className="w-full flex items-center justify-between bg-[#000] border border-neutral-800/80 hover:border-cyan-400/60 rounded-[8px] py-4 px-4 text-sm font-bold transition-all text-white"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-cyan-400" />
                      <span className={(gameData.date && gameData.time) ? 'text-white' : 'text-neutral-500'}>
                        {displayFullDateTime()}
                      </span>
                    </div>
                    <ChevronDown size={16} className="text-neutral-500" />
                  </button>

                  <MaterialDateTimePicker 
                    isOpen={showDateTimePicker}
                    onClose={() => setShowDateTimePicker(false)}
                    initialDate={gameData.date || null}
                    initialTime={gameData.time || null}
                    onSelect={(date, time) => {
                      setGameData({ ...gameData, date, time });
                    }}
                  />
                </div>
              </section>
            </div>

              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-[3px] h-[18px] bg-gradient-to-b from-cyan-400 to-lime-400 rounded-full" />
                  <label className="text-xs font-bold text-white uppercase tracking-widest block">Location (State & City)</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* State Dropdown */}
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-[18px] text-cyan-400 pointer-events-none z-10" size={18} />
                    <button
                      onClick={() => !loadingStates && setIsStateDropdownOpen(!isStateDropdownOpen)}
                      disabled={loadingStates}
                      className="w-full bg-[#000] border border-neutral-800/80 hover:border-cyan-400/60 rounded-[8px] py-4 pl-12 pr-10 text-left text-sm text-white outline-none transition-all font-bold disabled:opacity-50 flex items-center justify-between"
                    >
                      <span className="truncate">{loadingStates ? 'Loading...' : gameData.state || 'Select State'}</span>
                      <ChevronDown className={`text-neutral-500 transition-transform duration-300 ${isStateDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                    </button>
                    
                    <AnimatePresence>
                      {isStateDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-[#0c0c0c] border border-neutral-800 rounded-[8px] z-[60] shadow-xl flex flex-col"
                        >
                          <div className="p-3 border-b border-neutral-800 sticky top-0 bg-[#0c0c0c] z-10 rounded-t-[8px]">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                              <input
                                type="text"
                                placeholder="Search state..."
                                value={stateSearch}
                                onChange={(e) => setStateSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-[6px] py-2 pl-9 pr-3 text-sm text-white focus:border-cyan-400/50 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar rounded-b-[8px]">
                            {states.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map(s => (
                              <div 
                                key={s}
                                onClick={() => {
                                  setGameData({ ...gameData, state: s, city: '' });
                                  setIsStateDropdownOpen(false);
                                  setStateSearch('');
                                }}
                                className={`px-4 py-3 text-sm cursor-pointer transition-colors ${gameData.state === s ? 'text-cyan-400 bg-cyan-400/10' : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'}`}
                              >
                                {s}
                              </div>
                            ))}
                            {states.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
                              <div className="px-4 py-4 text-sm text-neutral-500 text-center">No states found</div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* City Dropdown */}
                  <div className="relative group">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-[18px] text-cyan-400 w-[18px] h-[18px] pointer-events-none z-10">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="9" y1="22" x2="9" y2="16" />
                      <line x1="15" y1="22" x2="15" y2="16" />
                      <line x1="9" y1="16" x2="15" y2="16" />
                      <path d="M9 6h.01M15 6h.01M9 10h.01M15 10h.01" />
                    </svg>
                    <button
                      onClick={() => !(!gameData.state || loadingCities) && setIsCityDropdownOpen(!isCityDropdownOpen)}
                      disabled={!gameData.state || loadingCities}
                      className="w-full bg-[#000] border border-neutral-800/80 hover:border-cyan-400/60 rounded-[8px] py-4 pl-12 pr-10 text-left text-sm text-white outline-none transition-all font-bold disabled:opacity-50 flex items-center justify-between"
                    >
                      <span className="truncate">{loadingCities ? 'Loading cities...' : !gameData.state ? 'Select state first' : gameData.city || 'Select City'}</span>
                      <ChevronDown className={`text-neutral-500 transition-transform duration-300 ${isCityDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                    </button>
                    
                    <AnimatePresence>
                      {isCityDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-[#0c0c0c] border border-neutral-800 rounded-[8px] z-[60] shadow-xl flex flex-col"
                        >
                          <div className="p-3 border-b border-neutral-800 sticky top-0 bg-[#0c0c0c] z-10 rounded-t-[8px]">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                              <input
                                type="text"
                                placeholder="Search city..."
                                value={citySearch}
                                onChange={(e) => setCitySearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-[6px] py-2 pl-9 pr-3 text-sm text-white focus:border-cyan-400/50 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar rounded-b-[8px]">
                            {cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map(c => (
                              <div 
                                key={c}
                                onClick={() => {
                                  setGameData({ ...gameData, city: c });
                                  setIsCityDropdownOpen(false);
                                  setCitySearch('');
                                }}
                                className={`px-4 py-3 text-sm cursor-pointer transition-colors ${gameData.city === c ? 'text-cyan-400 bg-cyan-400/10' : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'}`}
                              >
                                {c}
                              </div>
                            ))}
                            {cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && (
                              <div className="px-4 py-4 text-sm text-neutral-500 text-center">No cities found</div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>
            
            <div className="flex gap-4 pt-4 mt-4">
              <button 
                onClick={() => navigate(-1)} 
                className="flex-1 py-3 sm:py-3.5 bg-neutral-900/60 text-neutral-400 font-bold rounded-[8px] sm:rounded-[8px] border border-neutral-800 hover:border-neutral-700 transition-all duration-300 text-sm sm:text-base font-open-sans uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!gameData.gameMode || !gameData.gameType || !gameData.date || !gameData.time || !gameData.city || !gameData.state}
                className="flex-[2] py-3.5 sm:py-4 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black rounded-[8px] sm:rounded-[8px] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-sm sm:text-base font-open-sans shadow-[0_10px_25px_rgba(191,243,103,0.15)] uppercase tracking-wider disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
              >
                CONTINUE
              </button>
            </div>

            </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 3: Grounds & Umpires */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              {/* Grounds */}
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Select Ground</label>
                  <span className="text-[10px] text-neutral-500 font-black px-3 py-1 bg-neutral-800 rounded-full uppercase tracking-tighter">Optional</span>
                </div>
                
                {selectedGround ? (
                  <div className="p-5 rounded-[8px] border-2 border-yellow-500 bg-yellow-500/10">
                    <div className="flex gap-5">
                      <img src={selectedGround.images?.[0] || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-[8px] object-cover" />
                      <div className="flex-1">
                        <h3 className="font-black text-base mb-1 tracking-tight">{selectedGround.name}</h3>
                        <p className="flex text-[11px] text-neutral-500 mb-3 items-center gap-1 font-medium">
                          <MapPin size={12} /> {selectedGround.location}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {gameData.date && (
                            <span className="px-2 py-1 bg-neutral-800 rounded text-[10px] text-cyan-400 font-bold uppercase">
                              {new Date(gameData.date).toLocaleDateString()}
                            </span>
                          )}
                          {gameData.time && (
                            <span className="px-2 py-1 bg-neutral-800 rounded text-[10px] text-lime-400 font-bold uppercase">
                              {gameData.time}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-yellow-500 font-black text-sm">₹{gameData.groundPrice !== undefined ? gameData.groundPrice : selectedGround.pricePerHour}</span>
                          <button 
                            onClick={() => {
                              setSelectedGround(null);
                              setGameData({ ...gameData, groundId: null });
                            }}
                            className="px-4 py-2 bg-neutral-800 text-white rounded-[6px] text-xs font-black uppercase tracking-widest hover:bg-neutral-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      sessionStorage.setItem('hostGameData', JSON.stringify(gameData));
                      navigate(`/venues?returnTo=${encodeURIComponent(`/host-game?step=3&city=${gameData.city}&state=${gameData.state}`)}`);
                    }}
                    className="w-full py-6 rounded-[8px] border-2 border-dashed border-neutral-700 hover:border-cyan-400 bg-neutral-900/50 hover:bg-cyan-400/5 flex flex-col items-center justify-center gap-3 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-neutral-800 group-hover:bg-cyan-400/20 flex items-center justify-center text-neutral-400 group-hover:text-cyan-400 transition-colors">
                      <MapPin size={24} />
                    </div>
                    <span className="font-black text-sm uppercase tracking-widest text-neutral-300 group-hover:text-white">Book Venue</span>
                  </button>
                )}
              </section>


            </div>

            {/* Pricing / Quick Settings Section */}
            {gameData.gameMode === 'QUICK' ? (
              <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-[8px] p-5 sm:p-6 shadow-xl shadow-black/30 mb-6">
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-[3px] h-[16px] bg-gradient-to-b from-[#BFF367] to-[#BFF367] rounded-full" />
                      <h3 className="text-xs font-black uppercase text-white tracking-wider">Quick Game Settings</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 bg-neutral-950/60 p-3 rounded-[8px] border border-neutral-850 justify-between">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Total Players</span>
                          <span className="text-[8px] text-neutral-500 font-medium">Pool including you</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setGameData(prev => ({ ...prev, quickPlayerCount: Math.max(2, prev.quickPlayerCount - 1) }))}
                            className="w-8 h-8 rounded-full bg-neutral-900 border border-[#BFF367]/20 text-[#BFF367] flex items-center justify-center hover:bg-[#BFF367]/10 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-lg font-black text-white w-6 text-center select-none tabular-nums">
                            {gameData.quickPlayerCount || 2}
                          </span>
                          <button 
                            type="button"
                            onClick={() => setGameData(prev => ({ ...prev, quickPlayerCount: Math.min(22, prev.quickPlayerCount + 1) }))}
                            className="w-8 h-8 rounded-full bg-neutral-900 border border-[#BFF367]/20 text-[#BFF367] flex items-center justify-center hover:bg-[#BFF367]/10 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 bg-neutral-950/60 p-3 rounded-[8px] border border-neutral-850 justify-between">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Entry Fee</span>
                          <span className="text-[8px] text-neutral-500 font-medium">Per player (₹)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-neutral-900 p-1.5 px-3 rounded-[6px] border border-neutral-800 focus-within:border-[#BFF367] transition-all">
                          <Coins className="text-[#BFF367]" size={14} />
                          <input 
                            type="number"
                            placeholder="0"
                            value={gameData.perPlayerCharge || ''}
                            onChange={(e) => setGameData({ ...gameData, perPlayerCharge: parseInt(e.target.value) || 0 })}
                            className="w-16 bg-transparent border-none text-right font-black text-sm outline-none focus:ring-0 text-white p-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center py-2.5 px-3 bg-[#BFF367]/5 border border-[#BFF367]/10 rounded-[8px] mt-4 md:mt-0">
                    <span className="text-[9px] font-black text-[#BFF367] uppercase tracking-widest">
                      You + {gameData.quickPlayerCount - 1} Players Pool
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-900 p-8 rounded-[8px] border-2 border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
                <div className="space-y-1">
                  <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Entry Charge per Player</span>
                  <p className="text-[11px] text-neutral-500 font-medium italic">Recommended: Total Cost ({totalCost}) / Total Players</p>
                </div>
                <div className="flex items-center gap-4 bg-black p-2 rounded-[8px] border border-neutral-800">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-[8px] flex items-center justify-center">
                    <Coins className="text-yellow-500" size={24} />
                  </div>
                  <input 
                    type="number"
                    value={gameData.perPlayerCharge}
                    onChange={(e) => setGameData({ ...gameData, perPlayerCharge: parseInt(e.target.value) || 0 })}
                    className="w-24 bg-transparent border-none text-center font-black text-2xl outline-none focus:ring-0"
                  />
                </div>
              </div>
            )}

             <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)} 
                className="flex-1 py-3 sm:py-3.5 bg-neutral-900/60 text-neutral-400 font-bold rounded-[8px] sm:rounded-[8px] border border-neutral-800 hover:border-neutral-700 transition-all duration-300 text-sm sm:text-base font-open-sans uppercase tracking-wider"
              >
                Back
              </button>
              {gameData.gameMode === 'QUICK' ? (
                <button
                  disabled={gameData.quickPlayerCount < 2}
                  onClick={initQuickSlots}
                  className="flex-[2] py-3 sm:py-3.5 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black rounded-[8px] sm:rounded-[8px] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-sm sm:text-base font-open-sans shadow-[0_10px_25px_rgba(85,222,232,0.25)] disabled:opacity-50 uppercase tracking-wider"
                >
                  SETUP SLOTS
                </button>
              ) : (
                <button
                  onClick={() => setStep(4)}
                  className="flex-[2] py-3 sm:py-3.5 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black rounded-[8px] sm:rounded-[8px] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-sm sm:text-base font-open-sans shadow-[0_10px_25px_rgba(85,222,232,0.25)] uppercase tracking-wider"
                >
                  Continue
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Setup (Professional) */}

        {/* Step 4.5: Quick Slot Setup */}
        {step === 4.5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <h2 className="text-4xl font-black tracking-tight">Manage Slots</h2>
                <p className="hidden sm:block text-neutral-500 font-medium italic">Assign players to slots or leave them open for the community</p>
              </div>
              <button 
                onClick={() => {
                  setFillingTeamKey('quick');
                  setShowTeamFillModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#BFF367]/10 border border-[#BFF367]/20 rounded-[8px] text-[#BFF367] font-black text-[10px] uppercase tracking-widest hover:bg-gradient-to-r hover:from-[#BFF367] hover:to-[#BFF367] hover:text-black transition-all"
              >
                <ShieldCheck size={14} /> Fill <span className="hidden sm:inline">from My </span>Team
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {gameData.quickSlotsData.map((slot, idx) => (
                <div 
                  key={idx}
                  onClick={() => idx !== 0 && setActiveSlotPicker({ idx })}
                  className={`relative p-1 sm:p-4 rounded-[8px] border-2 transition-all cursor-pointer group flex flex-col items-center justify-center text-center h-28 sm:h-36 ${ slot.userId || slot.customPlayer ? 'border-[#BFF367]/30 bg-[#BFF367]/5' : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700' }`}
                >
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-[8px] flex items-center justify-center mb-1 sm:mb-2 transition-transform duration-500 group-hover:scale-110 overflow-hidden ${ slot.userId || slot.customPlayer ? 'border-2 border-[#BFF367] bg-neutral-900' : 'bg-neutral-800 text-neutral-500' }`}>
                    {slot.profilePicture ? (
                      <img src={slot.profilePicture} alt={slot.name} className="w-full h-full object-cover" />
                    ) : (slot.userId && user?._id && slot.userId === user._id) ? (
                      user?.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xl font-black bg-[#BFF367] text-black w-full h-full flex items-center justify-center">
                          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )
                    ) : (slot.userId || slot.customPlayer) ? (
                      <div className="text-xl font-black bg-[#BFF367] text-black w-full h-full flex items-center justify-center">
                        {(slot.name || slot.customPlayer?.name || '?').charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <Plus size={28} />
                    )}
                  </div>
                  
                  <div className="space-y-0.5 sm:space-y-1 w-full">
                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-500">Slot {idx + 1}</p>
                    <h4 className="font-black truncate w-full px-1 sm:px-2 text-[10px] sm:text-base leading-tight">
                      {(slot.userId && user?._id && slot.userId === user._id) ? (user?.name || "You (Host)") : (slot.name || slot.customPlayer?.name || slot.customPlayer?.email || "Open Slot")}
                    </h4>
                  </div>

                  {idx !== 0 && (slot.userId || slot.customPlayer) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSlots = [...gameData.quickSlotsData];
                        newSlots[idx] = { role: 'Player', status: 'OPEN' };
                        setGameData({ ...gameData, quickSlotsData: newSlots });
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {idx === 0 && (
                    <div className="absolute top-4 right-4 text-[#BFF367]">
                      <CheckCircle2 size={16} />
                    </div>
                  )}

                  {slot.customPlayer && (
                    <div className="absolute bottom-4 right-4 text-neutral-600">
                      <Mail size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 max-w-lg mx-auto w-full">
              <button onClick={() => setStep(3)} className="flex-1 py-3 sm:py-3.5 bg-neutral-900 text-neutral-400 font-black rounded-[8px] border-2 border-neutral-800 hover:border-neutral-700 transition-all text-sm sm:text-base uppercase tracking-widest">BACK</button>
              <button
                onClick={() => setStep(5)}
                className="flex-[2] py-3 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black rounded-[8px] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-sm font-open-sans shadow-[0_10px_25px_rgba(85,222,232,0.25)] uppercase tracking-widest"
              >
                PREVIEW MATCH
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Team Configuration (Professional Only) */}
        {step === 4 && gameData.gameMode === 'PROFESSIONAL' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            {/* Team Selection Tabs */}
            <div className="flex p-1 bg-neutral-900/50 border border-neutral-800 rounded-[8px] max-w-sm mx-auto mb-6">
              {['teamA', 'teamB'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTeamTab(tab)}
                  className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[6px] transition-all relative ${
                    activeTeamTab === tab ? 'text-black' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  {activeTeamTab === tab && (
                    <motion.div
                      layoutId="activeTeamTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-[#BFF367] to-[#BFF367] rounded-[6px]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{tab === 'teamA' ? 'Team A' : 'Team B'}</span>
                </button>
              ))}
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-[8px] p-4 sm:p-6 overflow-hidden">
              <AnimatePresence mode="wait">
                {[activeTeamTab].map((teamKey) => (
                  <motion.div
                    key={teamKey}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {/* Team Header */}
                    <div className="flex items-center justify-between gap-5">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-[8px] flex items-center justify-center font-black text-2xl overflow-hidden ${teamKey === 'teamA' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                          {gameData[teamKey].logo ? (
                            <img src={gameData[teamKey].logo} alt="Team Logo" className="w-full h-full object-cover" />
                          ) : (
                            teamKey === 'teamA' ? 'A' : 'B'
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Team Name</label>
                          <input 
                            className="bg-transparent text-2xl font-black border-none outline-none focus:ring-0 w-full p-0 tracking-tight"
                            placeholder={teamKey === 'teamA' ? 'Enter Home Team Name' : 'Enter Away Team Name'}
                            value={gameData[teamKey].name}
                            onChange={(e) => setGameData({
                              ...gameData,
                              [teamKey]: { ...gameData[teamKey], name: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setFillingTeamKey(teamKey);
                          setShowTeamFillModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-[#BFF367] to-[#BFF367] rounded-[8px] text-black font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
                        title="Add Team"
                      >
                        Add Team
                      </button>
                    </div>

                    {/* Team Image Upload */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">Card Background Image</label>

                      {/* Preview + Upload Row */}
                      <div className="flex items-center gap-4">
                        {/* Preview */}
                        <div className="relative w-28 h-18 shrink-0 rounded-[8px] overflow-hidden border border-white/10 bg-neutral-900" style={{ height: '70px' }}>
                          <img
                            src={gameData[teamKey].image}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>

                        {/* Upload button */}
                        <label
                          htmlFor={`img-upload-${teamKey}`}
                          className="flex-1 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#BFF367]/30 rounded-[8px] cursor-pointer hover:border-[#BFF367]/60 hover:bg-[#BFF367]/5 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#BFF367]/10 border border-[#BFF367]/20 flex items-center justify-center group-hover:bg-[#BFF367]/20 transition-all">
                            <ImageIcon size={16} className="text-[#BFF367] group-hover:text-[#BFF367] transition-colors" />
                          </div>
                          <span className="text-[10px] font-black bg-gradient-to-r from-[#BFF367] to-[#BFF367] bg-clip-text text-transparent uppercase tracking-widest">
                            {gameData[teamKey].imageName ? 'Change Photo' : 'Upload Photo'}
                          </span>
                          {gameData[teamKey].imageName && (
                            <span className="text-[8px] text-white/30 truncate max-w-[120px]">{gameData[teamKey].imageName}</span>
                          )}
                          <input
                            id={`img-upload-${teamKey}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleTeamImageUpload(teamKey, e)}
                          />
                        </label>
                      </div>

                      {/* Quick-select presets */}
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Or choose a preset</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {MOCK_TEAM_IMAGES.map((img) => (
                            <button
                              key={img.url}
                              onClick={() => setGameData(prev => ({ ...prev, [teamKey]: { ...prev[teamKey], image: img.url, imageName: null } }))}
                              className={`relative rounded-[8px] overflow-hidden border-2 transition-all shrink-0 w-20 aspect-video ${ gameData[teamKey].image === img.url ? 'border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.3)]' : 'border-transparent hover:border-white/20' }`}
                            >
                              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                              {gameData[teamKey].image === img.url && (
                                <div className="absolute inset-0 bg-[#CCFF00]/20 flex items-center justify-center">
                                  <CheckCircle2 size={14} className="text-[#CCFF00]" />
                                </div>
                              )}
                              <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-[6px] font-black text-white text-center py-0.5 uppercase">{img.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Slots */}
                    <div className="space-y-3">
                      {gameData[teamKey].slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-3 group">
                          <div className={`flex-1 flex items-center gap-4 bg-neutral-900 border ${slot.userId || slot.customPlayer ? 'border-[#CCFF00]/50 bg-[#CCFF00]/5' : 'border-neutral-800'} p-4 rounded-[8px] group-hover:border-[#CCFF00]/30 transition-all`}>
                            <input 
                              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none w-full"
                              value={slot.role}
                              onChange={(e) => updateSlotRole(teamKey, idx, e.target.value)}
                            />
                            {slot.userId || slot.customPlayer ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[150px]">
                                      {slot.name || slot.customPlayer?.name || slot.customPlayer?.email}
                                    </span>
                                    <span className="text-[9px] font-black text-black uppercase tracking-tighter bg-[#CCFF00] px-2 py-1 rounded shrink-0">FILLED</span>
                                </div>
                            ) : (
                                <span className="text-[9px] font-black text-neutral-600 uppercase tracking-tighter bg-neutral-800 px-2 py-1 rounded shrink-0">OPEN</span>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                                if (slot.userId || slot.customPlayer) {
                                    const newSlots = [...gameData[teamKey].slots];
                                    newSlots[idx] = { role: slot.role, status: 'OPEN' };
                                    setGameData({ ...gameData, [teamKey]: { ...gameData[teamKey], slots: newSlots } });
                                } else {
                                    removeSlot(teamKey, idx);
                                }
                            }}
                            className="p-3 text-neutral-600 hover:text-red-500 transition-colors bg-neutral-900 rounded-[8px] border border-neutral-800 shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addSlot(teamKey)}
                      className="w-full py-4 border-2 border-dashed border-neutral-800 rounded-[8px] text-neutral-500 text-xs font-black uppercase tracking-widest hover:border-[#CCFF00]/30 hover:text-[#CCFF00] transition-all flex items-center justify-center gap-2 bg-neutral-900/30"
                    >
                      <Plus size={16} /> Add More Slots
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>


            <div className="flex gap-4">
              <button onClick={() => setStep(3)} className="flex-1 py-5 bg-neutral-900 text-neutral-400 font-black rounded-[8px] border-2 border-neutral-800 hover:border-neutral-700 transition-all text-lg uppercase tracking-widest">Back</button>
              <button
                onClick={() => setStep(5)}
                className="flex-[2] py-5 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black rounded-[8px] hover:scale-[1.01] active:scale-[0.99] transition-all text-lg shadow-[0_20px_40px_rgba(85,222,232,0.25)] font-open-sans uppercase tracking-wider"
              >
                PREVIEW MATCH
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Preview & Finalize */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 max-w-xl mx-auto pb-24">
            
            {/* Header Section */}
            <div className="text-center space-y-3 pb-6 border-b border-neutral-800">
              <span className="bg-[#BFF367]/10 text-[#BFF367] text-[10px] font-black px-3 py-1 rounded-[4px] uppercase tracking-widest font-inter inline-block border border-[#BFF367]/20">
                {gameData.gameMode === 'QUICK' ? 'Quick Game' : 'Professional Match'}
              </span>
              <h2 className="text-3xl font-black tracking-tight font-open-sans uppercase text-white">{gameData.gameType} Battle</h2>
              <div className="flex justify-center items-center gap-4 text-neutral-400 font-bold text-xs uppercase tracking-widest font-inter">
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#BFF367]" /> {gameData.date}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#BFF367]" /> {gameData.time}</span>
              </div>
            </div>

            {/* Venue Details */}
            <div className="bg-neutral-900/40 border border-neutral-800 p-4 sm:p-5 rounded-[8px] flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-neutral-800/80 rounded-[6px] flex items-center justify-center shrink-0 border border-neutral-700/50">
                <MapPin className="text-[#BFF367] w-6 h-6" />
              </div>
              <div className="min-w-0 w-full text-left flex-1">
                <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mb-1 font-inter">Selected Venue</p>
                <p className="font-black text-sm sm:text-base text-white truncate leading-none font-open-sans uppercase">{selectedGround?.name || 'Self-Arranged'}</p>
                <p className="text-xs text-neutral-500 mt-1.5 font-medium italic font-inter truncate">{selectedGround?.location || 'Location to be decided'}</p>
              </div>
            </div>

            {/* Match Setup Details */}
            {gameData.gameMode === 'QUICK' ? (
              <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-[8px] flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mb-1 font-inter">Player Slots</p>
                  <p className="font-black text-sm sm:text-base text-white uppercase font-open-sans">Single Pool Match</p>
                </div>
                <div className="flex items-center -space-x-2">
                  {Array.from({ length: Math.min(gameData.quickPlayerCount, 5) }).map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center text-[#BFF367]">
                      <Users size={14} />
                    </div>
                  ))}
                  {gameData.quickPlayerCount > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-[#BFF367] text-black flex items-center justify-center text-[10px] font-black font-inter">
                      +{gameData.quickPlayerCount - 5}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6 bg-neutral-900/40 border border-neutral-800 rounded-[8px] gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-[8px] bg-neutral-800 overflow-hidden border border-neutral-700/50 shadow-lg">
                     <img src={gameData.teamA.image || 'https://api.dicebear.com/7.x/initials/svg?seed=A'} alt="Team A" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider font-open-sans text-center truncate w-[80px]">{gameData.teamA.name || 'Team A'}</span>
                </div>
                
                <div className="px-4 py-2 bg-neutral-900/80 rounded-[4px] border border-neutral-800 text-xs font-black text-neutral-500 uppercase tracking-widest italic font-inter">VS</div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-[8px] bg-neutral-800 overflow-hidden border border-neutral-700/50 shadow-lg">
                     <img src={gameData.teamB.image || 'https://api.dicebear.com/7.x/initials/svg?seed=B'} alt="Team B" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider font-open-sans text-center truncate w-[80px]">{gameData.teamB.name || 'Team B'}</span>
                </div>
              </div>
            )}

            {/* Entry Fee */}
            {gameData.perPlayerCharge > 0 && (
               <div className="bg-neutral-900/40 border border-neutral-800 p-4 sm:p-5 rounded-[8px] flex items-center justify-between">
                 <div className="text-left">
                   <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mb-1 font-inter">Entry Charge</p>
                   <p className="font-black text-sm text-white uppercase font-open-sans">Per Player</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <Coins size={16} className="text-yellow-500" />
                    <span className="font-black text-lg text-yellow-500 font-open-sans">₹{gameData.perPlayerCharge}</span>
                 </div>
               </div>
            )}

            {/* Billing Summary & Coupon */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-[8px] overflow-hidden">
              <div className="p-5 border-b border-neutral-800/50 flex items-center gap-3 bg-neutral-800/20">
                 <Receipt className="text-[#BFF367] w-5 h-5" />
                 <h3 className="text-sm font-black uppercase tracking-widest text-white font-open-sans">Checkout Summary</h3>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="space-y-3 text-sm font-medium text-neutral-400 font-inter">
                  <div className="flex justify-between items-center">
                    <span>Venue Cost</span>
                    <span className="text-white font-bold">{subTotal} coins</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-[#BFF367]">
                      <span>Discount Applied</span>
                      <span className="font-bold">-{discountAmount} coins</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Platform Fee (1.5%)</span>
                    <span className="text-white font-bold">{platformFee.toFixed(2)} coins</span>
                  </div>
                </div>

                {/* Coupon Input */}
                <div className="pt-4 border-t border-neutral-800/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!couponData}
                      className="flex-1 bg-black border border-neutral-800 rounded-[6px] px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#BFF367] uppercase tracking-wider disabled:opacity-50 transition-colors"
                    />
                    {!couponData ? (
                      <button
                        onClick={handleValidateCoupon}
                        disabled={applyingCoupon || !couponCode}
                        className="px-6 py-3 bg-neutral-800 text-white font-black rounded-[6px] text-xs uppercase tracking-widest hover:bg-neutral-700 disabled:opacity-50 transition-all font-inter"
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    ) : (
                      <button
                        onClick={() => { setCouponData(null); setCouponCode(''); setCouponError(''); }}
                        className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-[6px] text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all font-inter"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-red-500 text-[10px] uppercase font-black tracking-widest mt-2">{couponError}</p>}
                  {couponData && <p className="text-[#BFF367] text-[10px] uppercase font-black tracking-widest mt-2">Coupon applied successfully!</p>}
                </div>
              </div>

              {/* Total Box */}
              <div className="bg-[#BFF367] p-5 flex justify-between items-center">
                 <div>
                   <p className="text-[10px] text-black/70 font-black uppercase tracking-widest font-inter mb-0.5">Total Amount</p>
                   <p className="text-xs text-black/70 font-bold font-inter italic">To be reserved from wallet</p>
                 </div>
                 <div className="flex items-center gap-2 text-black">
                   <Coins size={24} className="text-black" />
                   <span className="font-black text-3xl font-open-sans tracking-tight">{totalCost.toFixed(2)}</span>
                 </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setStep(gameData.gameMode === 'QUICK' ? 4.5 : 4)} 
                className="flex-[0.8] py-4 bg-neutral-900 text-neutral-400 font-black rounded-[8px] border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all text-sm uppercase tracking-widest font-open-sans"
              >
                Back
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="flex-[2] py-4 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black rounded-[8px] hover:scale-[1.01] active:scale-[0.99] transition-all text-base sm:text-lg font-open-sans uppercase tracking-widest shadow-[0_15px_30px_rgba(191,243,103,0.2)] flex justify-center items-center gap-3"
              >
                CONFIRM <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

      </div>

      <AnimatePresence>
        {showTeamFillModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTeamFillModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="relative bg-[#0a0a0a] border border-neutral-800 p-8 rounded-[8px] max-w-md w-full shadow-2xl overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 blur-[100px] rounded-full" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-[8px] flex items-center justify-center">
                  <ShieldCheck size={24} className="text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Fill from Team</h2>
                  <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Bulk slot assignment</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {myTeams.length > 0 ? myTeams.map(team => (
                  <div 
                    key={team._id}
                    onClick={() => handleFillFromTeam(team)}
                    className="p-4 bg-neutral-900 border border-white/5 rounded-[8px] flex items-center justify-between group hover:border-yellow-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[8px] bg-neutral-800 border border-white/5 overflow-hidden">
                        <img src={team.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${team.name}`} alt={team.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm group-hover:text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367] to-[#BFF367] transition-colors">{team.name}</h4>
                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{team.members?.length || 0} Members</p>
                      </div>
                    </div>
                    <div className="p-2 bg-gradient-to-r from-[#BFF367]/10 to-[#BFF367]/10 rounded-lg text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367] to-[#BFF367] group-hover:bg-gradient-to-r from-[#BFF367] to-[#BFF367] group-hover:text-black transition-all">
                      <Plus size={16} />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 space-y-4 bg-neutral-900/50 rounded-[8px] border border-dashed border-neutral-800">
                    <ShieldAlert className="mx-auto text-neutral-700" size={48} />
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500 font-medium italic">No teams found in your profile</p>
                      <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Create a team in the My Teams section first</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest text-center px-4">
                  Note: This will fill empty slots with team members. Host slot will not be overwritten.
                </p>
                <button 
                  onClick={() => setShowTeamFillModal(false)}
                  className="w-full py-4 bg-neutral-800 rounded-[8px] font-black text-xs uppercase tracking-widest text-neutral-400 hover:bg-neutral-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      {/* Slot Picker Popup */}
      <SlotPickerPopup
        isOpen={!!activeSlotPicker}
        onClose={() => setActiveSlotPicker(null)}
        onSelect={handleSlotSelection}
        gameId={null} // Draft mode
        slotId={activeSlotPicker?.idx}
      />

      <AnimatePresence>
        {showCustomUmpireModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCustomUmpireModal(false)} 
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 30 }} 
              className="relative bg-[#0a0a0a] border border-neutral-800 p-8 rounded-[8px] max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-r from-[#BFF367]/10 to-[#BFF367]/10 blur-[100px] rounded-full" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-[8px] flex items-center justify-center">
                  <UserCheck size={24} className="text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Add Custom Umpire</h2>
                  <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Inviting off-platform</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text"
                    placeholder="Enter umpire name"
                    value={customUmpireData.name}
                    onChange={(e) => setCustomUmpireData({ ...customUmpireData, name: e.target.value })}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-[8px] py-4 px-6 text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email"
                    placeholder="name@example.com"
                    value={customUmpireData.email}
                    onChange={(e) => setCustomUmpireData({ ...customUmpireData, email: e.target.value })}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-[8px] py-4 px-6 text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                  <input 
                    type="tel"
                    placeholder="Enter phone number"
                    value={customUmpireData.phone}
                    onChange={(e) => setCustomUmpireData({ ...customUmpireData, phone: e.target.value })}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-[8px] py-4 px-6 text-sm text-white focus:border-yellow-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => setShowCustomUmpireModal(false)}
                  className="flex-1 py-4 bg-neutral-800 rounded-[8px] font-black text-[10px] uppercase tracking-widest text-neutral-400 hover:bg-neutral-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!customUmpireData.name || !customUmpireData.email}
                  onClick={() => {
                    setSelectedUmpire(null);
                    setGameData({ ...gameData, umpireId: null });
                    setShowCustomUmpireModal(false);
                    toast.success(`Custom umpire ${customUmpireData.name} added!`);
                  }}
                  className="flex-[2] py-4 bg-yellow-500 text-black font-black rounded-[8px] text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Confirm Umpire
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="relative bg-black border border-neutral-800 p-10 rounded-[8px] max-w-sm w-full text-center shadow-2xl">
              <div className="w-24 h-24 bg-yellow-500/10 rounded-[8px] flex items-center justify-center mx-auto mb-8">
                <Coins size={48} className="text-yellow-500" />
              </div>
              <h2 className="text-3xl font-black mb-3 tracking-tight font-open-sans uppercase">Reserve Coins</h2>
              <p className="text-neutral-500 font-medium mb-10 leading-relaxed text-[20px] font-inter">
                Hosting this game will reserve <span className="text-white font-black">{totalCost} coins</span> from your wallet. It will be deducted only when the match is confirmed.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-neutral-800 rounded-[8px] font-black text-xs uppercase tracking-widest text-neutral-400">Cancel</button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    handleCreateGame();
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black rounded-[8px] shadow-[0_10px_25px_rgba(85,222,232,0.25)] text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CoinAnimation 
        show={showCoinAnim} 
        amount={totalCost} 
        onComplete={() => {
          setShowCoinAnim(false);
          toast.success("Match Hosted Successfully!");
          navigate("/my-hosted-games");
        }} 
      />

      {loading && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-[#BFF367]/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#BFF367] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367] to-[#BFF367] font-black uppercase tracking-[0.3em] text-xs">Reserving Coins...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostGame;
