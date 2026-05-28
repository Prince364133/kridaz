import { combineReducers } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import authReducer from "./slices/authSlice";
import { baseApi } from "./api/baseApi";

const rootReducer = combineReducers({
  theme: themeReducer,
  auth: authReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export default rootReducer;
