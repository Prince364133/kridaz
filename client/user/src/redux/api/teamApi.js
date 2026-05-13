import { baseApi } from "./baseApi";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTeam: builder.mutation({
      query: (body) => ({
        url: "/api/team",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Team"],
    }),
    getMyTeams: builder.query({
      query: () => "/api/team",
      providesTags: ["Team"],
    }),
    getTeamById: builder.query({
      query: (id) => `/api/team/${id}`,
      providesTags: (result, error, id) => [{ type: "Team", id }],
    }),
    inviteMembers: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/team/${id}/invite`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Team", id }],
    }),
    joinTeam: builder.mutation({
      query: (token) => ({
        url: `/api/team/join/${token}`,
        method: "POST",
      }),
      invalidatesTags: ["Team"],
    }),
    getAllTeams: builder.query({
      query: (params) => ({
        url: "/api/team/all",
        params,
      }),
      providesTags: ["Team"],
    }),
    findTeamByCode: builder.query({
      query: (code) => `/api/team/find-by-code/${code}`,
    }),
    requestOpponent: builder.mutation({
      query: ({ teamId, targetTeamId }) => ({
        url: `/api/team/${teamId}/request-opponent`,
        method: "POST",
        body: { targetTeamId },
      }),
      invalidatesTags: (result, error, { teamId }) => [{ type: "Team", id: teamId }],
    }),
    handleOpponentRequest: builder.mutation({
      query: ({ teamId, requestId, action }) => ({
        url: `/api/team/${teamId}/handle-opponent-request`,
        method: "POST",
        body: { requestId, action },
      }),
      invalidatesTags: (result, error, { teamId }) => [{ type: "Team", id: teamId }],
    }),
    getOpponentTeams: builder.query({
      query: () => "/api/team/opponents",
      providesTags: ["Team"],
    }),
    getNetwork: builder.query({
      query: () => '/api/players/network',
    }),
  }),
});

export const {
  useCreateTeamMutation,
  useGetMyTeamsQuery,
  useGetTeamByIdQuery,
  useInviteMembersMutation,
  useJoinTeamMutation,
  useGetAllTeamsQuery,
  useFindTeamByCodeQuery,
  useLazyFindTeamByCodeQuery,
  useRequestOpponentMutation,
  useHandleOpponentRequestMutation,
  useGetOpponentTeamsQuery,
  useGetNetworkQuery,
} = teamApi;
