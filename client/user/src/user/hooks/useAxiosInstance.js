import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  withCredentials: true,
});

// Request interceptor: attach JWT token from Redux-Persist storage (Optional fallback)
axiosInstance.interceptors.request.use((config) => {
  let token = null;
  try {
    const persistedRoot = localStorage.getItem("persist:root");
    if (persistedRoot) {
      const parsedRoot = JSON.parse(persistedRoot);
      if (parsedRoot.auth) {
        const parsedAuth = JSON.parse(parsedRoot.auth);
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
      // Clear stale auth state and redirect to login
      localStorage.removeItem("persist:root");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
