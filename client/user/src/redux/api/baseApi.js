import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "@redux/slices/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "",
  prepareHeaders: (headers, { getState }) => {
    // Get token from auth state
    const state = /** @type {any} */ (getState());
    const token = state.auth?.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    // Dispatch logout to let Redux and ProtectedRoutes handle the redirect
    // instead of a hard page reload.
    api.dispatch(logout());
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: ["Chat", "Message", "User", "Team", "Games", "Reel", "Community", "Booking", "Turf", "Stories", "Scoring"],
});

