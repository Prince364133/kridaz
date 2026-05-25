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
const SNAP_STATES = { COLLAPSED: 0, HALF: 33, EXPANDED: 50 };

const MOCK_PLAYERS = [
  { _id: "m1", name: "Simulated Virat", latOffset: 0.015, lngOffset: 0.015, sport: "Cricket" },
  { _id: "m2", name: "Simulated MSD", latOffset: -0.012, lngOffset: 0.018, sport: "Cricket" },
  { _id: "m3", name: "Simulated Rohit", latOffset: 0.018, lngOffset: -0.012, sport: "Cricket" },
  { _id: "m4", name: "Simulated Rahul", latOffset: -0.015, lngOffset: -0.015, sport: "Cricket" }
];

const PlayerCard = ({ player, rank, followingIds, handleFollowToggle, handleAvatarClick, currentUser, navigate, gateInteraction }) => {
  const shapes = [
    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
    "circle(50% at 50% 50%)",
    "polygon(50% 0%, 100% 100%, 0% 100%)",
    "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
  ];
  const shape = shapes[rank % shapes.length];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative bg-black rounded-[8px] border border-[#55DEE8]/20 overflow-hidden flex flex-col h-[360px] p-1 group hover:border-[#55DEE8]/60 transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
    >
      <div className="flex justify-end items-start p-4 absolute top-0 left-0 right-0 z-20">
        <div className="p-1.5 bg-[#55DEE8]/10 rounded-[8px] border border-[#55DEE8]/20">
          <ShieldCheck size={14} className="text-[#55DEE8]" />
        </div>
      </div>

      <div className="h-40 relative mt-2 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute w-52 h-52 bg-[#55DEE8]/10 border border-[#55DEE8]/30 blur-sm opacity-50 group-hover:opacity-80 transition-opacity duration-700"
          style={{ clipPath: shape }}
        />
        <div 
          className="absolute w-48 h-48 border-2 border-[#55DEE8]/40"
          style={{ clipPath: shape }}
        />
        <div className="relative w-full h-full flex items-center justify-center z-10 pointer-events-none">
          <img 
            src={player.profilePicture || "https://pngimg.com/d/cricket_PNG102.png"} 
            alt="" 
            className="h-[95%] w-[90%] object-contain filter drop-shadow-[0_10px_30px_rgba(85,222,232,0.4)] group-hover:scale-110 transition-transform duration-700 select-none"
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black border-2 border-[#55DEE8] w-12 h-14 flex items-center justify-center" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
            <span className="text-[#55DEE8] font-black text-sm uppercase">
              {player.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "P"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 pt-4 pb-2 flex flex-col items-center text-center">
        <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1 truncate w-full" style={HEADING_STYLE}>
          {player.name}
        </h3>
        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4">
          <MapPin size={10} className="text-[#55DEE8]" />
          {player.city || 'Athletic'}
        </div>
        <div className="grid grid-cols-3 w-full border-t border-white/5 pt-2 mb-2">
          <div className="flex flex-col items-center">
            <span className="text-[#55DEE8] text-[6px] font-black uppercase tracking-widest mb-1">Matches</span>
            <span className="text-white font-black text-[10px]">GÇö</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/5">
            <span className="text-[#55DEE8] text-[6px] font-black uppercase tracking-widest mb-1">Runs</span>
            <span className="text-white font-black text-[10px]">GÇö</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#55DEE8] text-[6px] font-black uppercase tracking-widest mb-1">Strike Rate</span>
            <span className="text-white font-black text-[10px]">GÇö</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full mt-auto">
          <button onClick={() => handleFollowToggle(player.id || player._id)} className={`flex-1 h-11 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all ${followingIds.includes(player.id || player._id) ? "bg-white/5 text-white/20 border border-white/10" : "text-black hover:scale-105 shadow-[0_0_15px_rgba(85,222,232,0.3)]"}`} style={!followingIds.includes(player.id || player._id) ? { background: GRAD } : {}}>
            {followingIds.includes(player.id || player._id) ? "Following" : "Follow"}
          </button>
          <button onClick={() => gateInteraction(() => navigate(`/messages?userId=${player.id || player._id}`))} className="w-11 h-11 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#55DEE8] transition-all">
            <MessageCircle size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const TeamCard = ({ team, navigate }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative bg-[#0A0A0A] rounded-[8px] border border-white/5 overflow-hidden flex flex-col h-[380px] group hover:border-[#55DEE8]/30 transition-all duration-500 shadow-2xl"
    >
      {/* Top Section: Banner */}
      <div className="h-32 relative">
        <img 
          src={team.sportType === 'Cricket' ? 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop'} 
          alt="" 
          className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
        
        {/* Verified Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-[6px] border border-white/10">
          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: GRAD }}>
            <ShieldCheck size={10} className="text-black" />
          </div>
          <span className="text-[8px] font-black text-white uppercase tracking-widest">Verified</span>
        </div>

        {/* Team Avatar Overlay */}
        <div className="absolute bottom-[-16px] left-4 z-10">
          <div className="w-14 h-14 rounded-full border-[2px] border-[#0A0A0A] bg-[#0A0A0A] relative overflow-hidden group/avatar">
            <div className="absolute inset-0 border-2 border-[#55DEE8] rounded-full z-20" />
            <div className="w-full h-full flex items-center justify-center bg-[#111] relative z-10">
              {team.logo ? (
                <img src={team.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-[#55DEE8]">
                  <Crown size={24} className="mb-1" />
                  <div className="w-10 h-10 border-2 border-[#55DEE8] rounded-full flex items-center justify-center p-1">
                     {team.sportType === 'Cricket' ? <Trophy size={16} /> : <Activity size={16} />}
                  </div>
                </div>
              )}
            </div>
            {/* Status Indicator */}
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-[#55DEE8] rounded-full border-[3px] border-[#0A0A0A] z-30" />
          </div>
        </div>
      </div>

      {/* Middle Section: Details */}
      <div className="flex-1 pt-6 px-4 pb-2 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tighter mb-0.5" style={HEADING_STYLE}>{team.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[#55DEE8] font-black text-[8px] uppercase tracking-widest flex items-center gap-1.5">
                {team.sportType === 'Cricket' ? <Trophy size={10} /> : <Activity size={10} />}
                {team.sportType}
              </span>
            </div>
            <p className="text-gray-600 text-[8px] font-bold uppercase tracking-widest mt-0.5">@ {team.city || 'Global'}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-[8px] border border-white/10 text-white/40 hover:text-[#55DEE8] transition-colors">
            <Star size={16} />
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/5 mb-3">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-white/5 rounded-[8px] border border-white/10">
                <Users size={14} className="text-[#55DEE8]" />
             </div>
             <div>
                <p className="text-sm font-black text-white leading-none mb-0.5">{team.memberCount || 1}</p>
                <p className="text-[6px] text-gray-500 font-black uppercase tracking-widest">Members</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="p-2 bg-white/5 rounded-[8px] border border-white/10">
                <Target size={14} className="text-[#55DEE8]" />
             </div>
             <div>
                <p className="text-sm font-black text-white leading-none mb-0.5">{team.matchesPlayed || 0}</p>
                <p className="text-[6px] text-gray-500 font-black uppercase tracking-widest">Matches</p>
             </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
           <Link 
              to={`/team/${team._id}`}
              className="h-12 text-black rounded-[8px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_5px_15px_rgba(85,222,232,0.2)]"
              style={{ background: GRAD }}
           >
              <UserPlus size={14} strokeWidth={3} />
              Join Team
           </Link>
           <Link 
              to={`/team/${team._id}`}
              className="h-12 bg-transparent border-2 border-white/10 text-white rounded-[8px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
           >
              <Swords size={14} />
              Challenge
           </Link>
        </div>

        <Link 
          to={`/team-pass/${team._id}`}
          className="mt-3 flex items-center justify-center gap-2 text-gray-600 hover:text-[#55DEE8] text-[9px] font-black uppercase tracking-[0.2em] transition-all"
        >
          View Team Pass <ChevronRight size={12} />
        </Link>
      </div>
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
  const [userLocation, setUserLocation] = useState(null);
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
  const MOVEMENT_THRESHOLD_METERS = 10;
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
      
      if (nearby.length >= 2) {
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
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          profilePicture: currentUser?.profilePicture || currentUser?.profileImage
        };
        setUserLocation(newLocation);
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
    if (snapState !== 'COLLAPSED') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [snapState]);

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
      const res = await axiosInstance.get("/api/user/players", {
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
        const mapPlayers = res.data.players.map(p => ({
          _id: p.id || p._id,
          name: p.name,
          username: p.username,
          profilePicture: p.profilePicture,
          lat: p.locationData.coordinates[1],
          lng: p.locationData.coordinates[0],
          distanceKm: p.distanceKm,
          city: p.city,
          sportTypes: p.sportTypes
        }));
        const mocks = userLocation ? MOCK_PLAYERS.map(m => ({
          ...m,
          lat: userLocation.lat + m.latOffset,
          lng: userLocation.lng + m.lngOffset,
          profilePicture: "https://pngimg.com/d/cricket_PNG102.png",
          distanceKm: 0.5,
          sportTypes: [m.sport]
        })) : [];

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
      setIsRadiusChanging(true);
      fetchNearbyPlayers();
      setTimeout(() => setIsRadiusChanging(false), 500);
      
      const interval = setInterval(fetchNearbyPlayers, HEARTBEAT_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [userLocation, fetchNearbyPlayers, selectedRadius]);

  useEffect(() => {
    if (!socket || !userLocation || snapState === 'COLLAPSED' || !isLocationSharing) return;
    
    socket.emit("location:start", {
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
        }
        return prev;
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
  }, [filters, searchQuery, selectedRadius, userLocation]);

  useEffect(() => {
    if (activeTab === "players") fetchPlayers();
    else fetchTeams();
  }, [activeTab, fetchPlayers, fetchTeams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "players") fetchPlayers();
      else fetchTeams();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, fetchPlayers, fetchTeams]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFollowToggle = async (targetUserId) => {
    gateInteraction(async () => {
      const isFollowing = followingIds.includes(targetUserId);
      try {
        const endpoint = `/api/user/players/${targetUserId}/${isFollowing ? 'unfollow' : 'follow'}`;
        await axiosInstance.post(endpoint);
        if (isFollowing) {
          setFollowingIds(prev => prev.filter(id => id !== targetUserId));
          toast.success("Unfollowed player");
        } else {
          setFollowingIds(prev => [...prev, targetUserId]);
          toast.success("Following player");
        }
      } catch (error) {
        toast.error("Failed to update follow status");
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
    const threshold = 50;
    const velocity = info.velocity.y;
    const currentHeight = SNAP_STATES[snapState];
    
    if (velocity > threshold) {
      if (snapState === "EXPANDED") setSnapState("HALF");
      else if (snapState === "HALF") setSnapState("COLLAPSED");
    } else if (velocity < -threshold) {
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
                  <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 px-4 rounded-[8px] shadow-2xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#55DEE8] rounded-full animate-pulse shadow-[0_0_10px_#55DEE8]" />
                        <span className="text-white text-[11px] font-black uppercase tracking-widest">Live Map</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-[#55DEE8]" />
                        <span className="text-[#55DEE8] text-[11px] font-black">{allNearbyPlayers.length}</span>
                        <span className="text-white/40 text-[9px] font-bold uppercase">Players</span>
                      </div>

                      {allNearbyPlayers.length === 0 && userLocation && !locationError && (
                        <>
                          <div className="w-px h-3 bg-white/10" />
                          <div className="flex items-center gap-1.5">
                            <AlertCircle size={12} className="text-white/40" />
                            <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">
                              No players nearby in {selectedRadius}KM
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                      <button 
                        onClick={toggleLocationSharing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[8px] border transition-all duration-300 backdrop-blur-xl shadow-2xl ${ isLocationSharing ? "bg-[#55DEE8]/20 border-[#55DEE8]/30 text-[#55DEE8]" : "bg-red-500/10 border-red-500/20 text-red-500" }`}
                      >
                        {isLocationSharing ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {isLocationSharing ? "Visible" : "Hidden"}
                        </span>
                      </button>
                    </div>
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

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-xs">
                    <div className="bg-black/80 backdrop-blur-2xl border border-[#55DEE8]/30 rounded-[8px] p-1.5 px-6 flex items-center justify-between shadow-2xl">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Radius</span>
                        <div className="flex items-center gap-1">
                          {[5, 10, 20, 50, 100].map(r => (
                              <button 
                                key={r}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRadius(r);
                                }}
                                className={`min-w-[40px] px-2 py-1.5 rounded-full text-[9px] font-black transition-all uppercase ${selectedRadius === r ? "bg-[#55DEE8] text-black shadow-[0_0_15px_rgba(85,222,232,0.4)]" : "text-white/40 hover:text-white/70"}`}
                              >
                                {r}KM
                              </button>
                          ))}
                        </div>
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

              {/* Mobile/Tab Location Filter */}
              <div className="relative group lg:hidden">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8]" size={10} />
                <input 
                  type="text"
                  placeholder="LOCATION..."
                  value={filters.city || ""}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#55DEE8] focus:border-[#55DEE8]/50 outline-none w-24 md:w-28 placeholder:text-white/20"
                />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[360px] bg-white/[0.02] border border-white/5 rounded-[8px] animate-pulse" />
              ))}
            </div>
          ) : activeTab === "players" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {players.map((player, idx) => (
                <div key={player.id || player._id} id={`player-card-${player.id || player._id}`} className="transition-all duration-500">
                  <PlayerCard 
                    player={player} 
                    rank={idx}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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