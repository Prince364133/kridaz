import { baseApi } from "./baseApi";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTeam: builder.mutation({
      query: (body) => ({
        url: "/team",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Team"],
    }),
    getMyTeams: builder.query({
      query: () => "/team",
      providesTags: ["Team"],
    }),
    getTeamById: builder.query({
      query: (id) => `/team/${id}`,
      providesTags: (result, error, id) => [{ type: "Team", id }],
    }),
    inviteMembers: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/team/${id}/invite`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Team", id }],
    }),
    joinTeam: builder.mutation({
      query: (token) => ({
        url: `/team/join/${token}`,
        method: "POST",
      }),
      invalidatesTags: ["Team"],
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
  useGetNetworkQuery,
} = teamApi;
