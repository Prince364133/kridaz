import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { login } from "./redux/slices/authSlice";

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
  const { isLoggedIn } = useSelector((state) => state.auth);

  useEffect(() => {
    // If not logged in in Redux, check if we have a cookie
    if (!isLoggedIn) {
      const token = getCookie("auth_token");
      if (token) {
        const decoded = decodeToken(token);
        if (decoded && decoded.role) {
          // Sync Redux with cookie data
          // User portal login reducer might expect user object or just token
          dispatch(login({ token, role: decoded.role, user: decoded.user }));
        }
      }
    }
  }, [dispatch, isLoggedIn]);

  return <RouterProvider router={router} />;
}
 