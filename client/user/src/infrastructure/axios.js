import axios from "axios";
import { store } from "@redux/store";
import { logout, restoreAuth } from "@redux/slices/authSlice";

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
  async (error) => {
    const originalRequest = error.config;
    const isAuthCheck = originalRequest?.url?.includes('/api/user/auth/getMe');

    if (
      error.response?.status === 401 && 
      error.response?.data?.message === "TOKEN_EXPIRED" &&
      !originalRequest._retry && 
      !isAuthCheck
    ) {
      originalRequest._retry = true;
      try {
        const refreshUrl = `${import.meta.env.VITE_API_URL || ""}/api/user/auth/refresh`;
        const { data } = await axios.post(refreshUrl, {}, { withCredentials: true });
        
        if (data.token) {
          store.dispatch(restoreAuth({ token: data.token }));
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      if (!isAuthCheck) {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;











