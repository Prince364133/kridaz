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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshUrl = `${import.meta.env.VITE_API_URL || ""}/api/user/auth/refresh`;
        const { data } = await axios.post(refreshUrl, {}, { withCredentials: true });
        
        if (data.token) {
          store.dispatch(restoreAuth({ token: data.token }));
          processQueue(null, data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return axiosInstance(originalRequest);
        } else {
          store.dispatch(logout());
          processQueue(new Error("Refresh failed"));
        }
      } catch (refreshError) {
        store.dispatch(logout());
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      if (!isAuthCheck) {
        console.warn("API returned 401/403. URL:", originalRequest?.url, "Message:", error.response?.data?.message);
        const msg = error.response?.data?.message || "";
        if (msg.includes("Invalid token") || msg.includes("Session invalid")) {
          store.dispatch(logout());
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;











