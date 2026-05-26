import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { fetchStates, fetchCities } from "../../../shared/utils/locationService";
import { 
  Search, 
  MapPin, 
  Users,
  Trophy,
  ShieldCheck,
  Swords,
  ChevronRight,
  Target,
  Crown,
  Loader2,
  Navigation,
  MessageCircle,
  Star,
  UserPlus,
  Activity,
  ChevronUp,
  ChevronDown,
  Compass,
  Eye,
  EyeOff,
  WifiOff,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import StoryViewer from "@features/networking/components/StoryViewer";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import NearbyPlayersMap from "@components/map/NearbyPlayersMap";
import { useSocket } from "@context/SocketContext";
import { haversineMeters } from "@utils/geoUtils";

const PRI = "#55DEE8";
const GRAD = "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)";
const HEADING_STYLE = { fontFamily: '"Outfit", sans-serif' };
const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };
const SNAP_STATES = { COLLAPSED: 0, HALF: 33, EXPANDED: 85 };

const MOCK_PLAYERS = [
  { _id: "m1", name: "Simulated Virat", latOffset: 0.015, lngOffset: 0.015, sport: "Cricket" },
  { _id: "m2", name: "Simulated MSD", latOffset: -0.012, lngOffset: 0.018, sport: "Cricket" },
  { _id: "m3", name: "Simulated Rohit", latOffset: 0.018, lngOffset: -0.012, sport: "Cricket" },
  { _id: "m4", name: "Simulated Rahul", latOffset: -0.015, lngOffset: -0.015, sport: "Cricket" }
];

