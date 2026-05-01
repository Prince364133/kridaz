
import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isLoggedIn: true,
    token: "dummy-token-12345",
    role: "admin",
    user: {
      id: "admin-123",
      name: "Platform Administrator",
      email: "admin@turfspot.com",
    },
  },
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.token = null;
      state.role = null;
      state.user = null;
    },
  
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
