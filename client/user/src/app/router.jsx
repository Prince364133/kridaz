import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// ΓöÇΓöÇ Eager: Layouts (used on nearly every route ΓÇö small files, no split benefit) ΓöÇΓöÇ
import { AdminLayout, PartnerLayout, GuestLayout, CoachLayout, UmpireLayout, StreamerLayout, ScorerLayout } from "@layouts";
import UserRoot from "@user/layouts/Root";

// ΓöÇΓöÇ Eager: Route guards & error utilities (must be synchronous) ΓöÇΓöÇ
import ProtectedRoute from "@components/ProtectedRoute/ProtectedRoute";
import PublicRoute from "@components/ProtectedRoute/PublicRoute";
import { NotFound, RootRedirect, ErrorBoundary } from "@components/common";

// ΓöÇΓöÇ Spinner shown while any lazy chunk loads ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const PageLoader = () => null;

// ΓöÇΓöÇ Lazy: User Portal Pages ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const UserHome               = lazy(() => import("@user/pages/Home"));
const UserLogin              = lazy(() => import("@features/auth").then(m => ({ default: m.Login })));
const UserSignUp             = lazy(() => import("@features/auth").then(m => ({ default: m.SignUp })));
const ForgotPassword         = lazy(() => import("@features/auth").then(m => ({ default: m.ForgotPassword })));
const UserTurf               = lazy(() => import("@features/turf").then(m => ({ default: m.Turf })));
const UserTurfDetails        = lazy(() => import("@features/turf").then(m => ({ default: m.TurfDetails })));
const UserTurfBookingHistory = lazy(() => import("@features/turf").then(m => ({ default: m.TurfBookingHistory })));
const UserProfile            = lazy(() => import("@features/profile").then(m => ({ default: m.Profile })));
const UserBlogs              = lazy(() => import("@features/blogs").then(m => ({ default: m.Blogs })));
const UserBlogDetail         = lazy(() => import("@features/blogs").then(m => ({ default: m.BlogDetail })));
const Community              = lazy(() => import("@features/networking").then(m => ({ default: m.Community })));
const FindPlayers            = lazy(() => import("@features/networking").then(m => ({ default: m.FindPlayers })));
const UserWallet             = lazy(() => import("@features/wallet").then(m => ({ default: m.Wallet })));
const BookingPass            = lazy(() => import("@features/turf").then(m => ({ default: m.BookingPass })));
const BookingInvoice         = lazy(() => import("@features/turf").then(m => ({ default: m.BookingInvoice })));
const HostGame               = lazy(() => import("@features/games").then(m => ({ default: m.HostGame })));
const JoinGames              = lazy(() => import("@features/games").then(m => ({ default: m.JoinGames })));
const MyHostedGames          = lazy(() => import("@features/games").then(m => ({ default: m.MyHostedGames })));
const MyJoinedGames          = lazy(() => import("@features/games").then(m => ({ default: m.MyJoinedGames })));
const FindProfessionals      = lazy(() => import("@features/networking").then(m => ({ default: m.FindProfessionals })));
const ProfessionalDetails    = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalDetails })));
const Messages               = lazy(() => import("@features/chat").then(m => ({ default: m.Messages })));
const MyTeams                = lazy(() => import("@features/teams").then(m => ({ default: m.Teams })));
const CheckoutPage           = lazy(() => import("@features/turf").then(m => ({ default: m.CheckoutPage })));
const ScoringApp             = lazy(() => import("@features/scoring").then(m => ({ default: m.ScoringApp })));
const MatchAnalytics         = lazy(() => import("@features/scoring").then(m => ({ default: m.MatchAnalytics })));
const MatchDetails           = lazy(() => import("@features/scoring").then(m => ({ default: m.MatchDetails })));
const Leaderboard            = lazy(() => import("@features/leaderboard").then(m => ({ default: m.Leaderboard })));
const LiveOverlay            = lazy(() => import("@features/scoring").then(m => ({ default: m.LiveOverlay })));
const LiveScoreboard         = lazy(() => import("@features/scoring").then(m => ({ default: m.LiveScoreboard })));
const TeamPass               = lazy(() => import("@features/teams").then(m => ({ default: m.TeamPass })));
const TeamProfile            = lazy(() => import("@features/teams").then(m => ({ default: m.TeamProfile })));
const ReelsFeed              = lazy(() => import("@features/reels").then(m => ({ default: m.ReelsFeed })));
const UploadReel             = lazy(() => import("@features/reels").then(m => ({ default: m.UploadReel })));
const ReelAnalytics          = lazy(() => import("@features/reels").then(m => ({ default: m.ReelAnalytics })));


// ── Lazy: Business Landing Pages ───────────────────────────────────────────────────
const UserVenueOwnerLanding  = lazy(() => import("@features/business").then(m => ({ default: m.VenueOwnerLanding })));
const UserCoachLanding       = lazy(() => import("@features/business").then(m => ({ default: m.CoachLanding })));
const UserUmpireLanding      = lazy(() => import("@features/business").then(m => ({ default: m.UmpireLanding })));
const UserStreamerLanding     = lazy(() => import("@features/business").then(m => ({ default: m.StreamerLanding })));
const UserScorerLanding      = lazy(() => import("@features/business").then(m => ({ default: m.ScorerLanding })));
const BusinessRegistration   = lazy(() => import("@features/business").then(m => ({ default: m.BusinessRegistration })));


