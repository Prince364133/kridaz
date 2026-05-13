import { createBrowserRouter, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Layouts
import { AdminLayout, PartnerLayout, GuestLayout, CoachLayout, UmpireLayout, StreamerLayout, ScorerLayout } from "@layouts";
import UserRoot from "@user/layouts/Root";

// User Portal Pages (via @user alias)
import UserHome from "@user/pages/Home";
import UserLogin from "@user/pages/auth/Login";
import UserSignUp from "@user/pages/auth/SignUp";
import ForgotPassword from "@user/pages/auth/ForgotPassword";
import UserTurf from "@user/components/turf/Turf";
import UserTurfDetails from "@user/components/turf/TurfDetails";
import UserTurfBookingHistory from "@user/components/turf/TurfBookingHistory";
import UserProfile from "@user/pages/Profile";
import UserBlogs from "@user/pages/Blogs";
import UserBlogDetail from "@user/pages/BlogDetail";
import Community from "@user/pages/Community";
import FindPlayers from "@user/pages/FindPlayers";
import UserWallet from "@user/pages/Wallet";
import BookingPass from "@user/pages/BookingPass";
import BookingInvoice from "@user/pages/BookingInvoice";
import HostGame from "@user/pages/HostGame";
import JoinGames from "@user/pages/JoinGames";
import MyHostedGames from "@user/pages/MyHostedGames";
import MyJoinedGames from "@user/pages/MyJoinedGames";
import FindProfessionals from "@user/pages/FindProfessionals";
import ProfessionalDetails from "@user/pages/ProfessionalDetails";
import Messages from "@user/pages/Messages";
import MyTeams from "@user/pages/MyTeams";
import CheckoutPage from "@user/pages/checkout/CheckoutPage";
import ScoringApp from "@user/pages/ScoringApp";
import MatchAnalytics from "@user/pages/MatchAnalytics";
import MatchDetails from "@user/pages/MatchDetails";
import Leaderboard from "@user/pages/Leaderboard";
import LiveOverlay from "@user/pages/LiveOverlay";
import LiveScoreboard from "@user/pages/LiveScoreboard";


// Business Landing Pages (User Portal)
import UserVenueOwnerLanding from "@user/pages/business/VenueOwnerLanding";
import UserCoachLanding from "@user/pages/business/CoachLanding";
import UserUmpireLanding from "@user/pages/business/UmpireLanding";
import UserStreamerLanding from "@user/pages/business/StreamerLanding";
import UserScorerLanding from "@user/pages/business/ScorerLanding";
import BusinessRegistration from "@user/pages/business/BusinessRegistration";
// Owner Portal Pages
import PartnersGateway from "@pages/PartnersGateway";
import VenueOwnerSignUp from "@pages/VenueOwnerSignUp";
import CoachSignUp from "@pages/CoachSignUp";
import UmpireSignUp from "@pages/UmpireSignUp";
import ScorerSignUp from "@pages/ScorerSignUp";
import StreamerSignUp from "@user/pages/auth/StreamerSignUp";

import StreamSetup from "./components/streamer/StreamSetup";
import ManageStream from "./pages/ManageStream";
import TickerGallery from "./components/streamer/TickerGallery";
import { YouTubeConnected, YouTubeError } from "@pages/YouTubeAuthStatus";
import { FacebookConnected, FacebookError } from "@pages/FacebookAuthStatus";

import {
  AddTurf,
  EditTurf,
  TurfManagement,
  TurfDetails,
  OwnerDashboard,
  OwnerReviews as PartnerReviews,
  OwnerBookings as PartnerBookings,
  CustomerDirectory,
  VenueIntelligence,
  OwnerRevenue,
  OwnerPromotions,
  PayoutBanking,
} from "@components/owner";
import CoachDashboard from "./components/coach/CoachDashboard";
import CoachStudents from "./components/coach/CoachStudents";
import CoachSessions from "./components/coach/CoachSessions";
import CoachMasterclass from "./components/coach/CoachMasterclass";
import UmpireDashboard from "./components/umpire/UmpireDashboard";
import UmpireMatches from "./components/umpire/UmpireMatches";
import UmpireSchedule from "./components/umpire/UmpireSchedule";

import StreamerDashboard from "./components/streamer/StreamerDashboard";
import StreamerMatches from "./components/streamer/StreamerMatches";
import StreamerSchedule from "./components/streamer/StreamerSchedule";
import UmpireFeedback from "./components/umpire/UmpireFeedback";
import ScorerDashboard from "./components/scorer/ScorerDashboard";
import ScorerMatches from "./components/scorer/ScorerMatches";

import ProfessionalAvailability from "./components/professional/ProfessionalAvailability";
import ProfessionalBookings from "./components/professional/ProfessionalBookings";
import ProfessionalReviews from "./components/professional/ProfessionalReviews";
import ProfessionalProfile from "./components/professional/ProfessionalProfile";

import {
  UserManagement,
  VerificationCenter,
  AdminDashboard,
  OwnerViewer as PartnerViewer,
  TurfList,
  AllTurf,
  VenueApprovalDetail,
  TransactionSection,
  FeatureFlags,
  MarketingManagement,
  BlogManagement,
  CommunityManagement,
  ProfessionalManagement,
  SupportCenter,
  DisputeManager,
  AuditLogs,
  FinancialMissionControl,
  ProfessionalDetailsPage,
  HostedGamesPage,
} from "@components/admin";
import PartnerSupport from "@components/owner/Support/PartnerSupport";
import DashboardProfile from "@components/shared/DashboardProfile";
import ProtectedRoute from "@components/ProtectedRoute/ProtectedRoute";
import PublicRoute from "@components/ProtectedRoute/PublicRoute";
import { NotFound, RootRedirect, ErrorBoundary } from "@components/common";

const router = createBrowserRouter([
  // ── ADMIN PORTAL (High Priority) ──
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      {
        path: "verification-center",
        element: <VerificationCenter />,
      },
      {
        path: "professionals",
        children: [
          { path: "coaches", element: <ProfessionalManagement role="coach" /> },
          { path: "umpires", element: <ProfessionalManagement role="umpire" /> },
          { path: "streamers", element: <ProfessionalManagement role="streamer" /> },
          { path: ":id", element: <ProfessionalDetailsPage /> }
        ],
      },
      { path: "users", element: <UserManagement /> },
      {
        path: "owners",
        children: [
          { path: "", element: <PartnerViewer /> },
          { path: ":ownerId/turf", element: <TurfList /> },
        ],
      },
      { path: "turfs", element: <AllTurf /> },
      { path: "turfs/:id", element: <VenueApprovalDetail /> },
      { path: "transactions", element: <TransactionSection /> },
      { path: "support", element: <SupportCenter /> },
      { path: "disputes", element: <DisputeManager /> },
      { path: "audit", element: <AuditLogs /> },
      { path: "finance", element: <FinancialMissionControl /> },
      { path: "features", element: <FeatureFlags /> },
      { path: "marketing", element: <MarketingManagement /> },
      { path: "blogs", element: <BlogManagement /> },
      { path: "community", element: <CommunityManagement /> },
      { path: "games", element: <HostedGamesPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // ── PARTNER PORTAL (High Priority) ──
  {
    path: "/partner",
    element: (
      <ProtectedRoute requiredRole="owner">
        <PartnerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OwnerDashboard /> },
      { path: "add-turf", element: <AddTurf /> },
      { path: "turfs", element: <TurfManagement /> },
      { path: "turf/:id", element: <TurfDetails /> },
      { path: "edit-turf/:id", element: <EditTurf /> },
      { path: "reviews", element: <PartnerReviews /> },
      { path: "bookings", element: <PartnerBookings /> },
      { path: "customers", element: <CustomerDirectory /> },
      { path: "intelligence", element: <VenueIntelligence /> },
      { path: "revenue", element: <OwnerRevenue /> },
      { path: "promotions", element: <OwnerPromotions /> },
      { path: "support", element: <PartnerSupport /> },
      { path: "banking", element: <PayoutBanking /> },
      { path: "profile", element: <DashboardProfile /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // ── COACH PORTAL (High Priority) ──
  {
    path: "/coach",
    element: (
      <ProtectedRoute requiredRole="coach">
        <CoachLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CoachDashboard /> },
      { path: "students", element: <CoachStudents /> },
      { path: "sessions", element: <CoachSessions /> },
      { path: "masterclass", element: <CoachMasterclass /> },
      { path: "availability", element: <ProfessionalAvailability /> },
      { path: "bookings", element: <ProfessionalBookings /> },
      { path: "reviews", element: <ProfessionalReviews /> },
      { path: "revenue", element: <OwnerRevenue /> },
      { path: "support", element: <PartnerSupport /> },
      { path: "banking", element: <PayoutBanking /> },
      { path: "profile", element: <ProfessionalProfile /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // ── UMPIRE PORTAL (High Priority) ──
  {
    path: "/umpire",
    element: (
      <ProtectedRoute requiredRole="umpire">
        <UmpireLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <UmpireDashboard /> },
      { path: "matches", element: <UmpireMatches /> },
      { path: "schedule", element: <UmpireSchedule /> },
      { path: "availability", element: <ProfessionalAvailability /> },
      { path: "bookings", element: <ProfessionalBookings /> },
      { path: "reviews", element: <ProfessionalReviews /> },
      { path: "revenue", element: <OwnerRevenue /> },
      { path: "support", element: <PartnerSupport /> },
      { path: "banking", element: <PayoutBanking /> },
      { path: "profile", element: <ProfessionalProfile /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  
  // ── STREAMER PORTAL ──
  {
    path: "/streamer",
    element: (
      <ProtectedRoute requiredRole="streamer">
        <StreamerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <StreamerDashboard /> },
      { path: "matches", element: <StreamerMatches /> },
      { path: "manage/:matchId", element: <ManageStream /> },
      { path: "ticker-gallery/:matchId?", element: <TickerGallery /> },
      { path: "schedule", element: <StreamerSchedule /> },
      { path: "revenue", element: <OwnerRevenue /> },
      { path: "support", element: <PartnerSupport /> },
      { path: "banking", element: <PayoutBanking /> },
      { path: "profile", element: <ProfessionalProfile /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // ── SCORER PORTAL ──
  {
    path: "/scorer",
    element: (
      <ProtectedRoute requiredRole="scorer">
        <ScorerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ScorerDashboard /> },
      { path: "matches", element: <ScorerMatches /> },
      { path: "schedule", element: <UmpireSchedule /> },
      { path: "availability", element: <ProfessionalAvailability /> },
      { path: "bookings", element: <ProfessionalBookings /> },
      { path: "reviews", element: <ProfessionalReviews /> },
      { path: "revenue", element: <OwnerRevenue /> },
      { path: "support", element: <PartnerSupport /> },
      { path: "banking", element: <PayoutBanking /> },
      { path: "profile", element: <ProfessionalProfile /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  {
    path: "/matches/:id/stream-setup",
    element: (
      <ProtectedRoute requiredRole="streamer">
        <StreamSetup />
      </ProtectedRoute>
    ),
  },

  {
    path: "/scoring/:matchId",
    element: (
      <ProtectedRoute requiredRole={["scorer"]}>
        <ScoringApp />
      </ProtectedRoute>
    ),
  },
  // ── USER PORTAL (Fall-through Priority) ──
  {
    path: "/",
    element: <UserRoot />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <RootRedirect /> },
      { path: "login", element: <PublicRoute><UserLogin /></PublicRoute> },
      { path: "signup", element: <PublicRoute><UserSignUp /></PublicRoute> },
      { path: "auth/login", element: <PublicRoute><UserLogin /></PublicRoute> },
      { path: "auth/signup", element: <PublicRoute><UserSignUp /></PublicRoute> },
      { path: "forgot-password", element: <PublicRoute><ForgotPassword /></PublicRoute> },
      { path: "turfs", element: <UserTurf /> },
      { path: "turf/:id", element: <UserTurfDetails /> },
      { path: "profile/:userId?", element: <ProtectedRoute><UserProfile /></ProtectedRoute> },
      { path: "blogs", element: <UserBlogs /> },
      { path: "blogs/:id", element: <UserBlogDetail /> },
      { path: "community", element: <Community /> },
      { path: "players", element: <FindPlayers /> },
      { path: "host-game", element: <ProtectedRoute><HostGame /></ProtectedRoute> },
      { path: "join-games", element: <JoinGames /> },
      { path: "matches/:matchId/stream-setup", element: <ProtectedRoute><StreamSetup /></ProtectedRoute> },
      { path: "youtube-connected", element: <YouTubeConnected /> },
      { path: "youtube-error", element: <YouTubeError /> },
      { path: "facebook-connected", element: <FacebookConnected /> },
      { path: "facebook-error", element: <FacebookError /> },
      { path: "my-hosted-games", element: <ProtectedRoute><MyHostedGames /></ProtectedRoute> },
      { path: "my-joined-games", element: <ProtectedRoute><MyJoinedGames /></ProtectedRoute> },
      { path: "match/:matchId", element: <ProtectedRoute><MatchDetails /></ProtectedRoute> },

      { path: "professionals", element: <FindProfessionals /> },
      { path: "professionals/:id", element: <ProfessionalDetails /> },
      { path: "messages", element: <ProtectedRoute><Messages /></ProtectedRoute> },
      { path: "my-teams", element: <ProtectedRoute><MyTeams /></ProtectedRoute> },

      
      // Business Landings
      { path: "business/venue", element: <UserVenueOwnerLanding /> },
      { path: "business/coach", element: <UserCoachLanding /> },
      { path: "business/official", element: <UserUmpireLanding /> },
      { path: "business/streamer", element: <UserStreamerLanding /> },
      { path: "business/scorer", element: <UserScorerLanding /> },
      { path: "business/register", element: <BusinessRegistration /> },
      
      // Business Auth
      { path: "signup/venue", element: <PublicRoute><VenueOwnerSignUp /></PublicRoute> },
      { path: "signup/coach", element: <PublicRoute><CoachSignUp /></PublicRoute> },
      { path: "signup/official", element: <PublicRoute><UmpireSignUp /></PublicRoute> },
      { path: "signup/streamer", element: <PublicRoute><StreamerSignUp /></PublicRoute> },
      { path: "signup/scorer", element: <PublicRoute><ScorerSignUp /></PublicRoute> },
      { path: "wallet", element: <ProtectedRoute><UserWallet /></ProtectedRoute> },
      { path: "booking-history", element: <ProtectedRoute><UserTurfBookingHistory /></ProtectedRoute> },
      { path: "checkout/:turfId", element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
      { path: "booking-pass/:id", element: <BookingPass /> },
      { path: "booking-invoice/:id", element: <BookingInvoice /> },
      { path: "analytics/:matchId", element: <MatchAnalytics /> },
      { path: "leaderboard", element: <Leaderboard /> },
      { path: "live-overlay/:matchId", element: <LiveOverlay /> },
      { path: "live-score/:matchId", element: <LiveScoreboard /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // ── LEGACY & REDIRECTS ──
  { path: "/owner", element: <Navigate to="/partner" replace /> },
  { path: "/venue-owner", element: <Navigate to="/business/venue" replace /> },
  { path: "/coach-landing", element: <Navigate to="/business/coach" replace /> },
  { path: "/umpire-landing", element: <Navigate to="/business/official" replace /> },
  { path: "/partners", element: <PartnersGateway /> },
  
  // Catch-all (Global)
  { path: "*", element: <NotFound /> },
]);

export default router;
