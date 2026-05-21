import { baseApi } from "./baseApi";

export const scoringApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    setupScoringMatch: builder.mutation({
      query: (data) => ({
        url: "/scoring/setup",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Scoring"],
    }),
    getMyScoringGames: builder.query({
      query: () => "/scoring/my-games",
      providesTags: ["Scoring"],
    }),
  }),
});

export const {
  useSetupScoringMatchMutation,
  useGetMyScoringGamesQuery,
} = scoringApi;
