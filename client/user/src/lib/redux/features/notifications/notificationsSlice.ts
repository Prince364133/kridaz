import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationsState {
  // Define your notification state here
  messages: string[];
}

const initialState: NotificationsState = {
  messages: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<string>) => {
      state.messages.push(action.payload);
    },
    clearNotifications: (state) => {
      state.messages = [];
    },
  },
});

export const { addNotification, clearNotifications } = notificationsSlice.actions;

export default notificationsSlice.reducer;
