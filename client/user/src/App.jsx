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
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";

export default function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.current);
  const authState = useSelector((state) => state.auth);
  // If we have a persisted session, don't show the blocking loading screen
  const [loading, setLoading] = useState(false);

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
        // Run getMe and network checks in parallel to save time
        const [meResponse, networkResponse] = await Promise.all([
          axiosInstance.get("/api/user/auth/getMe"),
          axiosInstance.get("/api/user/players/network").catch(() => ({ data: { success: false } }))
        ]);
        
        if (isMounted && meResponse.data.success) {
          console.log("App.jsx: Session verified successfully.");
          
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

  // Refetch user data on window focus to catch role upgrades (e.g. approved by admin in another tab)
  useEffect(() => {
    const handleFocus = () => {
      if (authState.isLoggedIn) {
        axiosInstance.get("/api/user/auth/getMe").then(res => {
          if (res.data.success) {
            dispatch(restoreAuth({
              user: res.data.user,
              role: res.data.role,
              token: res.data.token,
              followingIds: authState.followingIds
            }));
          }
        }).catch(err => {
          console.warn("App.jsx: Background auth check on focus failed.", err.message);
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [authState.isLoggedIn, authState.followingIds, dispatch]);



  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <SocketProvider>
        <RouterProvider router={router} />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
      </SocketProvider>
    </GoogleOAuthProvider>
  );
}

 