// ── Lazy: Legal Pages ─────────────────────────────────────────────────────────────
const PrivacyPolicy              = lazy(() => import("@features/legal").then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService             = lazy(() => import("@features/legal").then(m => ({ default: m.TermsOfService })));
const DataDeletionInstructions   = lazy(() => import("@features/legal").then(m => ({ default: m.DataDeletionInstructions })));


// ΓöÇΓöÇ Lazy: Owner / Venue Owner Portal Pages ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const PartnersGateway  = lazy(() => import("@features/business").then(m => ({ default: m.PartnersGateway })));

const VenueOwnerSignUp = lazy(() => import("@features/auth").then(m => ({ default: m.VenueOwnerSignUp })));
const CoachSignUp      = lazy(() => import("@features/auth").then(m => ({ default: m.CoachSignUp })));
const UmpireSignUp     = lazy(() => import("@features/auth").then(m => ({ default: m.UmpireSignUp })));
const ScorerSignUp     = lazy(() => import("@features/auth").then(m => ({ default: m.ScorerSignUp })));
const StreamerSignUp   = lazy(() => import("@features/auth").then(m => ({ default: m.StreamerSignUp })));

// ── Lazy: Streamer Components ────────────────────────────────────────────────────────────────────────────────
const StreamSetup    = lazy(() => import("@features/streamer").then(m => ({ default: m.StreamSetup })));
const ManageStream   = lazy(() => import("@features/streamer").then(m => ({ default: m.ManageStream })));
const TickerGallery  = lazy(() => import("@features/streamer").then(m => ({ default: m.TickerGallery })));

// ── Lazy: YouTube / Facebook Auth Status ─────────────────────────────────────────────────────────────────────
// Named exports — use .then() to map to default for lazy()
const YouTubeConnected  = lazy(() => import("@features/streamer").then(m => ({ default: m.YouTubeConnected })));
const YouTubeError      = lazy(() => import("@features/streamer").then(m => ({ default: m.YouTubeError })));
const FacebookConnected = lazy(() => import("@features/streamer").then(m => ({ default: m.FacebookConnected })));
const FacebookError     = lazy(() => import("@features/streamer").then(m => ({ default: m.FacebookError })));

// ΓöÇΓöÇ Lazy: Owner (Partner) Portal Components ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const AddTurf            = lazy(() => import("@features/venue-owner").then(m => ({ default: m.AddTurf })));
const EditTurf           = lazy(() => import("@features/venue-owner").then(m => ({ default: m.EditTurf })));
const TurfManagement     = lazy(() => import("@features/venue-owner").then(m => ({ default: m.TurfManagement })));
const TurfDetails        = lazy(() => import("@features/venue-owner").then(m => ({ default: m.TurfDetails })));
const OwnerDashboard     = lazy(() => import("@features/venue-owner").then(m => ({ default: m.OwnerDashboard })));
const PartnerReviews     = lazy(() => import("@features/venue-owner").then(m => ({ default: m.PartnerReviews })));
const PartnerBookings    = lazy(() => import("@features/venue-owner").then(m => ({ default: m.PartnerBookings })));
const CustomerDirectory  = lazy(() => import("@features/venue-owner").then(m => ({ default: m.CustomerDirectory })));
const VenueIntelligence  = lazy(() => import("@features/venue-owner").then(m => ({ default: m.VenueIntelligence })));
const OwnerRevenue       = lazy(() => import("@features/venue-owner").then(m => ({ default: m.OwnerRevenue })));
const OwnerPromotions    = lazy(() => import("@features/venue-owner").then(m => ({ default: m.OwnerPromotions })));
const PayoutBanking      = lazy(() => import("@features/venue-owner").then(m => ({ default: m.PayoutBanking })));
const PartnerSupport     = lazy(() => import("@features/venue-owner").then(m => ({ default: m.PartnerSupport })));

// ΓöÇΓöÇ Lazy: Coach Portal Components ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const CoachDashboard   = lazy(() => import("@features/coach").then(m => ({ default: m.CoachDashboard })));
const CoachStudents    = lazy(() => import("@features/coach").then(m => ({ default: m.CoachStudents })));
const CoachSessions    = lazy(() => import("@features/coach").then(m => ({ default: m.CoachSessions })));
const CoachMasterclass = lazy(() => import("@features/coach").then(m => ({ default: m.CoachMasterclass })));

// ΓöÇΓöÇ Lazy: Umpire Portal Components ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const UmpireDashboard = lazy(() => import("@features/umpire").then(m => ({ default: m.UmpireDashboard })));
const UmpireMatches   = lazy(() => import("@features/umpire").then(m => ({ default: m.UmpireMatches })));
const UmpireSchedule  = lazy(() => import("@features/umpire").then(m => ({ default: m.UmpireSchedule })));
const UmpireFeedback  = lazy(() => import("@features/umpire").then(m => ({ default: m.UmpireFeedback })));

// ── Lazy: Streamer Portal Components ─────────────────────────────────────────────────────────────────────────
const StreamerDashboard = lazy(() => import("@features/streamer").then(m => ({ default: m.StreamerDashboard })));
const StreamerMatches   = lazy(() => import("@features/streamer").then(m => ({ default: m.StreamerMatches })));
const StreamerSchedule  = lazy(() => import("@features/streamer").then(m => ({ default: m.StreamerSchedule })));

// ΓöÇΓöÇ Lazy: Scorer Portal Components ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const ScorerDashboard = lazy(() => import("@features/scorer").then(m => ({ default: m.ScorerDashboard })));
const ScorerMatches   = lazy(() => import("@features/scorer").then(m => ({ default: m.ScorerMatches })));

// ΓöÇΓöÇ Lazy: Shared Professional Components ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const ProfessionalAvailability = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalAvailability })));
const ProfessionalBookings     = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalBookings })));
const ProfessionalReviews      = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalReviews })));
const ProfessionalProfile      = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalProfile })));
const DashboardProfile         = lazy(() => import("@features/partner-profile").then(m => ({ default: m.DashboardProfile })));

