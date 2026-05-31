import { baseApi } from "./baseApi";

export const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStatesList: builder.query({
      query: () => "/api/location/states",
      providesTags: ["User"],
    }),
    getCitiesList: builder.query({
      query: (stateName) => `/api/location/cities?state=${stateName}`,
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetStatesListQuery,
  useGetCitiesListQuery,
} = locationApi;
