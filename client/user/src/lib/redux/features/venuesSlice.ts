
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface VenuesState {
  searchQuery: string;
  filters: {
    sport: string | null;
    date: string | null;
  };
}

const initialState: VenuesState = {
  searchQuery: '',
  filters: {
    sport: null,
    date: null,
  },
};

const venuesSlice = createSlice({
  name: 'venues',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setFilter(state, action: PayloadAction<{ sport?: string; date?: string }>) {
      if (action.payload.sport) {
        state.filters.sport = action.payload.sport;
      }
      if (action.payload.date) {
        state.filters.date = action.payload.date;
      }
    },
    clearFilters(state) {
      state.filters.sport = null;
      state.filters.date = null;
    },
  },
});

export const { setSearchQuery, setFilter, clearFilters } = venuesSlice.actions;

export default venuesSlice.reducer;
