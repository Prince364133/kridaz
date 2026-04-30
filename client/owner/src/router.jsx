import { createBrowserRouter, Navigate } from "react-router-dom";

// import {ProtectedRoute} from "@components/ProtectedRoute"

import Home from "@pages/Home.jsx";
import Login from "@pages/Login";
import VenueOwnerLanding from "@pages/VenueOwnerLanding";
import CoachLanding from "@pages/CoachLanding";
import UmpireLanding from "@pages/UmpireLanding";
import PartnersGateway from "@pages/PartnersGateway";
import VenueOwnerSignUp from "@pages/VenueOwnerSignUp";
import CoachSignUp from "@pages/CoachSignUp";
import UmpireSignUp from "@pages/UmpireSignUp";
import ComingSoon from "@pages/ComingSoon";

//  all the components that are used in the layout
import { AdminLayout, PartnerLayout, GuestLayout, CoachLayout, UmpireLayout } from "@layouts";

import {
  AddTurf,
  OwnerDashboard as PartnerDashboard,
  TurfManagement,
  OwnerReviews as PartnerReviews,
  OwnerBookings as PartnerBookings,
} from "@components/owner";
import CoachDashboard from "./components/coach/CoachDashboard";
import UmpireDashboard from "./components/umpire/UmpireDashboard";

//  all the components that are used in the admin dashboard
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

// 404 page

import { NotFound } from "@components/common";

const router = createBrowserRouter([
  {
    path: "/",
    element: <GuestLayout />,
    errorElement: <NotFound />,
    children: [
      {
        path: "",
        element: <Navigate to="/login" replace />,
      },
      {
        path: "venue-owner",
        element: <VenueOwnerLanding />,
      },
      {
        path: "coach-landing",
        element: <CoachLanding />,
      },
      {
        path: "umpire-landing",
        element: <UmpireLanding />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup/venue-owner",
        element: <VenueOwnerSignUp />,
      },
      {
        path: "signup/coach",
        element: <CoachSignUp />,
      },
      {
        path: "signup/umpire",
        element: <UmpireSignUp />,
      },
      {
        path: "coming-soon",
        element: <ComingSoon />,
      },
      {
        path: "partners",
        element: <PartnersGateway />,
      },
    ],
  },
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
        path: "partners",
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
    ],
  },
  {
    path: "/partner",
    element: (
      <ProtectedRoute requiredRole="owner">
        <PartnerLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "", element: <PartnerDashboard /> },
      { path: "add-turf", element: <AddTurf /> },
      { path: "turfs", element: <TurfManagement /> },
      { path: "reviews", element: <PartnerReviews /> },
      { path: "bookings", element: <PartnerBookings /> },
    ],
  },
  {
    path: "/coach",
    element: (
      <ProtectedRoute requiredRole="coach">
        <CoachLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "", element: <CoachDashboard /> },
    ],
  },
  {
    path: "/umpire",
    element: (
      <ProtectedRoute requiredRole="umpire">
        <UmpireLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "", element: <UmpireDashboard /> },
    ],
  },
  // Legacy Redirects
  {
    path: "/owner",
    element: <Navigate to="/partner" replace />,
  },
  {
    path: "/owner/add-turf",
    element: <Navigate to="/partner/add-turf" replace />,
  },
  {
    path: "/owner/turfs",
    element: <Navigate to="/partner/turfs" replace />,
  },
  {
    path: "/owner/reviews",
    element: <Navigate to="/partner/reviews" replace />,
  },
  {
    path: "/owner/bookings",
    element: <Navigate to="/partner/bookings" replace />,
  },
]);

export default router;
