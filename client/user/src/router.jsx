import { createBrowserRouter, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Layouts
import { AdminLayout, PartnerLayout, GuestLayout, CoachLayout, UmpireLayout } from "@layouts";
import UserRoot from "@user/layouts/Root";

// User Portal Pages (via @user alias)
import UserHome from "@user/pages/Home";
import UserLogin from "@user/pages/auth/Login";
import UserSignUp from "@user/pages/auth/SignUp";
import UserTurf from "@user/components/turf/Turf";
import UserTurfDetails from "@user/components/turf/TurfDetails";
import UserTurfBookingHistory from "@user/components/turf/TurfBookingHistory";
import UserProfile from "@user/pages/Profile";
import UserBlogs from "@user/pages/Blogs";
import UserBlogDetail from "@user/pages/BlogDetail";


// Business Landing Pages (User Portal)
import UserVenueOwnerLanding from "@user/pages/business/VenueOwnerLanding";
import UserCoachLanding from "@user/pages/business/CoachLanding";
import UserUmpireLanding from "@user/pages/business/UmpireLanding";
import BusinessRegistration from "@user/pages/business/BusinessRegistration";
// Owner Portal Pages
import PartnersGateway from "@pages/PartnersGateway";
import VenueOwnerSignUp from "@pages/VenueOwnerSignUp";
import CoachSignUp from "@pages/CoachSignUp";
import UmpireSignUp from "@pages/UmpireSignUp";

import {
  AddTurf,
  EditTurf,
  TurfManagement,
  TurfDetails,
  OwnerDashboard,
  OwnerReviews as PartnerReviews,
  OwnerBookings as PartnerBookings,
} from "@components/owner";
import CoachDashboard from "./components/coach/CoachDashboard";
import CoachStudents from "./components/coach/CoachStudents";
import CoachSessions from "./components/coach/CoachSessions";
import CoachMasterclass from "./components/coach/CoachMasterclass";

import UmpireDashboard from "./components/umpire/UmpireDashboard";
import UmpireMatches from "./components/umpire/UmpireMatches";
import UmpireSchedule from "./components/umpire/UmpireSchedule";
import UmpireFeedback from "./components/umpire/UmpireFeedback";

import {
  UserManagement,
  NewOwnerRequests as NewPartnerRequests,
  RejectedOwnerRequests as RejectedPartnerRequests,
  AdminDashboard,
  OwnerViewer as PartnerViewer,
  TurfList,
  AllTurf,
  TransactionSection,
  FeatureFlags,
  MarketingManagement,
  BlogManagement,
} from "@components/admin";
import ProtectedRoute from "@components/ProtectedRoute/ProtectedRoute";
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
        path: "partner-requests",
        children: [
          { path: "new", element: <NewPartnerRequests /> },
          { path: "rejected", element: <RejectedPartnerRequests /> },
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
      { path: "transactions", element: <TransactionSection /> },
      { path: "features", element: <FeatureFlags /> },
      { path: "marketing", element: <MarketingManagement /> },
      { path: "blogs", element: <BlogManagement /> },
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
      { path: "feedback", element: <UmpireFeedback /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // ── USER PORTAL (Fall-through Priority) ──
  {
    path: "/",
    element: <UserRoot />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <RootRedirect /> },
      { path: "login", element: <UserLogin /> },
      { path: "signup", element: <UserSignUp /> },
      { path: "turfs", element: <UserTurf /> },
      { path: "turf/:id", element: <UserTurfDetails /> },
      { path: "profile", element: <ProtectedRoute><UserProfile /></ProtectedRoute> },
      { path: "blogs", element: <UserBlogs /> },
      { path: "blogs/:id", element: <UserBlogDetail /> },
      { path: "booking-history", element: <ProtectedRoute><UserTurfBookingHistory /></ProtectedRoute> },

      
      // Business Landings
      { path: "business/venue", element: <UserVenueOwnerLanding /> },
      { path: "business/coach", element: <UserCoachLanding /> },
      { path: "business/official", element: <UserUmpireLanding /> },
      { path: "business/register", element: <BusinessRegistration /> },
      
      // Business Auth
      { path: "signup/venue", element: <VenueOwnerSignUp /> },
      { path: "signup/coach", element: <CoachSignUp /> },
      { path: "signup/official", element: <UmpireSignUp /> },
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
