import { api } from '@/lib/redux/api';
import { Venue } from '@/lib/types/venue.types';
import { endpoints } from '@/infrastructure/config/endpoints';

export const venuesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVenues: builder.query<Venue[], void>({
      query: () => endpoints.core.venues.list(),
    }),
  }),
});

export const { useGetVenuesQuery } = venuesApi;