const PlayerCard = ({ player, followingIds, handleFollowToggle, handleAvatarClick, currentUser, navigate, gateInteraction }) => {
  const isFollowing = followingIds.includes(player.id || player._id);
  const playerId = player.id || player._id;

  const sportTypes = player.sportTypes || (player.sport ? [player.sport] : []);

  const locationParts = [
    player.city,
    player.state,
    player.country,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 bg-[#0D0D0D] border border-white/[0.07] rounded-2xl px-4 py-3 group hover:border-[#55DEE8]/20 transition-all duration-300"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
    >
      {/* Avatar */}
      <div
        className="relative shrink-0 cursor-pointer"
        onClick={() => handleAvatarClick(player)}
      >
        <div
          className="w-14 h-14 rounded-2xl overflow-hidden bg-[#111] flex items-center justify-center border-2 border-transparent"
          style={{ boxShadow: '0 0 0 2px rgba(85,222,232,0.4)' }}
        >
          {player.profilePicture ? (
            <img src={player.profilePicture} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#55DEE8] font-black text-xl leading-none">
              {player.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {/* online dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#BFF367] rounded-full border-2 border-[#0D0D0D]" />
      </div>

      {/* Info block */}
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-2 mb-0.5">
          <h3
            className="text-sm font-black text-white uppercase tracking-tight truncate cursor-pointer hover:text-[#55DEE8] transition-colors"
            style={HEADING_STYLE}
            onClick={() => navigate(`/profile/${playerId}`)}
          >
            {player.name}
          </h3>
          {player.isVerified && (
            <ShieldCheck size={12} className="text-[#55DEE8] shrink-0" />
          )}
        </div>

        {/* Followers only */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[10px] text-white/40 font-bold">
            <span className="text-white font-black">{player.followersCount ?? player.followers?.length ?? 0}</span> Followers
          </span>
        </div>

        {/* Sports chips – max 2 */}
        {sportTypes.length > 0 && (
          <div className="flex gap-1 mb-2">
            {sportTypes.slice(0, 2).map(s => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-black"
                style={{ background: GRAD }}
              >
                {s}
              </span>
            ))}
            {sportTypes.length > 2 && (
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white/30 bg-white/5 border border-white/10">
                +{sportTypes.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {locationParts.length > 0 && (
          <div className="flex items-center gap-1 text-[9px] text-white/30 font-semibold">
            <MapPin size={9} className="text-[#55DEE8] shrink-0" />
            <span className="truncate">{locationParts.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Single action button – Follow or Message */}
      <div className="shrink-0">
        {isFollowing ? (
          <button
            onClick={() => gateInteraction(() => navigate(`/messages?userId=${playerId}`))}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <MessageCircle size={12} className="shrink-0" />
            Message
          </button>
        ) : (
          <button
            onClick={() => handleFollowToggle(playerId)}
            className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-black active:scale-95 transition-all whitespace-nowrap shadow-[0_4px_14px_rgba(85,222,232,0.25)]"
            style={{ background: GRAD }}
          >
            Follow
          </button>
        )}
      </div>
    </motion.div>
  );
};

const TeamCard = ({ team, navigate }) => {
  const sportBanners = {
    Cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067&auto=format&fit=crop',
    Football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop',
    Basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop',
    default: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070&auto=format&fit=crop',
  };
  const banner = sportBanners[team.sportType] || sportBanners.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      onClick={() => navigate(`/team/${team._id}`)}
      className="relative bg-[#0D0D0D] rounded-2xl border border-white/[0.07] overflow-hidden flex flex-col cursor-pointer group"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
    >
      {/* ── Banner ── */}
      <div className="h-28 relative overflow-hidden">
        <img
          src={banner}
          alt=""
          className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700 grayscale-[40%] group-hover:grayscale-0"
        />
        {/* deep gradient so content below is legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent" />

        {/* Verified pill – top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
          <ShieldCheck size={9} className="text-[#55DEE8]" />
          <span className="text-[7px] font-black uppercase tracking-widest text-white/80">Verified</span>
        </div>

        {/* Sport chip – top-left */}
        <div
          className="absolute top-3 left-3 px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest text-black"
          style={{ background: GRAD }}
        >
          {team.sportType || 'Sport'}
        </div>
      </div>

      {/* ── Avatar row ── */}
      <div className="relative px-4 -mt-6 flex items-end mb-3">
        {/* Avatar */}
        <div className="relative">
          <div
            className="w-12 h-12 rounded-xl border-2 border-[#0D0D0D] overflow-hidden bg-[#111] flex items-center justify-center"
            style={{ boxShadow: '0 0 0 2px #55DEE8, 0 0 16px rgba(85,222,232,0.35)' }}
          >
            {team.logo ? (
              <img src={team.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#55DEE8] font-black text-lg leading-none">
                {team.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Online dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#BFF367] rounded-full border-2 border-[#0D0D0D]" />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 px-4 pb-4 flex flex-col gap-3">

        {/* Name + Location */}
        <div>
          <h3
            className="text-sm font-black text-white uppercase tracking-tight leading-tight line-clamp-1"
            style={HEADING_STYLE}
          >
            {team.name}
          </h3>
          <p className="text-[9px] font-semibold text-white/30 mt-0.5 flex items-center gap-1">
            <MapPin size={8} className="text-[#55DEE8]" />
            {team.city || 'Global'}
          </p>
        </div>

        {/* Stats inline row */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
          <Users size={10} className="text-[#55DEE8] shrink-0" />
          <span><span className="text-white font-black">{team.memberCount || 1}</span> Members</span>
          <span className="text-white/15">·</span>
          <Target size={10} className="text-[#55DEE8] shrink-0" />
          <span><span className="text-white font-black">{team.matchesPlayed || 0}</span> Matches</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Link
            to={`/team/${team._id}`}
            onClick={e => e.stopPropagation()}
            className="h-9 text-black rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            style={{ background: GRAD, boxShadow: '0 4px 14px rgba(85,222,232,0.25)' }}
          >
            <UserPlus size={12} strokeWidth={3} />
            Join
          </Link>
          <Link
            to={`/team/${team._id}`}
            onClick={e => e.stopPropagation()}
            className="h-9 bg-white/[0.04] border border-white/10 text-white/70 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            <Swords size={12} />
            Challenge
          </Link>
        </div>

        {/* Team Pass link */}
        <Link
          to={`/team-pass/${team._id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1 text-white/20 hover:text-[#55DEE8] text-[8px] font-black uppercase tracking-[0.2em] transition-all group/pass"
        >
          <span>View Team Pass</span>
          <ChevronRight size={10} className="group-hover/pass:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Subtle glow border on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(85,222,232,0.2)' }}
      />
    </motion.div>
  );
};


const FindPlayers = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [allNearbyPlayers, setAllNearbyPlayers] = useState([]);
  const [displayedPlayers, setDisplayedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingIds, setFollowingIds] = useState([]);
  const [filters, setFilters] = useState({ state: "", city: "", sport: "" });
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "players";
  
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };
  const [teams, setTeams] = useState([]);
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);
  
  const [snapState, setSnapState] = useState("HALF");
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [isRadiusChanging, setIsRadiusChanging] = useState(false);
  
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  useEffect(() => {
    const loadStates = async () => {
      const s = await fetchStates();
      setStatesList(s);
    };
    loadStates();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      if (filters.state) {
        const c = await fetchCities(filters.state);
        setCitiesList(c);
      } else {
        setCitiesList([]);
      }
    };
    loadCities();
  }, [filters.state]);

  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [userLocation, setUserLocation] = useState(() => {
    const cached = localStorage.getItem("kridaz_guest_location");
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return null;
  });
  const { socket } = useSocket();
  const lastBoundsRef = useRef(null);
  const [currentZoom, setCurrentZoom] = useState(14);
  const [hasShownLimitToast, setHasShownLimitToast] = useState(false);
  
  // Adaptive tracking & Privacy states
  const [isTrackingActive, setIsTrackingActive] = useState(true);
  const [isLocationSharing, setIsLocationSharing] = useState(() => {
    return localStorage.getItem("kridaz_location_sharing") !== "false";
  });
  const [isMapTilesLoaded, setIsMapTilesLoaded] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  const lastEmittedLocation = useRef(null);
  const lastEmitTime = useRef(0);
  const watchId = useRef(null);
  const MOVEMENT_THRESHOLD_METERS = 50;
  const HEARTBEAT_INTERVAL_MS = 30000;

  const clusterPlayers = (players, zoom, radiusPx) => {
    if (!players.length) return [];
    
    const clusters = [];
    const assigned = new Set();
    
    players.forEach((player, i) => {
      if (assigned.has(i)) return;
      
      const nearby = players.filter((other, j) => {
        if (j === i || assigned.has(j)) return false;
        const latDiff = Math.abs(player.lat - other.lat);
        const lngDiff = Math.abs(player.lng - other.lng);
        const pxPerDegree = 256 * Math.pow(2, zoom) / 360;
        const distPx = Math.sqrt((latDiff * pxPerDegree)**2 + (lngDiff * pxPerDegree)**2);
        return distPx < radiusPx;
      });
      
      // If there is at least 1 other nearby player, form a cluster (total >= 2)
      if (nearby.length >= 1) {
        const clusterMembers = [player, ...nearby];
        clusterMembers.forEach(member => {
          const idx = players.findIndex(p => (p.id || p._id) === (member.id || member._id));
          if (idx !== -1) assigned.add(idx);
        });
        
        const centerLat = clusterMembers.reduce((s, p) => s + p.lat, 0) / clusterMembers.length;
        const centerLng = clusterMembers.reduce((s, p) => s + p.lng, 0) / clusterMembers.length;
        const previews = [...clusterMembers].sort(() => Math.random() - 0.5).slice(0, 3);
        
        clusters.push({ 
          type: "cluster", 
          lat: centerLat, 
          lng: centerLng, 
          count: clusterMembers.length, 
          previews, 
          members: clusterMembers,
          _id: `cluster-${centerLat}-${centerLng}-${clusterMembers.length}`
        });
      } else {
        assigned.add(i);
        clusters.push({ type: "single", ...player });
      }
    });
    
    return clusters;
  };

  const sports = ["Cricket", "Football", "Badminton", "Tennis", "Basketball", "Volleyball", "Table Tennis"];

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTrackingActive(document.visibilityState === "visible");
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isTrackingActive || activeTab !== "players") {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        const newLocation = {
          lat: newLat,
          lng: newLng,
          profilePicture: currentUser?.profilePicture || currentUser?.profileImage
        };

        setUserLocation(prev => {
          if (!prev) {
            localStorage.setItem("kridaz_guest_location", JSON.stringify({ lat: newLat, lng: newLng }));
            return newLocation;
          }
          const dist = haversineMeters(prev.lat, prev.lng, newLat, newLng);
          if (dist > MOVEMENT_THRESHOLD_METERS) {
            localStorage.setItem("kridaz_guest_location", JSON.stringify({ lat: newLat, lng: newLng }));
            return newLocation;
          }
          return prev;
        });
        setLocationError(null);

        // Adaptive emitting logic
        if (socket && isLocationSharing) {
          const now = Date.now();
          const shouldEmit = !lastEmittedLocation.current || 
            haversineMeters(
              lastEmittedLocation.current.lat, 
              lastEmittedLocation.current.lng,
              newLocation.lat,
              newLocation.lng
            ) > MOVEMENT_THRESHOLD_METERS ||
            (now - lastEmitTime.current) > HEARTBEAT_INTERVAL_MS;

          if (shouldEmit) {
            socket.emit("location:update", newLocation);
            lastEmittedLocation.current = newLocation;
            lastEmitTime.current = now;
          }
        }
      },
      (error) => {
        console.error("WatchPosition error:", error);
        setLocationError(error.message);
        if (error.code === 1) { // PERMISSION_DENIED
          // Silently handle, UI will show map placeholder or error state
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [isTrackingActive, isLocationSharing, socket, activeTab]);

  useEffect(() => {
    if (activeTab === 'players' && snapState !== 'COLLAPSED') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (activeTab === 'players' && snapState === 'COLLAPSED') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [snapState, activeTab]);

  const toggleLocationSharing = async () => {
    const newState = !isLocationSharing;
    setIsLocationSharing(newState);
    localStorage.setItem("kridaz_location_sharing", newState.toString());
    
    try {
      await axiosInstance.post("/api/user/players/location", {
        sharing: newState,
        lat: userLocation?.lat || 0,
        lng: userLocation?.lng || 0
      });
      
      if (!newState) {
        toast.success("Privacy On: You are now hidden from others");
      } else {
        toast.success("Sharing enabled: Nearby players can see you");
      }
    } catch (err) {
      console.error("Failed to update privacy setting:", err);
      toast.error("Failed to update privacy setting");
      setIsLocationSharing(!newState);
    }
  };

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        state: filters.state,
        city: filters.city,
        sportType: filters.sport,
        search: searchQuery,
        radius: selectedRadius
      };
      
      const response = await axiosInstance.get("/api/user/players", {
        params: {
          state: filters.state,
          city: filters.city,
          sport: filters.sport,
          search: searchQuery,
          ...(showNearbyOnly && userLocation ? {
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius: selectedRadius * 1000
          } : {})
        }
      });
      if (response.data.success) {
        setPlayers(response.data.players || []);
        if (response.data.followingIds) setFollowingIds(response.data.followingIds);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, userLocation, selectedRadius, showNearbyOnly]);

  const fetchNearbyPlayers = useCallback(async () => {
    if (!userLocation) return;
    try {
      const res = await axiosInstance.get("/api/user/players/nearby", {
        params: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: selectedRadius * 1000,
          limit: 50
        }
      });
      if (res.data.success) {
        if (res.data.players.length > 100 && !hasShownLimitToast) {
          toast("Showing top nearby players. Zoom in to see more.", { icon: "=ƒôì" });
          setHasShownLimitToast(true);
        }
        const mapPlayers = res.data.players
          .map(p => ({
            _id: p.id || p._id,
            name: p.name,
            username: p.username,
            profilePicture: p.profilePicture,
            lat: p.lat,
            lng: p.lng,
            distanceKm: p.distanceKm,
            city: p.city,
            sportTypes: p.sportTypes
          }))
          .filter(p => p.lat != null && p.lng != null);

        const mocks = userLocation ? MOCK_PLAYERS.map(m => ({
          ...m,
          lat: userLocation.lat + m.latOffset,
          lng: userLocation.lng + m.lngOffset,
          profilePicture: "https://pngimg.com/d/cricket_PNG102.png",
          distanceKm: 0.5,
          sportTypes: [m.sport]
        })).filter(m => m.lat != null && m.lng != null) : [];

        setAllNearbyPlayers([...mapPlayers, ...mocks]);
      }
    } catch (err) {
      console.error("Failed to fetch nearby players:", err);
    }
  }, [userLocation, selectedRadius]);

  const handleMapMove = useCallback((bounds, zoom) => {
    lastBoundsRef.current = bounds;
    if (zoom) setCurrentZoom(zoom);
    if (!bounds || !allNearbyPlayers.length) {
      if (allNearbyPlayers.length) {
        setDisplayedPlayers(allNearbyPlayers.map(p => ({ type: "single", ...p })));
      }
      return;
    }

    const visiblePlayers = allNearbyPlayers.filter(p => {
      try {
        return bounds.contains([p.lat, p.lng]);
      } catch (e) {
        return true; // Fallback to showing if bounds check fails
      }
    });
    
    let radiusPx = 60;
    const z = zoom || currentZoom;
    if (z < 13) radiusPx = 80;
    else if (z >= 13 && z <= 15) radiusPx = 60;
    else if (z > 15 && z <= 17) radiusPx = 30;
    else radiusPx = 0;

    if (radiusPx > 0 && visiblePlayers.length > 0) {
      const clustered = clusterPlayers(visiblePlayers, z, radiusPx);
      setDisplayedPlayers(clustered);
    } else {
      setDisplayedPlayers(visiblePlayers.map(p => ({ type: "single", ...p })));
    }
  }, [allNearbyPlayers, currentZoom]);

  useEffect(() => {
    if (lastBoundsRef.current) {
      handleMapMove(lastBoundsRef.current, currentZoom);
    }
  }, [allNearbyPlayers, handleMapMove, currentZoom]);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyPlayers();
      const interval = setInterval(fetchNearbyPlayers, HEARTBEAT_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [userLocation, fetchNearbyPlayers]);

  useEffect(() => {
    if (userLocation) {
      setIsRadiusChanging(true);
      setTimeout(() => setIsRadiusChanging(false), 500);
    }
  }, [selectedRadius]);

  useEffect(() => {
    if (!socket || !userLocation || snapState === 'COLLAPSED' || !isLocationSharing) return;
    
    socket.emit("location:update", {
      lat: userLocation.lat,
      lng: userLocation.lng,
      radiusKm: selectedRadius
    });
  }, [socket, userLocation, selectedRadius, snapState, isLocationSharing]);

  useEffect(() => {
    if (!socket) return;
    
    const handleLocationUpdate = ({ userId, lat, lng }) => {
      setAllNearbyPlayers(prev => {
        const existing = prev.find(p => (p.id || p._id) === userId);
        if (existing) {
          return prev.map(p => (p.id || p._id) === userId ? { ...p, lat, lng } : p);
        } else {
          // New user moved into radius, trigger fetch to get their profile data
          fetchNearbyPlayers();
          return prev;
        }
      });
    };

    socket.on("nearby:location:update", handleLocationUpdate);
    
    return () => {
      socket.off("nearby:location:update", handleLocationUpdate);
    };
  }, [socket]);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.state) params.state = filters.state;
      if (filters.city) params.city = filters.city;
      if (filters.sport) params.sportType = filters.sport;
      if (searchQuery) params.search = searchQuery;

      const response = await axiosInstance.get("/api/team/all", { params });
      if (response.data.success) {
        setTeams(response.data.teams || []);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);
  const fetchTeamsRef = useRef(fetchTeams);
  const fetchPlayersRef = useRef(fetchPlayers);

  useEffect(() => {
    fetchTeamsRef.current = fetchTeams;
    fetchPlayersRef.current = fetchPlayers;
  }, [fetchTeams, fetchPlayers]);

  useEffect(() => {
    if (activeTab === "players") fetchPlayersRef.current();
    else fetchTeamsRef.current();
  }, [activeTab, filters, selectedRadius, showNearbyOnly, userLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "players") fetchPlayersRef.current();
      else fetchTeamsRef.current();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFollowToggle = (targetUserId) => {
    gateInteraction(async () => {
      const wasFollowing = followingIds.includes(targetUserId);

      // ── Optimistic update: flip state instantly ──────────────────────
      setFollowingIds(prev =>
        wasFollowing
          ? prev.filter(id => id !== targetUserId)
          : [...prev, targetUserId]
      );

      // ── Also update follower count in the players list optimistically ─
      setPlayers(prev =>
        prev.map(p => {
          const id = p.id || p._id;
          if (id !== targetUserId) return p;
          const delta = wasFollowing ? -1 : 1;
          return {
            ...p,
            followersCount: Math.max(0, (p.followersCount ?? p.followers?.length ?? 0) + delta),
          };
        })
      );

      try {
        const endpoint = `/api/user/players/${targetUserId}/${wasFollowing ? 'unfollow' : 'follow'}`;
        await axiosInstance.post(endpoint);
        // Success – no toast needed, the UI already reflected the change
      } catch (error) {
        // ── Rollback on failure ──────────────────────────────────────────
        setFollowingIds(prev =>
          wasFollowing
            ? [...prev, targetUserId]
            : prev.filter(id => id !== targetUserId)
        );
        setPlayers(prev =>
          prev.map(p => {
            const id = p.id || p._id;
            if (id !== targetUserId) return p;
            const delta = wasFollowing ? 1 : -1;
            return {
              ...p,
              followersCount: Math.max(0, (p.followersCount ?? p.followers?.length ?? 0) + delta),
            };
          })
        );
        toast.error("Couldn't update follow status. Please try again.");
      }
    });
  };


  const handleAvatarClick = (player) => {
    gateInteraction(() => {
      const playerId = player.id || player._id;
      if (!player.hasActiveStory) {
        navigate(`/profile/${playerId}`);
        return;
      }
      const fetchStories = async () => {
        try {
          const res = await axiosInstance.get(`/api/user/community/user-stories/${playerId}`);
          if (res.data.success && res.data.stories?.length > 0) {
            setViewingStoryGroup({ user: player, stories: res.data.stories });
          } else {
            navigate(`/profile/${playerId}`);
          }
        } catch (error) {
          toast.error("Failed to load stories");
          navigate(`/profile/${playerId}`);
        }
      };
      fetchStories();
    });
  };

  const handleMapPlayerClick = (id) => {
    const element = document.getElementById(`player-card-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-[#55DEE8]", "ring-offset-4", "ring-offset-black");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-[#55DEE8]", "ring-offset-4", "ring-offset-black");
      }, 3000);
    }
  };

  const handleDragEnd = (_, info) => {
    const velocityThreshold = 30;
    const offsetThreshold = 40;
    const vy = info.velocity.y;
    const dy = info.offset.y;

    // Drag UP (negative y) → close/collapse map
    if (vy < -velocityThreshold || dy < -offsetThreshold) {
      if (snapState === "EXPANDED") setSnapState("HALF");
      else if (snapState === "HALF") setSnapState("COLLAPSED");
    }
    // Drag DOWN (positive y) → open/expand map
    else if (vy > velocityThreshold || dy > offsetThreshold) {
      if (snapState === "COLLAPSED") setSnapState("HALF");
      else if (snapState === "HALF") setSnapState("EXPANDED");
    }
  };

  return (
    <div className={`bg-black text-white flex flex-col ${activeTab === "players" ? "fixed inset-0 lg:left-64 overflow-hidden pt-16 lg:pt-0" : "min-h-screen overflow-y-auto no-scrollbar"}`}>
      
      {activeTab === "players" && (
        <>
          <motion.div 
            animate={{ height: `${SNAP_STATES[snapState]}vh` }}
            transition={{ type: "spring", damping: 25, stiffness: 150 }}
            className="relative w-full bg-[#0a0a0a] border-b border-[#55DEE8]/30 overflow-hidden lg:hidden"
          >
            <AnimatePresence>
              {snapState !== "COLLAPSED" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <NearbyPlayersMap 
                    userLocation={userLocation}
                    nearbyPlayers={displayedPlayers} 
                    radiusKm={selectedRadius}
                    onMapMove={handleMapMove}
                    onPlayerClick={(id) => navigate(`/profile/${id}`)}
                  />

                  {/* HEADER STATUS BAR */}
                  <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 pointer-events-auto">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 px-2.5 rounded-[8px] shadow-2xl">
                      <Users size={14} className="text-[#55DEE8]" />
                      <span className="text-[#55DEE8] text-[12px] font-black">{allNearbyPlayers.length}</span>
                    </div>

                    <button 
                      onClick={toggleLocationSharing}
                      className={`flex items-center justify-center p-1.5 w-8 h-8 rounded-[8px] border transition-all duration-300 backdrop-blur-xl shadow-2xl ${ isLocationSharing ? "bg-[#55DEE8]/20 border-[#55DEE8]/30 text-[#55DEE8]" : "bg-red-500/10 border-red-500/20 text-red-500" }`}
                    >
                      {isLocationSharing ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>

                  {/* LOADING SKELETON */}
                  {!userLocation && !locationError && (
                    <div className="absolute inset-0 z-[2000] bg-[#0A0A0A] flex flex-col items-center justify-center">
                      <div className="w-full h-full relative opacity-20">
                        <div className="absolute inset-0" style={{ 
                            backgroundImage: 'radial-gradient(#55DEE8 1px, transparent 1px)', 
                            backgroundSize: '40px 40px' 
                        }} />
                      </div>
                      <div className="absolute flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 border-2 border-[#55DEE8]/20 rounded-full animate-ping absolute inset-0" />
                          <div className="w-16 h-16 border-2 border-[#55DEE8] rounded-full flex items-center justify-center bg-black">
                            <MapPin className="text-[#55DEE8] animate-bounce" size={24} />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-black text-sm uppercase tracking-widest mb-1">Finding your location...</p>
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-tighter">Connecting to Kridaz Satellites</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ERROR STATE */}
                  {locationError && (
                    <div className="absolute inset-0 z-[2000] bg-[#0A0A0A]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-[8px] flex items-center justify-center mb-4">
                        <AlertCircle className="text-red-500" size={32} />
                      </div>
                      <h3 className="text-white font-black uppercase tracking-widest mb-2">Location Required</h3>
                      <p className="text-white/40 text-xs font-medium leading-relaxed max-w-xs mb-6">
                        We need your location to show nearby players. Please check your browser permissions.
                      </p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-white/5 border border-white/10 rounded-[8px] text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                      >
                        Retry Connection
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {isRadiusChanging && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[1500] bg-black/40 backdrop-blur-sm flex items-center justify-center"
                      >
                        <Loader2 className="text-[#55DEE8] animate-spin" size={32} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute bottom-0 left-0 w-full z-[1000]">
                    <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 p-2.5 px-6 flex items-center gap-4 pointer-events-auto w-full">
                        <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Radius</span>
                        <input 
                          type="range"
                          min="5" max="100" step="5"
                          value={selectedRadius}
                          onPointerDown={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedRadius(Number(e.target.value));
                          }}
                          className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#55DEE8]"
                        />
                        <span className="text-[#55DEE8] text-[10px] font-black min-w-[40px] text-right">{selectedRadius} KM</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* DRAG HANDLE */}
          <motion.div 
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="w-full h-10 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing bg-black z-50 group border-b border-white/5 lg:hidden"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full group-hover:bg-[#55DEE8]/40 transition-colors" />
            <div className="text-[8px] font-bold text-white/10 uppercase tracking-[0.3em] mt-1 group-hover:text-[#55DEE8]/40 transition-colors">
                Slide to Discover
            </div>
          </motion.div>
        </>
      )}

      {/* BOTTOM PANEL: Feed */}
      <div className={`flex-1 ${activeTab === "players" ? "overflow-y-auto no-scrollbar pb-24 pt-6" : "pb-12 pt-2"} px-4 md:px-8 bg-black`}>
        <div className={`max-w-6xl mx-auto space-y-6 ${activeTab === "players" ? "mt-6" : "mt-2"}`}>
          
          {/* Tab Switcher */}
          <div className="flex items-center gap-4 border-b border-white/5 pb-1">
            <button 
              onClick={() => setActiveTab("players")}
              className={`pb-4 px-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "players" ? "text-[#55DEE8]" : "text-white/20 hover:text-white/40"}`}
            >
              Players
              {activeTab === "players" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#55DEE8]" />}
            </button>
            <button 
              onClick={() => setActiveTab("teams")}
              className={`pb-4 px-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "teams" ? "text-[#55DEE8]" : "text-white/20 hover:text-white/40"}`}
            >
              Teams
              {activeTab === "teams" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#55DEE8]" />}
            </button>
          </div>

          {/* Compact Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-[8px] p-3 md:p-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8] transition-colors" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="SEARCH..."
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#55DEE8]/50 rounded-[8px] h-10 pl-11 pr-4 text-white text-[10px] md:text-xs placeholder:text-white/20 outline-none transition-all uppercase tracking-widest font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
              <select 
                value={filters.sport}
                onChange={(e) => handleFilterChange("sport", e.target.value)}
                className="bg-white/5 border border-white/10 rounded-[6px] px-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#55DEE8] focus:border-[#55DEE8]/50 outline-none cursor-pointer hover:bg-white/10 transition-all"
              >
                <option value="">All Sports</option>
                {sports.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              {/* PC View Filters (Hidden on Mobile/Tab) */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="relative group">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8]" size={10} />
                  <select 
                    value={filters.state || ""}
                    onChange={(e) => {
                      handleFilterChange("state", e.target.value);
                      handleFilterChange("city", "");
                    }}
                    className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#55DEE8] focus:border-[#55DEE8]/50 outline-none w-24 md:w-28 cursor-pointer hover:bg-white/10 transition-all appearance-none"
                  >
                    <option value="">STATE...</option>
                    {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="relative group">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8]" size={10} />
                  <select 
                    value={filters.city || ""}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#55DEE8] focus:border-[#55DEE8]/50 outline-none w-24 md:w-28 cursor-pointer hover:bg-white/10 transition-all appearance-none"
                    disabled={!filters.state}
                  >
                    <option value="">CITY...</option>
                    {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="relative group">
                  <Navigation className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8]" size={10} />
                  <select 
                    value={selectedRadius}
                    onChange={(e) => setSelectedRadius(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#55DEE8] focus:border-[#55DEE8]/50 outline-none cursor-pointer hover:bg-white/10 transition-all appearance-none w-24 md:w-28"
                  >
                    <option value="5">5 KM</option>
                    <option value="10">10 KM</option>
                    <option value="20">20 KM</option>
                    <option value="50">50 KM</option>
                    <option value="100">100 KM</option>
                  </select>
                </div>
              </div>

              {/* Mobile/Tab Location Filters */}
              <div className="relative group lg:hidden">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8]" size={10} />
                <select
                  value={filters.state || ""}
                  onChange={(e) => {
                    handleFilterChange("state", e.target.value);
                    handleFilterChange("city", "");
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#55DEE8] focus:border-[#55DEE8]/50 outline-none w-24 md:w-28 cursor-pointer hover:bg-white/10 transition-all appearance-none"
                >
                  <option value="">STATE...</option>
                  {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="relative group lg:hidden">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8]" size={10} />
                <select
                  value={filters.city || ""}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  disabled={!filters.state}
                  className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#55DEE8] focus:border-[#55DEE8]/50 outline-none w-24 md:w-28 cursor-pointer hover:bg-white/10 transition-all appearance-none disabled:opacity-40"
                >
                  <option value="">CITY...</option>
                  {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {activeTab === "players" && (
                <button 
                  onClick={() => setShowNearbyOnly(!showNearbyOnly)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] border transition-all text-[9px] font-black uppercase tracking-widest ${ showNearbyOnly ? "bg-[#55DEE8] border-[#55DEE8] text-black shadow-[0_0_15px_rgba(85,222,232,0.4)]" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10" }`}
                >
                  <Navigation size={10} className={showNearbyOnly ? "animate-pulse" : ""} />
                  Nearby
                </button>
              )}
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : activeTab === "players" ? (
            <div className="space-y-3">
              {players.map((player) => (
                <div key={player.id || player._id} id={`player-card-${player.id || player._id}`}>
                  <PlayerCard
                    player={player}
                    followingIds={followingIds}
                    handleFollowToggle={handleFollowToggle}
                    handleAvatarClick={handleAvatarClick}
                    currentUser={currentUser}
                    navigate={navigate}
                    gateInteraction={gateInteraction}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {teams.length > 0 ? (
                teams.map((team) => (
                  <TeamCard key={team._id} team={team} navigate={navigate} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-gray-500">
                    <Users size={32} />
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No teams found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewingStoryGroup && (
        <StoryViewer 
          storyGroup={viewingStoryGroup}
          onClose={() => setViewingStoryGroup(null)}
          onDelete={null}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default FindPlayers;