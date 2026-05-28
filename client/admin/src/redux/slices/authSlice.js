import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isLoggedIn: false,
    isAuthenticated: false,
    token: null,
    role: null,
    user: null,
    followingIds: [],
  },
  reducers: {
    login: (state, action) => {
      state.token = action.payload.token || state.token;
      state.role = action.payload.role || state.role;
      state.user = action.payload.user || state.user;
      state.followingIds = action.payload.followingIds || [];
      state.isAuthenticated = true;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.user = null;
      state.followingIds = [];
      state.isAuthenticated = false;
      state.isLoggedIn = false;
    },
    restoreAuth: (state, action) => {
      state.user = action.payload.user || state.user;
      state.role = action.payload.role || state.role;
      state.token = action.payload.token || state.token;
      state.followingIds = action.payload.followingIds || state.followingIds;
      state.isAuthenticated = true;
      state.isLoggedIn = true;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { login, logout, updateUser, restoreAuth } = authSlice.actions;
export default authSlice.reducer;
