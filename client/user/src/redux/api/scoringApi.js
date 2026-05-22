import { baseApi } from "./baseApi";

export const scoringApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Create a new scoring match (7-step wizard final submit)
     */
    setupScoringMatch: builder.mutation({
      query: (data) => ({
        url: "/api/scoring/setup",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Scoring"],
    }),

    /**
     * Get all scoring games for the current user (for sidebar / team page card)
     */
    getMyScoringGames: builder.query({
      query: () => "/api/scoring/my-games",
      providesTags: ["Scoring"],
    }),

    /**
     * Get full details for a single scoring game by ID
     */
    getScoringGameById: builder.query({
      query: (gameId) => `/api/scoring/game/${gameId}`,
      providesTags: (result, err, gameId) => [{ type: "Scoring", id: gameId }],
    }),

    /**
     * Authenticate scoring app access — exchange password for a short-lived JWT
     */
    authenticateScoringApp: builder.mutation({
      query: ({ gameId, password }) => ({
        url: `/api/scoring/auth/${gameId}`,
        method: "POST",
        body: { password },
      }),
    }),
  }),
});

export const {
  useSetupScoringMatchMutation,
  useGetMyScoringGamesQuery,
  useGetScoringGameByIdQuery,
  useAuthenticateScoringAppMutation,
} = scoringApi;