// ΓöÇΓöÇ Lazy: Admin Portal Components ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const UserManagement         = lazy(() => import("@features/admin").then(m => ({ default: m.UserManagement })));
const VerificationCenter     = lazy(() => import("@features/admin").then(m => ({ default: m.VerificationCenter })));
const AdminDashboard         = lazy(() => import("@features/admin").then(m => ({ default: m.AdminDashboard })));
const PartnerViewer          = lazy(() => import("@features/admin").then(m => ({ default: m.PartnerViewer })));
const TurfList               = lazy(() => import("@features/admin").then(m => ({ default: m.TurfList })));
const AllTurf                = lazy(() => import("@features/admin").then(m => ({ default: m.AllTurf })));
const VenueApprovalDetail    = lazy(() => import("@features/admin").then(m => ({ default: m.VenueApprovalDetail })));
const TransactionSection     = lazy(() => import("@features/admin").then(m => ({ default: m.TransactionSection })));
const FeatureFlags           = lazy(() => import("@features/admin").then(m => ({ default: m.FeatureFlags })));
const MarketingManagement    = lazy(() => import("@features/admin").then(m => ({ default: m.MarketingManagement })));
const BlogManagement         = lazy(() => import("@features/admin").then(m => ({ default: m.BlogManagement })));
const CommunityManagement    = lazy(() => import("@features/admin").then(m => ({ default: m.CommunityManagement })));
const ProfessionalManagement = lazy(() => import("@features/admin").then(m => ({ default: m.ProfessionalManagement })));
const SupportCenter          = lazy(() => import("@features/admin").then(m => ({ default: m.SupportCenter })));
const DisputeManager         = lazy(() => import("@features/admin").then(m => ({ default: m.DisputeManager })));
const AuditLogs              = lazy(() => import("@features/admin").then(m => ({ default: m.AuditLogs })));
const FinancialMissionControl = lazy(() => import("@features/admin").then(m => ({ default: m.FinancialMissionControl })));
const ProfessionalDetailsPage = lazy(() => import("@features/admin").then(m => ({ default: m.ProfessionalDetailsPage })));
const HostedGamesPage         = lazy(() => import("@features/admin").then(m => ({ default: m.HostedGamesPage })));

// ΓöÇΓöÇ Shorthand wrapper ΓÇö keeps route definitions terse ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const S = ({ children }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

const router = createBrowserRouter([
  // ΓöÇΓöÇ ADMIN PORTAL (High Priority) ΓöÇΓöÇ
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

  // ΓöÇΓöÇ Venue Owner Portal (High Priority) ΓöÇΓöÇ
  {
    path: "/venue-owner",
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

  // ΓöÇΓöÇ COACH PORTAL (High Priority) ΓöÇΓöÇ
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

  // ΓöÇΓöÇ UMPIRE PORTAL (High Priority) ΓöÇΓöÇ
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

  // ΓöÇΓöÇ STREAMER PORTAL ΓöÇΓöÇ
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

  // ΓöÇΓöÇ SCORER PORTAL ΓöÇΓöÇ
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

  // ΓöÇΓöÇ USER PORTAL (Fall-through Priority) ΓöÇΓöÇ
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

  // ΓöÇΓöÇ LEGACY & REDIRECTS ΓöÇΓöÇ
  { path: "/owner",          element: <Navigate to="/venue-owner" replace /> },
  { path: "/venue-owner",    element: <Navigate to="/business/venue" replace /> },
  { path: "/coach-landing",  element: <Navigate to="/business/coach" replace /> },
  { path: "/umpire-landing", element: <Navigate to="/business/official" replace /> },
  { path: "/venue-owners",       element: <S><PartnersGateway /></S> },

  // Catch-all (Global)
  { path: "*", element: <NotFound /> },
]);

export default router;


