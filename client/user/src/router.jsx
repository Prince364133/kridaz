import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// ── Eager: Layouts (used on nearly every route — small files, no split benefit) ──
import { AdminLayout, PartnerLayout, GuestLayout, CoachLayout, UmpireLayout, StreamerLayout, ScorerLayout } from "@layouts";
import UserRoot from "@user/layouts/Root";

// ── Eager: Route guards & error utilities (must be synchronous) ──
import ProtectedRoute from "@components/ProtectedRoute/ProtectedRoute";
import PublicRoute from "@components/ProtectedRoute/PublicRoute";
import { NotFound, RootRedirect, ErrorBoundary } from "@components/common";

// ── Spinner shown while any lazy chunk loads ──────────────────────────────────
const PageLoader = () => (
  <>
    <style>{`@keyframes _pg_spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "3px solid #e5e7eb", borderTopColor: "#10b981",
        animation: "_pg_spin 0.8s linear infinite"
      }} />
    </div>
  </>
);

// ── Lazy: User Portal Pages ───────────────────────────────────────────────────
const UserHome               = lazy(() => import("@user/pages/Home"));
const UserLogin              = lazy(() => import("@user/pages/auth/Login"));
const UserSignUp             = lazy(() => import("@user/pages/auth/SignUp"));
const ForgotPassword         = lazy(() => import("@user/pages/auth/ForgotPassword"));
const UserTurf               = lazy(() => import("@user/components/turf/Turf"));
const UserTurfDetails        = lazy(() => import("@user/components/turf/TurfDetails"));
const UserTurfBookingHistory = lazy(() => import("@user/components/turf/TurfBookingHistory"));
const UserProfile            = lazy(() => import("@user/pages/Profile"));
const UserBlogs              = lazy(() => import("@user/pages/Blogs"));
const UserBlogDetail         = lazy(() => import("@user/pages/BlogDetail"));
const Community              = lazy(() => import("@user/pages/Community"));
const FindPlayers            = lazy(() => import("@user/pages/FindPlayers"));
const UserWallet             = lazy(() => import("@user/pages/Wallet"));
const BookingPass            = lazy(() => import("@user/pages/BookingPass"));
const BookingInvoice         = lazy(() => import("@user/pages/BookingInvoice"));
const HostGame               = lazy(() => import("@user/pages/HostGame"));
const JoinGames              = lazy(() => import("@user/pages/JoinGames"));
const MyHostedGames          = lazy(() => import("@user/pages/MyHostedGames"));
const MyJoinedGames          = lazy(() => import("@user/pages/MyJoinedGames"));
const FindProfessionals      = lazy(() => import("@user/pages/FindProfessionals"));
const ProfessionalDetails    = lazy(() => import("@user/pages/ProfessionalDetails"));
const Messages               = lazy(() => import("@user/pages/Messages"));
const MyTeams                = lazy(() => import("@user/pages/MyTeams"));
const CheckoutPage           = lazy(() => import("@user/pages/checkout/CheckoutPage"));
const ScoringApp             = lazy(() => import("@user/pages/ScoringApp"));
const MatchAnalytics         = lazy(() => import("@user/pages/MatchAnalytics"));
const MatchDetails           = lazy(() => import("@user/pages/MatchDetails"));
const Leaderboard            = lazy(() => import("@user/pages/Leaderboard"));
const LiveOverlay            = lazy(() => import("@user/pages/LiveOverlay"));
const LiveScoreboard         = lazy(() => import("@user/pages/LiveScoreboard"));
const TeamPass               = lazy(() => import("@user/pages/TeamPass"));
const TeamProfile            = lazy(() => import("@user/pages/TeamProfile"));
const ReelsFeed              = lazy(() => import("@user/pages/reels/ReelsFeed"));
const UploadReel             = lazy(() => import("@user/pages/reels/UploadReel"));
const ReelAnalytics          = lazy(() => import("@user/pages/reels/ReelAnalytics"));

// ── Lazy: Business Landing Pages ─────────────────────────────────────────────
const UserVenueOwnerLanding  = lazy(() => import("@user/pages/business/VenueOwnerLanding"));
const UserCoachLanding       = lazy(() => import("@user/pages/business/CoachLanding"));
const UserUmpireLanding      = lazy(() => import("@user/pages/business/UmpireLanding"));
const UserStreamerLanding     = lazy(() => import("@user/pages/business/StreamerLanding"));
const UserScorerLanding      = lazy(() => import("@user/pages/business/ScorerLanding"));
const BusinessRegistration   = lazy(() => import("@user/pages/business/BusinessRegistration"));

// ── Lazy: Legal Pages ─────────────────────────────────────────────────────────
const PrivacyPolicy              = lazy(() => import("@user/pages/legal/PrivacyPolicy"));
const TermsOfService             = lazy(() => import("@user/pages/legal/TermsOfService"));
const DataDeletionInstructions   = lazy(() => import("@user/pages/legal/DataDeletionInstructions"));

// ── Lazy: Owner / Partner Portal Pages ───────────────────────────────────────
const PartnersGateway  = lazy(() => import("@pages/PartnersGateway"));
const VenueOwnerSignUp = lazy(() => import("@pages/VenueOwnerSignUp"));
const CoachSignUp      = lazy(() => import("@pages/CoachSignUp"));
const UmpireSignUp     = lazy(() => import("@pages/UmpireSignUp"));
const ScorerSignUp     = lazy(() => import("@pages/ScorerSignUp"));
const StreamerSignUp   = lazy(() => import("@user/pages/auth/StreamerSignUp"));

// ── Lazy: Streamer Components ─────────────────────────────────────────────────
const StreamSetup    = lazy(() => import("./components/streamer/StreamSetup"));
const ManageStream   = lazy(() => import("./pages/ManageStream"));
const TickerGallery  = lazy(() => import("./components/streamer/TickerGallery"));

// ── Lazy: YouTube / Facebook Auth Status ─────────────────────────────────────
// Named exports — use .then() to map to default for lazy()
const YouTubeConnected  = lazy(() => import("@pages/YouTubeAuthStatus").then(m => ({ default: m.YouTubeConnected })));
const YouTubeError      = lazy(() => import("@pages/YouTubeAuthStatus").then(m => ({ default: m.YouTubeError })));
const FacebookConnected = lazy(() => import("@pages/FacebookAuthStatus").then(m => ({ default: m.FacebookConnected })));
const FacebookError     = lazy(() => import("@pages/FacebookAuthStatus").then(m => ({ default: m.FacebookError })));

// ── Lazy: Owner (Partner) Portal Components ───────────────────────────────────
const AddTurf            = lazy(() => import("@components/owner/TurfManagement/AddTurf"));
const EditTurf           = lazy(() => import("@components/owner/TurfManagement/EditTurf"));
const TurfManagement     = lazy(() => import("@components/owner/TurfManagement/TurfManagement"));
const TurfDetails        = lazy(() => import("@components/owner/TurfManagement/TurfDetails"));
const OwnerDashboard     = lazy(() => import("@components/owner/Dashboard/OwnerDashboard"));
const PartnerReviews     = lazy(() => import("@components/owner/Review/OwnerReviews"));
const PartnerBookings    = lazy(() => import("@components/owner/Bookings/OwnerBookings"));
const CustomerDirectory  = lazy(() => import("@components/owner/Customers/CustomerDirectory"));
const VenueIntelligence  = lazy(() => import("@components/owner/Intelligence/VenueIntelligence"));
const OwnerRevenue       = lazy(() => import("@components/owner/Revenue/OwnerRevenue"));
const OwnerPromotions    = lazy(() => import("@components/owner/Promotions/OwnerPromotions"));
const PayoutBanking      = lazy(() => import("@components/owner/Banking/PayoutBanking"));
const PartnerSupport     = lazy(() => import("@components/owner/Support/PartnerSupport"));

// ── Lazy: Coach Portal Components ────────────────────────────────────────────
const CoachDashboard   = lazy(() => import("./components/coach/CoachDashboard"));
const CoachStudents    = lazy(() => import("./components/coach/CoachStudents"));
const CoachSessions    = lazy(() => import("./components/coach/CoachSessions"));
const CoachMasterclass = lazy(() => import("./components/coach/CoachMasterclass"));

// ── Lazy: Umpire Portal Components ───────────────────────────────────────────
const UmpireDashboard = lazy(() => import("./components/umpire/UmpireDashboard"));
const UmpireMatches   = lazy(() => import("./components/umpire/UmpireMatches"));
const UmpireSchedule  = lazy(() => import("./components/umpire/UmpireSchedule"));
const UmpireFeedback  = lazy(() => import("./components/umpire/UmpireFeedback"));

// ── Lazy: Streamer Portal Components ─────────────────────────────────────────
const StreamerDashboard = lazy(() => import("./components/streamer/StreamerDashboard"));
const StreamerMatches   = lazy(() => import("./components/streamer/StreamerMatches"));
const StreamerSchedule  = lazy(() => import("./components/streamer/StreamerSchedule"));

// ── Lazy: Scorer Portal Components ───────────────────────────────────────────
const ScorerDashboard = lazy(() => import("./components/scorer/ScorerDashboard"));
const ScorerMatches   = lazy(() => import("./components/scorer/ScorerMatches"));

// ── Lazy: Shared Professional Components ─────────────────────────────────────
const ProfessionalAvailability = lazy(() => import("./components/professional/ProfessionalAvailability"));
const ProfessionalBookings     = lazy(() => import("./components/professional/ProfessionalBookings"));
const ProfessionalReviews      = lazy(() => import("./components/professional/ProfessionalReviews"));
const ProfessionalProfile      = lazy(() => import("./components/professional/ProfessionalProfile"));
const DashboardProfile         = lazy(() => import("@components/shared/DashboardProfile"));

// ── Lazy: Admin Portal Components ────────────────────────────────────────────
const UserManagement         = lazy(() => import("@components/admin/UserManagement/UserPage"));
const VerificationCenter     = lazy(() => import("@components/admin/OwnerRequests/VerificationCenter"));
const AdminDashboard         = lazy(() => import("@components/admin/Dashboard/AdminDashboard"));
const PartnerViewer          = lazy(() => import("@components/admin/OwnerManagement/OwnerViewer"));
const TurfList               = lazy(() => import("@components/admin/Turf/TurfList"));
const AllTurf                = lazy(() => import("@components/admin/Turf/AllTurf"));
const VenueApprovalDetail    = lazy(() => import("@components/admin/Turf/VenueApprovalDetail"));
const TransactionSection     = lazy(() => import("@components/admin/Transactions/TransactionSection"));
const FeatureFlags           = lazy(() => import("@components/admin/FeatureFlags").then(m => ({ default: m.FeatureFlags })));
const MarketingManagement    = lazy(() => import("@components/admin/Marketing/MarketingManagement").then(m => ({ default: m.MarketingManagement })));
const BlogManagement         = lazy(() => import("@components/admin/Blogs/BlogManagement").then(m => ({ default: m.BlogManagement })));
const CommunityManagement    = lazy(() => import("@components/admin/Community/CommunityManagement"));
const ProfessionalManagement = lazy(() => import("@components/admin/ProfessionalManagement/ProfessionalManagement"));
const SupportCenter          = lazy(() => import("@components/admin/Resolution/SupportCenter"));
const DisputeManager         = lazy(() => import("@components/admin/Resolution/DisputeManager"));
const AuditLogs              = lazy(() => import("@components/admin/Audit/AuditLogs"));
const FinancialMissionControl = lazy(() => import("@components/admin/Finance/FinancialMissionControl"));
const ProfessionalDetailsPage = lazy(() => import("@components/admin/ProfessionalManagement/ProfessionalDetailsPage"));
const HostedGamesPage         = lazy(() => import("@components/admin/HostedGames/HostedGamesPage"));

// ── Shorthand wrapper — keeps route definitions terse ────────────────────────
const S = ({ children }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

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
      { index: true, element: <S><AdminDashboard /></S> },
      { path: "verification-center", element: <S><VerificationCenter /></S> },
      {
        path: "professionals",
        children: [
          { path: "coaches",   element: <S><ProfessionalManagement role="coach" /></S> },
          { path: "umpires",   element: <S><ProfessionalManagement role="umpire" /></S> },
          { path: "scorers",   element: <S><ProfessionalManagement role="scorer" /></S> },
          { path: "streamers", element: <S><ProfessionalManagement role="streamer" /></S> },
          { path: ":id",       element: <S><ProfessionalDetailsPage /></S> },
        ],
      },
      { path: "users",              element: <S><UserManagement /></S> },
      {
        path: "owners",
        children: [
          { path: "",              element: <S><PartnerViewer /></S> },
          { path: ":ownerId/turf", element: <S><TurfList /></S> },
        ],
      },
      { path: "turfs",        element: <S><AllTurf /></S> },
      { path: "turfs/:id",    element: <S><VenueApprovalDetail /></S> },
      { path: "transactions", element: <S><TransactionSection /></S> },
      { path: "support",      element: <S><SupportCenter /></S> },
      { path: "disputes",     element: <S><DisputeManager /></S> },
      { path: "audit",        element: <S><AuditLogs /></S> },
      { path: "finance",      element: <S><FinancialMissionControl /></S> },
      { path: "features",     element: <S><FeatureFlags /></S> },
      { path: "marketing",    element: <S><MarketingManagement /></S> },
      { path: "blogs",        element: <S><BlogManagement /></S> },
      { path: "community",    element: <S><CommunityManagement /></S> },
      { path: "games",        element: <S><HostedGamesPage /></S> },
      { path: "*",            element: <NotFound /> },
    ],
  },

  // ── PARTNER PORTAL (High Priority) ──
  {
    path: "/partner",
    element: (
      <ProtectedRoute requiredRole="venu_owners">
        <PartnerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,           element: <S><OwnerDashboard /></S> },
      { path: "add-turf",      element: <S><AddTurf /></S> },
      { path: "turfs",         element: <S><TurfManagement /></S> },
      { path: "turf/:id",      element: <S><TurfDetails /></S> },
      { path: "edit-turf/:id", element: <S><EditTurf /></S> },
      { path: "reviews",       element: <S><PartnerReviews /></S> },
      { path: "bookings",      element: <S><PartnerBookings /></S> },
      { path: "customers",     element: <S><CustomerDirectory /></S> },
      { path: "intelligence",  element: <S><VenueIntelligence /></S> },
      { path: "revenue",       element: <S><OwnerRevenue /></S> },
      { path: "promotions",    element: <S><OwnerPromotions /></S> },
      { path: "support",       element: <S><PartnerSupport /></S> },
      { path: "banking",       element: <S><PayoutBanking /></S> },
      { path: "profile",       element: <S><DashboardProfile /></S> },
      { path: "*",             element: <NotFound /> },
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
      { index: true,          element: <S><CoachDashboard /></S> },
      { path: "students",     element: <S><CoachStudents /></S> },
      { path: "sessions",     element: <S><CoachSessions /></S> },
      { path: "masterclass",  element: <S><CoachMasterclass /></S> },
      { path: "availability", element: <S><ProfessionalAvailability /></S> },
      { path: "bookings",     element: <S><ProfessionalBookings /></S> },
      { path: "reviews",      element: <S><ProfessionalReviews /></S> },
      { path: "revenue",      element: <S><OwnerRevenue /></S> },
      { path: "support",      element: <S><PartnerSupport /></S> },
      { path: "banking",      element: <S><PayoutBanking /></S> },
      { path: "profile",      element: <S><ProfessionalProfile /></S> },
      { path: "*",            element: <NotFound /> },
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
      { index: true,          element: <S><UmpireDashboard /></S> },
      { path: "matches",      element: <S><UmpireMatches /></S> },
      { path: "schedule",     element: <S><UmpireSchedule /></S> },
      { path: "availability", element: <S><ProfessionalAvailability /></S> },
      { path: "bookings",     element: <S><ProfessionalBookings /></S> },
      { path: "reviews",      element: <S><ProfessionalReviews /></S> },
      { path: "revenue",      element: <S><OwnerRevenue /></S> },
      { path: "support",      element: <S><PartnerSupport /></S> },
      { path: "banking",      element: <S><PayoutBanking /></S> },
      { path: "profile",      element: <S><ProfessionalProfile /></S> },
      { path: "*",            element: <NotFound /> },
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
      { index: true,                        element: <S><StreamerDashboard /></S> },
      { path: "matches",                    element: <S><StreamerMatches /></S> },
      { path: "manage/:matchId",            element: <S><ManageStream /></S> },
      { path: "ticker-gallery/:matchId?",   element: <S><TickerGallery /></S> },
      { path: "schedule",                   element: <S><StreamerSchedule /></S> },
      { path: "revenue",                    element: <S><OwnerRevenue /></S> },
      { path: "support",                    element: <S><PartnerSupport /></S> },
      { path: "banking",                    element: <S><PayoutBanking /></S> },
      { path: "profile",                    element: <S><ProfessionalProfile /></S> },
      { path: "*",                          element: <NotFound /> },
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
      { index: true,          element: <S><ScorerDashboard /></S> },
      { path: "matches",      element: <S><ScorerMatches /></S> },
      { path: "schedule",     element: <S><UmpireSchedule /></S> },
      { path: "availability", element: <S><ProfessionalAvailability /></S> },
      { path: "bookings",     element: <S><ProfessionalBookings /></S> },
      { path: "reviews",      element: <S><ProfessionalReviews /></S> },
      { path: "revenue",      element: <S><OwnerRevenue /></S> },
      { path: "support",      element: <S><PartnerSupport /></S> },
      { path: "banking",      element: <S><PayoutBanking /></S> },
      { path: "profile",      element: <S><ProfessionalProfile /></S> },
      { path: "*",            element: <NotFound /> },
    ],
  },

  {
    path: "/matches/:id/stream-setup",
    element: (
      <ProtectedRoute requiredRole="streamer">
        <S><StreamSetup /></S>
      </ProtectedRoute>
    ),
  },

  {
    path: "/scoring/:matchId",
    element: (
      <ProtectedRoute requiredRole={["scorer"]}>
        <S><ScoringApp /></S>
      </ProtectedRoute>
    ),
  },

  // ── USER PORTAL (Fall-through Priority) ──
  {
    path: "/",
    element: <UserRoot />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true,    element: <RootRedirect /> },
      { path: "team/:id", element: <S><TeamProfile /></S> },
      { path: "login",        element: <PublicRoute><S><UserLogin /></S></PublicRoute> },
      { path: "signup",       element: <PublicRoute><S><UserSignUp /></S></PublicRoute> },
      { path: "auth/login",   element: <PublicRoute><S><UserLogin /></S></PublicRoute> },
      { path: "auth/signup",  element: <PublicRoute><S><UserSignUp /></S></PublicRoute> },
      { path: "forgot-password", element: <PublicRoute><S><ForgotPassword /></S></PublicRoute> },
      { path: "turfs",        element: <S><UserTurf /></S> },
      { path: "turf/:id",     element: <S><UserTurfDetails /></S> },
      { path: "profile/:userId?", element: <ProtectedRoute><S><UserProfile /></S></ProtectedRoute> },
      { path: "blogs",        element: <S><UserBlogs /></S> },
      { path: "blogs/:id",    element: <S><UserBlogDetail /></S> },
      { path: "community",    element: <S><Community /></S> },
      { path: "players",      element: <S><FindPlayers /></S> },
      { path: "host-game",    element: <ProtectedRoute><S><HostGame /></S></ProtectedRoute> },
      { path: "join-games",   element: <S><JoinGames /></S> },
      { path: "matches/:matchId/stream-setup", element: <ProtectedRoute><S><StreamSetup /></S></ProtectedRoute> },
      { path: "youtube-connected",  element: <S><YouTubeConnected /></S> },
      { path: "youtube-error",      element: <S><YouTubeError /></S> },
      { path: "facebook-connected", element: <S><FacebookConnected /></S> },
      { path: "facebook-error",     element: <S><FacebookError /></S> },
      { path: "my-hosted-games",    element: <ProtectedRoute><S><MyHostedGames /></S></ProtectedRoute> },
      { path: "my-joined-games",    element: <ProtectedRoute><S><MyJoinedGames /></S></ProtectedRoute> },
      { path: "match/:matchId",     element: <ProtectedRoute><S><MatchDetails /></S></ProtectedRoute> },
      { path: "professionals",      element: <S><FindProfessionals /></S> },
      { path: "professionals/:id",  element: <S><ProfessionalDetails /></S> },
      { path: "messages",           element: <ProtectedRoute><S><Messages /></S></ProtectedRoute> },
      { path: "my-teams",           element: <ProtectedRoute><S><MyTeams /></S></ProtectedRoute> },

      // Business Landings
      { path: "business/venue",     element: <S><UserVenueOwnerLanding /></S> },
      { path: "business/coach",     element: <S><UserCoachLanding /></S> },
      { path: "business/official",  element: <S><UserUmpireLanding /></S> },
      { path: "business/streamer",  element: <S><UserStreamerLanding /></S> },
      { path: "business/scorer",    element: <S><UserScorerLanding /></S> },
      { path: "business/register",  element: <S><BusinessRegistration /></S> },

      // Business Auth
      { path: "signup/venue",    element: <PublicRoute><S><VenueOwnerSignUp /></S></PublicRoute> },
      { path: "signup/coach",    element: <PublicRoute><S><CoachSignUp /></S></PublicRoute> },
      { path: "signup/official", element: <PublicRoute><S><UmpireSignUp /></S></PublicRoute> },
      { path: "signup/streamer", element: <PublicRoute><S><StreamerSignUp /></S></PublicRoute> },
      { path: "signup/scorer",   element: <PublicRoute><S><ScorerSignUp /></S></PublicRoute> },

      { path: "wallet",           element: <ProtectedRoute><S><UserWallet /></S></ProtectedRoute> },
      { path: "booking-history",  element: <ProtectedRoute><S><UserTurfBookingHistory /></S></ProtectedRoute> },
      { path: "checkout/:turfId", element: <ProtectedRoute><S><CheckoutPage /></S></ProtectedRoute> },
      { path: "booking-pass/:id", element: <S><BookingPass /></S> },
      { path: "team-pass/:id",    element: <S><TeamPass /></S> },
      { path: "team/:id",         element: <S><TeamProfile /></S> },
      { path: "booking-invoice/:id", element: <S><BookingInvoice /></S> },
      { path: "analytics/:matchId",  element: <S><MatchAnalytics /></S> },
      { path: "reels",               element: <S><ReelsFeed /></S> },
      { path: "shorts/:id",          element: <S><ReelsFeed /></S> },
      { path: "reels/upload",        element: <ProtectedRoute><S><UploadReel /></S></ProtectedRoute> },
      { path: "reels/analytics",     element: <ProtectedRoute><S><ReelAnalytics /></S></ProtectedRoute> },
      { path: "leaderboard",         element: <S><Leaderboard /></S> },
      { path: "live-overlay/:matchId",  element: <S><LiveOverlay /></S> },
      { path: "live-score/:matchId",    element: <S><LiveScoreboard /></S> },
      { path: "privacy-policy",              element: <S><PrivacyPolicy /></S> },
      { path: "terms-of-service",            element: <S><TermsOfService /></S> },
      { path: "data-deletion-instructions",  element: <S><DataDeletionInstructions /></S> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // ── LEGACY & REDIRECTS ──
  { path: "/owner",          element: <Navigate to="/partner" replace /> },
  { path: "/venue-owner",    element: <Navigate to="/business/venue" replace /> },
  { path: "/coach-landing",  element: <Navigate to="/business/coach" replace /> },
  { path: "/umpire-landing", element: <Navigate to="/business/official" replace /> },
  { path: "/partners",       element: <S><PartnersGateway /></S> },

  // Catch-all (Global)
  { path: "*", element: <NotFound /> },
]);

export default router;
