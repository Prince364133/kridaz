import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Venue } from '@/lib/types/venue.types';

export interface VenuesState {
  venues: Venue[];
  isLoading: boolean;
  error: string | null;
}

const initialState: VenuesState = {
  venues: [],
  isLoading: false,
  error: null,
};

const venuesSlice = createSlice({
  name: 'venues',
  initialState,
  reducers: {
    setVenues: (state, action: PayloadAction<Venue[]>) => {
      state.venues = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setVenues, setLoading, setError } = venuesSlice.actions;

export default venuesSlice.reducer;
