/* eslint-disable no-restricted-imports */
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { useSelector, useDispatch } from "react-redux";
import useTurfData from "../features/turf/hooks/useTurfData";
import DashboardHero from "./HomeSections/DashboardHero";
import VenuesSection from "./HomeSections/VenuesSection";
import PlayersSection from "./HomeSections/PlayersSection";
import SocialArenaSection from "./HomeSections/SocialArenaSection";
import Community from "../features/networking/pages/Community";
import JoinGamesSection from "./HomeSections/JoinGamesSection";
import ProfessionalsSection from "./HomeSections/ProfessionalsSection";
import { AdBannerSection } from "../shared/components/Marketing/AdBannerSection";
import InterestsModal from "../shared/components/modals/InterestsModal";
import toast from "react-hot-toast";
import { updateUser, followUser, unfollowUser } from "@redux/slices/authSlice";
import { useGetReelsFeedQuery } from "@redux/api/reelsApi";
import { useGetFeaturesFlagsQuery, useGetMarketingContentQuery } from "@redux/api/featuresApi";
import { useGetStatesListQuery, useGetCitiesListQuery } from "@redux/api/locationApi";
import { useListGamesQuery } from "@redux/api/gamesApi";
import { useGetProfessionalsListQuery } from "@redux/api/professionalApi";

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, followingIds = [] } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const activeReel = searchParams.get('reel');
  const [showInterestsModal, setShowInterestsModal] = useState(false);

  useEffect(() => {
    if (activeReel) {
      navigate(`/community?reel=${activeReel}`);
    }
  }, [activeReel, navigate]);

  useEffect(() => {
    if (user && user.isNewUser && (!user.interests || user.interests.length === 0)) {
      setShowInterestsModal(true);
    }
  }, [user]);

  const { data: featureFlags = {} } = useGetFeaturesFlagsQuery();
  const { data: marketingContent } = useGetMarketingContentQuery();

  const [selectedHomeState, setSelectedHomeState] = useState("");
  const [selectedHomeCity, setSelectedHomeCity] = useState("");
  const [selectedGameSport, setSelectedGameSport] = useState("all");

  const { data: states = [], isLoading: loadingStates } = useGetStatesListQuery();
  const { data: cities = [], isLoading: loadingCities } = useGetCitiesListQuery(
    selectedHomeState,
    { skip: !selectedHomeState }
  );

  const { data: hostedGamesResp, isLoading: hostedGamesLoading } = useListGamesQuery({
    state: selectedHomeState,
    city: selectedHomeCity,
    sport: selectedGameSport === 'all' ? undefined : selectedGameSport,
    status: 'open'
  });
  const hostedGames = hostedGamesResp?.data || [];

  const { data: professionalsResp, isLoading: professionalsLoading } = useGetProfessionalsListQuery({
    state: selectedHomeState,
    city: selectedHomeCity,
    limit: 6
  });
  const professionals = professionalsResp?.data || [];

  const { data: reelsFeedResp } = useGetReelsFeedQuery();
  const reelsFeed = reelsFeedResp?.reels || [];

  const userLocation = useSelector((state) => state.ui.userLocation);
  const locationStatus = useSelector((state) => state.ui.locationStatus);

  const [playerFilters, setPlayerFilters] = useState({});
  const [turfFilters, setTurfFilters] = useState({});

  const combinedTurfFilters = useMemo(() => {
    if (locationStatus === "detecting") return { _skip: true };
    const base = { ...turfFilters };
    if (userLocation && userLocation.lat && userLocation.lng) {
      base.lat = userLocation.lat;
      base.lng = userLocation.lng;
    } else if (locationStatus === "denied") {
      base.city = "Hyderabad";
      base.state = "Telangana";
    }
    return base;
  }, [turfFilters, userLocation, locationStatus]);

  const { turfs, loading: turfLoading, error } = useTurfData(combinedTurfFilters);

  useEffect(() => {
    if (locationStatus === "granted" && userLocation) {
      setTurfFilters(prev => ({
        ...prev,
        state: userLocation.state || "",
        city: userLocation.city || "",
      }));
    } else if (locationStatus === "denied") {
      setTurfFilters(prev => ({ ...prev, state: "", city: "" }));
    }
  }, [locationStatus, userLocation]);

  const displayTurfs = useMemo(() => {
    if (!turfs || turfs.length === 0) return [];
    let sortedAll = [...turfs].sort((a, b) => (b.averageRating ?? b.rating ?? 0) - (a.averageRating ?? a.rating ?? 0));
    
    // Apply local sport filter from VenueSection if present
    if (turfFilters.sport && turfFilters.sport !== "all") {
        sortedAll = sortedAll.filter(t => t.sports?.includes(turfFilters.sport) || t.sportTypes?.includes(turfFilters.sport));
    }

    if (!userLocation || (!userLocation.city && !userLocation.state)) {
      return sortedAll;
    }
    
    const cityMatches = sortedAll.filter(t => t.city?.toLowerCase() === userLocation.city?.toLowerCase());
    const stateMatches = sortedAll.filter(t => t.city?.toLowerCase() !== userLocation.city?.toLowerCase() && t.state?.toLowerCase() === userLocation.state?.toLowerCase());
    const otherMatches = sortedAll.filter(t => t.city?.toLowerCase() !== userLocation.city?.toLowerCase() && t.state?.toLowerCase() !== userLocation.state?.toLowerCase());
    
    return [...cityMatches, ...stateMatches, ...otherMatches];
  }, [turfs, userLocation, turfFilters.sport]);

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locationStatus === "detecting") return;
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const params = {
          ...playerFilters,
          sortBy: "newest",
        };
        if (userLocation?.lat && userLocation?.lng) {
            params.lat = userLocation.lat;
            params.lng = userLocation.lng;
            params.radius = 50;
        }
        const res = await axiosInstance.get("/api/user/players", { params });
        setPlayers(res.data.players || []);
      } catch (error) {
        console.error("Error fetching players:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [playerFilters, userLocation, locationStatus]);



  const handleFollowToggle = async (e, p) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    const playerId = p?._id || p?.id;
    if (!playerId) return;

    if (!user) {
      toast.error("Please login to follow players");
      return;
    }
    const isFollowing = followingIds.includes(playerId);
    
    // Optimistic Update
    dispatch(isFollowing ? unfollowUser(playerId) : followUser(playerId));

    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      await axiosInstance.post(`/api/user/players/${playerId}/${endpoint}`);
    } catch (err) {
      // Revert on error
      dispatch(isFollowing ? followUser(playerId) : unfollowUser(playerId));
      toast.error(err.response?.data?.message || err.message || "Failed to update follow status");
    }
  };

  const [isCommunitySearchActive, setIsCommunitySearchActive] = useState(false);
  const shouldHideRest = isCommunitySearchActive;

  return (

    <div className="bg-[#050505] min-h-screen text-white font-sans w-full max-w-[100vw] overflow-x-hidden pt-0 pb-16 lg:pb-0">
      <div className="px-2 md:px-4 lg:px-2 lg:pl-4 max-w-[1400px] mt-0 mb-4">
        <Community onSearchActive={setIsCommunitySearchActive}>
          {/* -- HERO DASHBOARD -- */}
          <DashboardHero user={user} />

          {/* -- AD BANNERS -- */}
          <AdBannerSection banners={marketingContent?.banners || []} />

          {/* -- FIND YOUR ARENA -- */}
          <VenuesSection
            userLocation={userLocation}
            loading={loading}
            turfLoading={turfLoading}
            error={error}
            displayTurfs={displayTurfs}
            setTurfFilters={setTurfFilters}
          />

          {/* -- FIND PLAYERS NEAR YOU -- */}
          <PlayersSection
            loading={loading}
            players={players}
            followingIds={followingIds}
            handleFollowToggle={handleFollowToggle}
          />

          {/* -- SOCIAL ARENA -- */}
          <SocialArenaSection reelsFeed={reelsFeed} />

          {/* -- JOIN GAMES NEAR YOU (Feature Flag) -- */}
          <JoinGamesSection
            featureFlags={featureFlags}
            selectedHomeState={selectedHomeState}
            setSelectedHomeState={setSelectedHomeState}
            selectedHomeCity={selectedHomeCity}
            setSelectedHomeCity={setSelectedHomeCity}
            states={states}
            loadingStates={loadingStates}
            cities={cities}
            loadingCities={loadingCities}
            selectedGameSport={selectedGameSport}
            setSelectedGameSport={setSelectedGameSport}
            hostedGames={hostedGames}
            hostedGamesLoading={hostedGamesLoading}
          />

          <div className={shouldHideRest ? 'hidden' : ''}>
            {/* -- FIND PROFESSIONALS (Feature Flag) -- */}
            <ProfessionalsSection
              featureFlags={featureFlags}
              professionals={professionals}
              professionalsLoading={professionalsLoading}
            />
          </div>
        </Community>
      </div>

      <InterestsModal
        isOpen={showInterestsModal}
        onClose={() => setShowInterestsModal(false)}
        onSave={async (selectedInterests) => {
          try {
            await dispatch(updateUser({ interests: selectedInterests })).unwrap();
            setShowInterestsModal(false);
          } catch (err) {
            console.error("Failed to update interests:", err);
          }
        }}
      />
    </div>
  );
}









