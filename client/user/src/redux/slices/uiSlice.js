import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loginModal: {
    isOpen: false,
    title: "Login Required",
    message: "Please log in to continue with this action."
  },
  userLocation: null, // { lat, lng, city, state }
  locationStatus: "detecting", // "detecting" | "granted" | "denied"
  isSidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openLoginModal: (state, action) => {
      state.loginModal.isOpen = true;
      state.loginModal.title = action.payload?.title || "Login Required";
      state.loginModal.message = action.payload?.message || "Please log in to continue with this action.";
    },
    closeLoginModal: (state) => {
      state.loginModal.isOpen = false;
    },
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
    },
    setLocationStatus: (state, action) => {
      state.locationStatus = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    }
  }
});

export const { openLoginModal, closeLoginModal, setUserLocation, setLocationStatus, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
