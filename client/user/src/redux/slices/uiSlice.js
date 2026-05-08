import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loginModal: {
    isOpen: false,
    title: "Login Required",
    message: "Please log in to continue with this action."
  }
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
    }
  }
});

export const { openLoginModal, closeLoginModal } = uiSlice.actions;
export default uiSlice.reducer;
