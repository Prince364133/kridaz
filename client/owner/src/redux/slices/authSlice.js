// src/redux/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    role: "admin",
    token: "dummy-admin-token-12345",
    isAuthenticated: true,
    user: {
      id: "admin-123",
      name: "Platform Administrator",
      email: "admin@turfspot.com",
    },
  },
  reducers: {
    login: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
