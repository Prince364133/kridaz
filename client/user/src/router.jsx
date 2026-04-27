import { createBrowserRouter } from "react-router-dom";
import Root from "@/layouts/Root";
import LandingHome from "@/home/page";
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import { VenuesDashboard as Turf } from "@/features/venues/components/VenuesDashboard";
import { VenueDetailsDashboard as TurfDetails } from "@/features/venues/components/VenueDetailsDashboard";
import BecomeOwner from "@/features/becomeOwner/BecomeOwner";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import Reservation from "@/components/Reservation";
import TurfBookingHistory from "@/components/turf/TurfBookingHistory";
import NotFound from "@/components/common/NotFound";
import VenueBookingPage from "@/venues/[venueId]/booking/page";
import VenueCheckoutPage from "@/venues/[venueId]/checkout/page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <NotFound />,
    children: [
      {
        path: "",
        element: <LandingHome />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <SignUp />,
      },
      {
        path: "turfs",
        element: <Turf />,
      },
      {
        path: "venues",
        element: <Turf />,
      },
      {
        path: "turf/:venueId",
        element: <TurfDetails />,
      },
      {
        path: "venues/:venueId",
        element: <TurfDetails />,
      },
      {
        path: "venues/:venueId/booking",
        element: <VenueBookingPage />,
      },
      {
        path: "venues/:venueId/checkout",
        element: <VenueCheckoutPage />,
      },
    ],
  },
  {
    path: "/auth",
    element: <ProtectedLayout />,
    children: [
      {
        path: "",
        element: <LandingHome />,
      },
      {
        path: "turfs",
        element: <Turf />,
      },
      {
        path: "turf/:venueId",
        element: <TurfDetails />,
      },
      {
        path: "reserve/:id",
        element: <Reservation />,
      },
      {
        path: "become-owner",
        element: <BecomeOwner />,
      },
      {
        path: "booking-history",
        element: <TurfBookingHistory />,
      },
    ],
  },
]);

export default router;
