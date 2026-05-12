import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import router from "./router";
import { login, logout, restoreAuth, setFollowingIds } from "./redux/slices/authSlice";
import axiosInstance from "@hooks/useAxiosInstance";

// Simple JWT decoder (no verification, just payload extraction)
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Helper to get cookie by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

import { SocketProvider } from "./context/SocketContext";

export default function App() {
  console.log("App.jsx: Rendering App component...");
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.current);
  const authState = useSelector((state) => state.auth);
  // If we have a persisted session, don't show the blocking loading screen
  const [loading, setLoading] = useState(!authState.isLoggedIn);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    const authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("App.jsx: Auth initialization timed out (5s). Forcing UI render.");
        setLoading(false);
      }
    }, 5000);

    const initAuth = async () => {
      console.log("App.jsx: Starting auth check...");
      try {
        const meResponse = await axiosInstance.get("/api/user/auth/getMe");
        
        if (isMounted && meResponse.data.success) {
          console.log("App.jsx: Session verified successfully.");
          // Only fetch network if getMe succeeds
          const networkResponse = await axiosInstance.get("/api/user/players/network").catch(() => ({ data: { success: false } }));
          
          dispatch(restoreAuth({
            user: meResponse.data.user,
            role: meResponse.data.role,
            token: meResponse.data.token,
            followingIds: networkResponse.data.success 
              ? (networkResponse.data.following || []).filter(u => u).map(u => u._id)
              : []
          }));
        }
      } catch (error) {
        if (isMounted) {
          // 401/403 means session is definitively invalid or guest access
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // ONLY logout if we THOUGHT we were logged in. 
            // If we're already logged out (guest), don't trigger anything.
            if (authState.isLoggedIn) {
              console.warn("App.jsx: Session expired, logging out.");
              dispatch(logout());
            }
          } else {
            console.warn("App.jsx: Auth check failed due to network/server issue. Preserving existing session.", error.message);
          }
        }
      } finally {
        if (isMounted) {
          clearTimeout(authTimeout);
          setLoading(false);
        }
      }
    };

    // If we're already logged in, do the check in background
    // If not logged in, we stay in loading state until check completes (auto-login check)
    initAuth();
    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#84CC16] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Initializing Arena...</p>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <RouterProvider router={router} />
    </SocketProvider>
  );
}
 