import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
});

// Request interceptor: attach JWT token from Redux-Persist storage (Optional fallback)
axiosInstance.interceptors.request.use((config) => {
  let token = null;
  try {
    const persistedUser = localStorage.getItem("persist:root");
    if (persistedUser) {
      const parsedUser = JSON.parse(persistedUser);
      if (parsedUser.auth) {
        const parsedAuth = JSON.parse(parsedUser.auth);
        token = parsedAuth.token;
      }
    }
  } catch (error) {
    // Silently fail as the httpOnly cookie will be sent automatically
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor: redirect to login on expired/invalid token
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if NOT already on login/signup pages to avoid loops
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === "/login" || currentPath === "/signup" || currentPath.startsWith("/signup/");
      
      if (!isAuthPage) {
        // We don't manually clear localStorage here because App.jsx will handle 
        // the state sync, and aggressive clearing can cause infinite loops.
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;











