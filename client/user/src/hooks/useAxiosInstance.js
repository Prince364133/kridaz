import axios from "axios";
import { store } from "../redux/store";
import { logout } from "../redux/slices/authSlice";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor: attach JWT token from Redux-Persist storage (Optional fallback)
axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor: dispatch logout on expired/invalid token, but ignore /getMe failures for guests
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthCheck = error.config?.url?.includes('/api/user/auth/getMe');
      
      if (!isAuthCheck) {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;











