// src/redux/rootReducer.js
import { combineReducers } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import authReducer from "./slices/authSlice";
import turfReducer from "@user/redux/slices/turfSlice";

const rootReducer = combineReducers({
  theme: themeReducer,
  auth: authReducer,
  turf: turfReducer,
});

export default rootReducer;
