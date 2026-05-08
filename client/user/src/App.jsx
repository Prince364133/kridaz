import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import router from "./router";
import { login, logout } from "./redux/slices/authSlice";
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

export default function App() {
  console.log("App.jsx: Rendering App component...");
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.current);
  const [loading, setLoading] = useState(true);

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
      console.log("App.jsx: Starting initAuth...");
      try {
        const response = await axiosInstance.get("/api/user/auth/getMe");
        console.log("App.jsx: /getMe response status:", response.status);
        if (isMounted && response.data.success) {
          dispatch(login({
            user: response.data.user,
            role: response.data.role,
            token: response.data.token
          }));
        }
      } catch (error) {
        if (isMounted) {
          dispatch(logout());
          console.warn("App.jsx: Auth initialization failed/expired:", error.message);
        }
      } finally {
        if (isMounted) {
          clearTimeout(authTimeout);
          console.log("App.jsx: initAuth complete, setting loading to false");
          setLoading(false);
        }
      }
    };

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

  return <RouterProvider router={router} />;
}
 