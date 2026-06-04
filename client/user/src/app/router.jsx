import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";

// Î“Ã¶Ã‡Î“Ã¶Ã‡ Eager: Layouts (used on nearly every route Î“Ã‡Ã¶ small files, no split benefit) Î“Ã¶Ã‡Î“Ã¶Ã‡
import { PartnerLayout, ProfessionalLayout } from "@layouts";
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
const BookingsTab = lazy(() => import("@features/professional/pages/BookingsTab"));
const PayoutsTab  = lazy(() => import("@features/professional/pages/PayoutsTab"));
const ReviewsTab  = lazy(() => import("@features/professional/pages/ReviewsTab"));
const SupportTab  = lazy(() => import("@features/professional/pages/SupportTab"));
const TrustScoreHistory = lazy(() => import("@features/professional/pages/TrustScoreHistory"));

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
const GlobalSearch           = lazy(() => import("@user/pages/GlobalSearch"));
const BookingPass            = lazy(() => import("@features/turf").then(m => ({ default: m.BookingPass })));
const BookingInvoice         = lazy(() => import("@features/turf").then(m => ({ default: m.BookingInvoice })));
const HostGame               = lazy(() => import("@features/games").then(m => ({ default: m.HostGame })));
const JoinGames              = lazy(() => import("@features/games").then(m => ({ default: m.JoinGames })));
const JoinGameDetails        = lazy(() => import("@features/games").then(m => ({ default: m.JoinGameDetails })));
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
const SavedPage              = lazy(() => import("@features/saved/pages/SavedPage"));


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


// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Umpire Portal Components Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡


// â”€â”€ Lazy: Streamer Portal Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Scorer Portal Components Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡


// Î“Ã¶Ã‡Î“Ã¶Ã‡ Lazy: Shared Professional Components Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡
const ProfessionalAvailability = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalAvailability })));
const ProfessionalBookings     = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalBookings })));
const ProfessionalReviews      = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalReviews })));
const ProfessionalProfile      = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalProfile })));
const PracticeScheduling       = lazy(() => import("@features/networking").then(m => ({ default: m.PracticeScheduling })));
const ProfessionalCustomers    = lazy(() => import("@features/networking").then(m => ({ default: m.ProfessionalCustomers })));
const DashboardProfile         = lazy(() => import("@features/partner-profile").then(m => ({ default: m.DashboardProfile })));

const S = ({ children }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

const router = createBrowserRouter([
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
      <ProtectedRoute requiredRole={["coach", "umpire", "streamer", "commentator", "scorer", "cheerleader"]}>
        <ProfessionalLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,                        element: <S><ProfessionalDashboard /></S> },
      { path: "bookings",                   element: <S><BookingsTab /></S> },
      { path: "payouts",                    element: <S><PayoutsTab /></S> },
      { path: "reviews",                    element: <S><ReviewsTab /></S> },
      { path: "support",                    element: <S><SupportTab /></S> },
      { path: "profile",                    element: <S><ProfessionalProfile /></S> },
      { path: "trust-score",                element: <S><TrustScoreHistory /></S> },
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
      { path: "search",       element: <S><GlobalSearch /></S> },
      { path: "players",      element: <S><FindPlayers /></S> },
      { path: "host-game",    element: <ProtectedRoute><S><HostGame /></S></ProtectedRoute> },
      { path: "join-games",   element: <S><JoinGames /></S> },
      { path: "join-games/:gameId",   element: <S><JoinGameDetails /></S> },
      { path: "matches/:matchId/stream-setup", element: <ProtectedRoute><S><StreamSetup /></S></ProtectedRoute> },
      { path: "youtube-connected",  element: <Navigate to="/" replace /> },
      { path: "youtube-error",      element: <Navigate to="/" replace /> },
      { path: "facebook-connected", element: <Navigate to="/" replace /> },
      { path: "facebook-error",     element: <Navigate to="/" replace /> },
      { path: "my-hosted-games",    element: <ProtectedRoute><S><MyHostedGames /></S></ProtectedRoute> },
      { path: "my-joined-games",    element: <ProtectedRoute><S><MyJoinedGames /></S></ProtectedRoute> },
      { path: "match/:matchId",     element: <ProtectedRoute><S><MatchDetails /></S></ProtectedRoute> },
      { path: "professionals",      element: <S><FindProfessionals /></S> },
      { path: "professionals/:id",  element: <S><ProfessionalDetails /></S> },
      { path: "messages",           element: <ProtectedRoute><S><Messages /></S></ProtectedRoute> },
      { path: "notifications",      element: <ProtectedRoute><S><NotificationsPage /></S></ProtectedRoute> },
      { path: "my-teams",           element: <ProtectedRoute><S><MyTeams /></S></ProtectedRoute> },
      { path: "saved",              element: <ProtectedRoute><S><SavedPage /></S></ProtectedRoute> },

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
  { path: "/umpire",          element: <Navigate to="/professional/umpire" replace /> },
  { path: "/scorer",          element: <Navigate to="/professional/scorer" replace /> },
  { path: "/streamer",        element: <Navigate to="/professional/streamer" replace /> },
  { path: "/business/streamer", element: <Navigate to="/business/professional" replace /> },
  // Catch-all (Global)
  { path: "*", element: <NotFound /> },
]);

export default router;


