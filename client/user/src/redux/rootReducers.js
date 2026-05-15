import { combineReducers } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import authReducer from "./slices/authSlice";
import turfReducer from "./slices/turfSlice";
import uiReducer from "./slices/uiSlice";
import { baseApi } from "./api/baseApi";

import mediaUploadReducer from "./slices/mediaUploadSlice";

const rootReducer = combineReducers({
  theme: themeReducer,
  auth: authReducer,
  turf: turfReducer,
  ui: uiReducer,
  mediaUpload: mediaUploadReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export default rootReducer;
