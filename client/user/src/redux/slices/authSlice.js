// src/redux/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isLoggedIn: false,
    isAuthenticated: false,
    token: null,
    role: null,
    user: null,
  },
  reducers: {
    login: (state, action) => {
      state.token = action.payload.token || state.token;
      state.role = action.payload.role || state.role;
      state.user = action.payload.user || state.user;
      state.isAuthenticated = true;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoggedIn = false;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
