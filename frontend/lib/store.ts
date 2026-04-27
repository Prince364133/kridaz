import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '@/lib/redux/api';
import authReducer from './redux/features/auth/authSlice';
import venuesReducer from './redux/features/venues/venuesSlice';

import notificationsReducer from './redux/features/notifications/notificationsSlice';
import { rtkQueryErrorLogger } from './redux/query-logger-middleware'; // Import the new middleware

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    venues: venuesReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, rtkQueryErrorLogger), // Add the logger middleware
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
