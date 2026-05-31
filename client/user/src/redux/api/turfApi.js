import { baseApi } from "./baseApi";

export const turfApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTurfs: builder.query({
      query: (params) => ({
        url: "/api/user/turf/all",
        params,
      }),
      providesTags: ["Turf"],
    }),
  }),
});

export const {
  useGetTurfsQuery,
} = turfApi;
