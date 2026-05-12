import { createBrowserRouter, Navigate } from "react-router-dom";
import Root from "./layouts/Root";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Turf from "./components/turf/Turf";
import TurfDetails from "./components/turf/TurfDetails";
import BookingPass from "./pages/BookingPass";
import BookingInvoice from "./pages/BookingInvoice";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import TurfBookingHistory from "./components/turf/TurfBookingHistory";
import NotFound from "./components/common/NotFound";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import VenueOwnerSignUp from "./pages/auth/VenueOwnerSignUp";
import CoachSignUp from "./pages/auth/CoachSignUp";
import UmpireSignUp from "./pages/auth/UmpireSignUp";
import ComingSoon from "./pages/ComingSoon";
import VenueOwnerLanding from "./pages/business/VenueOwnerLanding";
import CoachLanding from "./pages/business/CoachLanding";
import UmpireLanding from "./pages/business/UmpireLanding";
import BusinessRegistration from "./pages/business/BusinessRegistration";
import JoinGames from "./pages/JoinGames";
import HostGame from "./pages/HostGame";
import MyHostedGames from "./pages/MyHostedGames";

// Owner Portal Imports (via @owner alias)
import { AdminLayout, PartnerLayout, CoachLayout, UmpireLayout } from "@owner/layouts";
import { OwnerDashboard, AddTurf, EditTurf, TurfManagement, TurfDetails as OwnerTurfDetails, OwnerReviews, OwnerBookings } from "@owner/components/owner";
import CoachDashboard from "@owner/components/coach/CoachDashboard";
import CoachStudents from "@owner/components/coach/CoachStudents";
import CoachSessions from "@owner/components/coach/CoachSessions";
import CoachMasterclass from "@owner/components/coach/CoachMasterclass";
import UmpireDashboard from "@owner/components/umpire/UmpireDashboard";
import UmpireMatches from "@owner/components/umpire/UmpireMatches";
import UmpireSchedule from "@owner/components/umpire/UmpireSchedule";
import UmpireFeedback from "@owner/components/umpire/UmpireFeedback";
import { AdminDashboard, UserManagement, NewOwnerRequests, RejectedOwnerRequests, OwnerViewer, TurfList, AllTurf, TransactionSection, FeatureFlags, MarketingManagement, BlogManagement } from "@owner/components/admin";

const router = createBrowserRouter([
 // ── DASHBOARD ROUTES (High Priority) ──
 {
 path: "/admin",
 element: <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>,
 children: [
 { index: true, element: <AdminDashboard /> },
 { path: "partner-requests/new", element: <NewOwnerRequests /> },
 { path: "partner-requests/rejected", element: <RejectedOwnerRequests /> },
 { path: "users", element: <UserManagement /> },
 { path: "owners", element: <OwnerViewer /> },
 { path: "owners/:ownerId/turf", element: <TurfList /> },
 { path: "turfs", element: <AllTurf /> },
 { path: "transactions", element: <TransactionSection /> },
 { path: "features", element: <FeatureFlags /> },
 { path: "marketing", element: <MarketingManagement /> },
 { path: "blogs", element: <BlogManagement /> },
 { path: "*", element: <NotFound /> },
 ],
 },
 {
 path: "/partner",
 element: <ProtectedRoute allowedRoles={["owner", "admin"]}><PartnerLayout /></ProtectedRoute>,
 children: [
 { index: true, element: <OwnerDashboard /> },
 { path: "add-turf", element: <AddTurf /> },
 { path: "edit-turf/:id", element: <EditTurf /> },
 { path: "turfs", element: <TurfManagement /> },
 { path: "turf/:id", element: <OwnerTurfDetails /> },
 { path: "reviews", element: <OwnerReviews /> },
 { path: "bookings", element: <OwnerBookings /> },
 { path: "*", element: <NotFound /> },
 ],
 },
 {
 path: "/coach",
 element: <ProtectedRoute allowedRoles={["coach", "admin"]}><CoachLayout /></ProtectedRoute>,
 children: [
 { index: true, element: <CoachDashboard /> },
 { path: "students", element: <CoachStudents /> },
 { path: "sessions", element: <CoachSessions /> },
 { path: "masterclass", element: <CoachMasterclass /> },
 { path: "*", element: <NotFound /> },
 ],
 },
 {
 path: "/umpire",
 element: <ProtectedRoute allowedRoles={["umpire", "admin"]}><UmpireLayout /></ProtectedRoute>,
 children: [
 { index: true, element: <UmpireDashboard /> },
 { path: "matches", element: <UmpireMatches /> },
 { path: "schedule", element: <UmpireSchedule /> },
 { path: "feedback", element: <UmpireFeedback /> },
 { path: "*", element: <NotFound /> },
 ],
 },

 // ── USER PORTAL ROUTES (Root) ──
 {
 path: "/",
 element: <Root />,
 errorElement: <NotFound />,
 children: [
 { path: "booking-pass/:id", element: <BookingPass /> },
 { path: "booking-invoice/:id", element: <BookingInvoice /> },
 { index: true, element: <Home /> },
 { path: "login", element: <Login /> },
 { path: "signup", element: <SignUp /> },
 { path: "turfs", element: <Turf /> },
 { path: "business/venue", element: <VenueOwnerLanding /> },
 { path: "business/coach", element: <CoachLanding /> },
 { path: "business/official", element: <UmpireLanding /> },
 { path: "business/register", element: <BusinessRegistration /> },
 { path: "signup/venue", element: <VenueOwnerSignUp /> },
 { path: "signup/coach", element: <CoachSignUp /> },
 { path: "signup/official", element: <UmpireSignUp /> },
 { path: "turf/:id", element: <TurfDetails /> },
 { path: "profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
 { path: "profile/:userId", element: <Profile /> },
 { path: "wallet", element: <ProtectedRoute><Wallet /></ProtectedRoute> },
 { path: "blogs", element: <Blogs /> },
 { path: "blogs/:id", element: <BlogDetail /> },
 { path: "booking-history", element: <ProtectedRoute><TurfBookingHistory /></ProtectedRoute> },
 { path: "join-games", element: <ProtectedRoute><JoinGames /></ProtectedRoute> },
 { path: "host-game", element: <ProtectedRoute><HostGame /></ProtectedRoute> },
 { path: "my-hosted-games", element: <ProtectedRoute><MyHostedGames /></ProtectedRoute> },
 { path: "*", element: <NotFound /> },
 ],
 },

 // ── REDIRECTS & CATCH-ALL ──
 { path: "/owner", element: <Navigate to="/partner" replace /> },
 { path: "/venue-owner", element: <Navigate to="/business/venue" replace /> },
 { path: "/coach-landing", element: <Navigate to="/business/coach" replace /> },
 { path: "/umpire-landing", element: <Navigate to="/business/official" replace /> },
 { path: "*", element: <NotFound /> },
]);

export default router;
