import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import router from "./router";
import { login } from "./redux/slices/authSlice";
import axiosInstance from "./hooks/useAxiosInstance";

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
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.theme.current);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getCookie("auth_token");
      if (token) {
        try {
          const decoded = decodeToken(token);
          if (!decoded) return;

          // Determine which endpoint to hit based on token role
          const isProfessional = ["owner", "coach", "umpire", "admin"].includes(decoded.role);
          const apiPath = isProfessional ? "/api/owner/auth/getMe" : "/api/user/auth/getMe";

          const response = await axiosInstance.get(apiPath);
          if (response.data.success) {
            dispatch(login({
              token,
              role: response.data.role,
              user: response.data.user
            }));
          }
        } catch (error) {
          console.error("Auto-login failed:", error.message);
        }
      }
    };

    if (!isAuthenticated) {
      initAuth();
    }
  }, [dispatch, isAuthenticated]);

  return <RouterProvider router={router} />;
}
 