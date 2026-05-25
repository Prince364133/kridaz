import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Eager: Layouts (used on nearly every route Î“Ã‡Ã¶ small files, no split benefit) Î“Ã¶Ã‡Î“Ã¶Ã‡
import { AdminLayout, PartnerLayout, GuestLayout, CoachLayout, UmpireLayout, StreamerLayout, ScorerLayout, ProfessionalLayout } from "@layouts";
import UserRoot from "@user/layouts/Root";

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Eager: Route guards & error utilities (must be synchronous) Î“Ã¶Ã‡Î“Ã¶Ã‡
import ProtectedRoute from "@components/ProtectedRoute/ProtectedRoute";
import PublicRoute from "@components/ProtectedRoute/PublicRoute";
import { NotFound, RootRedirect, ErrorBoundary } from "@components/common";

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Spinner shown while any lazy chunk loads Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
const PageLoader = () => null;

const RedirectToAnalytics = () => {
  const { matchId } = useParams();
  return <Navigate to={`/analytics/${matchId}`} replace />;
};

const ProfessionalDashboard = lazy(() => import("@features/professional/pages/ProfessionalDashboard"));

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: User Portal Pages Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
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
const ThemePreview           = lazy(() => import("@features/scoring").then(m => ({ default: m.ThemePreview })));
const TeamPass               = lazy(() => import("@features/teams").then(m => ({ default: m.TeamPass })));
const TeamProfile            = lazy(() => import("@features/teams").then(m => ({ default: m.TeamProfile })));
const ReelsFeed              = lazy(() => import("@features/reels").then(m => ({ default: m.ReelsFeed })));
const UploadReel             = lazy(() => import("@features/reels").then(m => ({ default: m.UploadReel })));
const ReelAnalytics          = lazy(() => import("@features/reels").then(m => ({ default: m.ReelAnalytics })));
const NotificationsPage      = lazy(() => import("@features/notifications").then(m => ({ default: m.NotificationsPage })));



// â”€â”€ Lazy: Business Landing Pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const UserVenueOwnerLanding  = lazy(() => import("@features/business").then(m => ({ default: m.VenueOwnerLanding })));
const ProfessionalLanding    = lazy(() => import("@features/business").then(m => ({ default: m.ProfessionalLanding })));
const BusinessRegistration   = lazy(() => import("@features/business").then(m => ({ default: m.BusinessRegistration })));


// â”€â”€ Lazy: Legal Pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PrivacyPolicy              = lazy(() => import("@features/legal").then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService             = lazy(() => import("@features/legal").then(m => ({ default: m.TermsOfService })));
const DataDeletionInstructions   = lazy(() => import("@features/legal").then(m => ({ default: m.DataDeletionInstructions })));
const ContactUs                  = lazy(() => import("@features/legal").then(m => ({ default: m.ContactUs })));
const FAQ                        = lazy(() => import("@features/legal").then(m => ({ default: m.FAQ })));


// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Owner / Venue Owner Portal Pages Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡



// â”€â”€ Lazy: Streamer Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StreamSetup    = lazy(() => import("@features/streamer").then(m => ({ default: m.StreamSetup })));
const ManageStream   = lazy(() => import("@features/streamer").then(m => ({ default: m.ManageStream })));
const TickerGallery  = lazy(() => import("@features/streamer").then(m => ({ default: m.TickerGallery })));

// â”€â”€ Lazy: YouTube / Facebook Auth Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Named exports â€” use .then() to map to default for lazy()
const YouTubeConnected  = lazy(() => import("@features/streamer").then(m => ({ default: m.YouTubeConnected })));
const YouTubeError      = lazy(() => import("@features/streamer").then(m => ({ default: m.YouTubeError })));
const FacebookConnected = lazy(() => import("@features/streamer").then(m => ({ default: m.FacebookConnected })));
const FacebookError     = lazy(() => import("@features/streamer").then(m => ({ default: m.FacebookError })));

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Owner (Partner) Portal Components Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
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
const VenueBanking       = lazy(() => import("@features/venue-owner").then(m => ({ default: m.VenueBanking })));
const PartnerSupport     = lazy(() => import("@features/venue-owner").then(m => ({ default: m.PartnerSupport })));

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Coach Portal Components Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
const CoachDashboard   = lazy(() => import("@features/coach").then(m => ({ default: m.CoachDashboard })));
const CoachStudents    = lazy(() => import("@features/coach").then(m => ({ default: m.CoachStudents })));
const CoachSessions    = lazy(() => import("@features/coach").then(m => ({ default: m.CoachSessions })));
const CoachMasterclass = lazy(() => import("@features/coach").then(m => ({ default: m.CoachMasterclass })));

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Umpire Portal Components Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
const UmpireDashboard = lazy(() => import("@features/umpire").then(m => ({ default: m.UmpireDashboard })));
const UmpireMatches   = lazy(() => import("@features/umpire").then(m => ({ default: m.UmpireMatches })));
const UmpireSchedule  = lazy(() => import("@features/umpire").then(m => ({ default: m.UmpireSchedule })));
const UmpireFeedback  = lazy(() => import("@features/umpire").then(m => ({ default: m.UmpireFeedback })));

