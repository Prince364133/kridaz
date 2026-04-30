import { createBrowserRouter } from "react-router-dom";
import Root from "./layouts/Root";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import PartnersGateway from "./pages/PartnersGateway";
import Turf from "./components/turf/Turf";
import TurfDetails from "./components/turf/TurfDetails";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Reservation from "./components/Reservation";
import TurfBookingHistory from "./components/turf/TurfBookingHistory";
import NotFound from "./components/common/NotFound";
import Profile from "./pages/Profile";
import BlogDetail from "./pages/BlogDetail";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <NotFound />,
    children: [
      {
        path: "",
        element: <Home />,
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
        path: "turf/:id",
        element: <TurfDetails />,
      },
      {
        path: "partners",
        element: <PartnersGateway />,
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "blogs/:id",
        element: <BlogDetail />,
      },
      {
        path: "reserve/:id",
        element: (
          <ProtectedRoute>
            <Reservation />
          </ProtectedRoute>
        ),
      },
      {
        path: "booking-history",
        element: (
          <ProtectedRoute>
            <TurfBookingHistory />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
