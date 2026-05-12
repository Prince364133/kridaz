import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { login } from "@redux/slices/authSlice";
import API from "./services/api";

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
 const theme = useSelector((state) => state.theme.current);

 useEffect(() => {
 document.documentElement.setAttribute("data-theme", theme);
 }, [theme]);

 useEffect(() => {
 const checkAuth = async () => {
 // If not logged in in Redux, check if we have a cookie
 if (!isLoggedIn) {
 const token = getCookie("auth_token");
 if (token) {
 try {
 // Call the getMe endpoint to get the full user object
 const response = await API.get("/user/auth/getMe");
 if (response.data.success) {
 const { user, role } = response.data;
 // Sync Redux with fresh data from server
 dispatch(login({ token, role, user }));
 }
 } catch (error) {
 console.error("Auto-login failed:", error);
 // If token is invalid/expired, we might want to clear the cookie
 // document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
 }
 }
 }
 };

 checkAuth();
 }, [dispatch, isLoggedIn]);

 return <RouterProvider router={router} />;
}
 