// â”€â”€ Lazy: Streamer Portal Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StreamerDashboard = lazy(() => import("@features/streamer").then(m => ({ default: m.StreamerDashboard })));
const StreamerMatches   = lazy(() => import("@features/streamer").then(m => ({ default: m.StreamerMatches })));
const StreamerSchedule= lazy(() => import("@features/streamer").then(m => ({ default: m.StreamerSchedule })));
const CreateStream    = lazy(() => import("@features/streamer/pages/CreateStream"));

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Scorer Portal Components Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
const ScorerDashboard = lazy(() => import("@features/scorer").then(m => ({ default: m.ScorerDashboard })));
const ScorerMatches   = lazy(() => import("@features/scorer").then(m => ({ default: m.ScorerMatches })));

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Shared Professional Components Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
const ProfessionalAvailability = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalAvailability })));
const ProfessionalBookings     = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalBookings })));
const ProfessionalReviews      = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalReviews })));
const ProfessionalProfile      = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalProfile })));
const PracticeScheduling       = lazy(() => import("@features/networking").then(m => ({ default: m.PracticeScheduling })));
const ProfessionalCustomers    = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalCustomers })));
const DashboardProfile         = lazy(() => import("@features/partner-profile").then(m => ({ default: m.DashboardProfile })));

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Admin Portal Components Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
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
const GameDisputeManager         = lazy(() => import("@features/admin").then(m => ({ default: m.GameDisputeManager })));
const AuditLogs              = lazy(() => import("@features/admin").then(m => ({ default: m.AuditLogs })));
const FinancialMissionControl = lazy(() => import("@features/admin").then(m => ({ default: m.FinancialMissionControl })));
const ProfessionalDetailsPage = lazy(() => import("@features/admin").then(m => ({ default: m.ProfessionalDetailsPage })));
const HostedGamesPage         = lazy(() => import("@features/admin").then(m => ({ default: m.HostedGamesPage })));
const CouponManagement        = lazy(() => import("@features/admin").then(m => ({ default: m.CouponManagement })));

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Shorthand wrapper Î“Ã‡Ã¶ keeps route definitions terse Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
const S = ({ children }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

const router = createBrowserRouter([
  // Î“Ã¶Ã‡Î“Ã¶Ã‡ ADMIN PORTAL (High Priority) Î“Ã¶Ã‡Î“Ã¶Ã‡
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
      { path: "game-disputes",     element: <S><GameDisputeManager /></S> },
      { path: "audit",        element: <S><AuditLogs /></S> },
      { path: "finance",      element: <S><FinancialMissionControl /></S> },
      { path: "features",     element: <S><FeatureFlags /></S> },
      { path: "marketing",    element: <S><MarketingManagement /></S> },
      { path: "blogs",        element: <S><BlogManagement /></S> },
      { path: "community",    element: <S><CommunityManagement /></S> },
      { path: "games",        element: <S><HostedGamesPage /></S> },
      { path: "coupons",      element: <S><CouponManagement /></S> },
      { path: "*",            element: <NotFound /> },
    ],
  },

  // â”€â”€ Venue Owner Portal (High Priority) â”€â”€
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
      { path: "banking",       element: <S><VenueBanking /></S> },
      { path: "profile",       element: <S><DashboardProfile /></S> },
      { path: "*",             element: <NotFound /> },
    ],
  },

  // â”€â”€â”€ PROFESSIONAL PORTAL (UNIFIED) â”€â”€â”€
  {
    path: "/professional/:role",
    element: (
      <ProtectedRoute requiredRole={["coach", "umpire", "streamer", "commentator", "limited_umpire", "limited_streamer"]}>
        <ProfessionalLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,                        element: <S><ProfessionalDashboard /></S> },
      // Umpire Specific
      { path: "umpire-matches",             element: <S><UmpireMatches /></S> },
      // Streamer Specific
      { path: "streamer-matches",           element: <S><StreamerMatches /></S> },
      { path: "manage/:matchId",            element: <S><ManageStream /></S> },
      { path: "ticker-gallery/:matchId?",   element: <S><TickerGallery /></S> },
      { path: "create-stream",              element: <S><CreateStream /></S> },
      // Common
      { path: "availability",               element: <S><ProfessionalAvailability /></S> },
      { path: "practice-scheduling",        element: <S><PracticeScheduling /></S> },
      { path: "customers",                  element: <S><ProfessionalCustomers /></S> },
      { path: "bookings",                   element: <S><ProfessionalBookings /></S> },
      { path: "reviews",                    element: <S><ProfessionalReviews /></S> },
      { path: "revenue",                    element: <S><OwnerRevenue /></S> },
      { path: "support",                    element: <S><PartnerSupport /></S> },
      { path: "banking",                    element: <S><VenueBanking /></S> },
      { path: "profile",                    element: <S><ProfessionalProfile /></S> },
      { path: "*",                          element: <NotFound /> },
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
      <ProtectedRoute>
        <S><ScoringApp /></S>
      </ProtectedRoute>
    ),
  },

  {
    path: "/live-overlay/:matchId",
    element: <S><LiveOverlay /></S>,
  },
  {
    path: "/live-overlay/:matchId/preview",
    element: <S><ThemePreview /></S>,
  },

  // Î“Ã¶Ã‡Î“Ã¶Ã‡ USER PORTAL (Fall-through Priority) Î“Ã¶Ã‡Î“Ã¶Ã‡
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
      { path: "venues",       element: <S><UserTurf /></S> },
      { path: "venue/:id",    element: <S><UserTurfDetails /></S> },
      { path: "profile/:userId?", element: <ProtectedRoute><S><UserProfile /></S></ProtectedRoute> },
      { path: "blogs",        element: <S><UserBlogs /></S> },
      { path: "blogs/:id",    element: <S><UserBlogDetail /></S> },
      { path: "community",    element: <Navigate to="/" replace /> },
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
      { path: "notifications",      element: <ProtectedRoute><S><NotificationsPage /></S></ProtectedRoute> },
      { path: "my-teams",           element: <ProtectedRoute><S><MyTeams /></S></ProtectedRoute> },

      // Business Landings
      { path: "business/venue",     element: <S><UserVenueOwnerLanding /></S> },
      { path: "business/professional", element: <S><ProfessionalLanding /></S> },
      { path: "business/registration", element: <S><BusinessRegistration /></S> },
      { path: "business/register", element: <S><BusinessRegistration /></S> },

      // Business Auth
      { path: "signup/venue",    element: <S><BusinessRegistration defaultRole="venu_owners" /></S> },
      { path: "signup/coach",    element: <S><BusinessRegistration defaultRole="coach" /></S> },
      { path: "signup/official", element: <S><BusinessRegistration defaultRole="umpire" /></S> },
      { path: "signup/streamer", element: <S><BusinessRegistration defaultRole="streamer" /></S> },
      { path: "signup/scorer",   element: <S><BusinessRegistration defaultRole="scorer" /></S> },

      { path: "wallet",           element: <ProtectedRoute><S><UserWallet /></S></ProtectedRoute> },
      { path: "booking-history",  element: <ProtectedRoute><S><UserTurfBookingHistory /></S></ProtectedRoute> },
      { path: "checkout/:turfId", element: <ProtectedRoute><S><CheckoutPage /></S></ProtectedRoute> },
      { path: "booking-pass/:id", element: <S><BookingPass /></S> },
      { path: "team-pass/:id",    element: <S><TeamPass /></S> },
      { path: "team/:id",         element: <S><TeamProfile /></S> },
      { path: "booking-invoice/:id", element: <S><BookingInvoice /></S> },
      { path: "analytics/:matchId",  element: <S><MatchAnalytics /></S> },
      { path: "reels",               element: <Navigate to="/" replace /> },
      { path: "shorts/:id",          element: <Navigate to="/" replace /> },
      { path: "reels/upload",        element: <ProtectedRoute><S><UploadReel /></S></ProtectedRoute> },
      { path: "reels/analytics",     element: <ProtectedRoute><S><ReelAnalytics /></S></ProtectedRoute> },
      { path: "leaderboard",         element: <S><Leaderboard /></S> },
      { path: "live-score/:matchId",    element: <RedirectToAnalytics /> },
      { path: "scoring/live/:matchId",  element: <RedirectToAnalytics /> },
      { path: "privacy-policy",              element: <S><PrivacyPolicy /></S> },
      { path: "terms-of-service",            element: <S><TermsOfService /></S> },
      { path: "data-deletion-instructions",  element: <S><DataDeletionInstructions /></S> },
      { path: "contact-us",                  element: <S><ContactUs /></S> },
      { path: "faq",                         element: <S><FAQ /></S> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // â”€â”€ LEGACY & REDIRECTS â”€â”€
  { path: "/owner",          element: <Navigate to="/venue-owner" replace /> },
  { path: "/partner",        element: <Navigate to="/venue-owner" replace /> },
  { path: "/coach-landing",  element: <Navigate to="/business/professional" replace /> },
  { path: "/umpire-landing", element: <Navigate to="/business/professional" replace /> },
  { path: "/business/coach",  element: <Navigate to="/business/professional" replace /> },
  { path: "/business/official", element: <Navigate to="/business/professional" replace /> },
  { path: "/business/scorer", element: <Navigate to="/business/professional" replace /> },
  { path: "/coach",           element: <Navigate to="/professional/coach" replace /> },
  { path: "/business/streamer", element: <Navigate to="/business/professional" replace /> },
  // Catch-all (Global)
  { path: "*", element: <NotFound /> },
]);

export default router;


