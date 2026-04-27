import { api } from '@/lib/redux/api';

interface PaginatedUsers {
  data: any[];
  nextCursor: string | null;
}

export const socialApi = api.injectEndpoints({
  endpoints: (builder) => ({
    followAccount: builder.mutation<void, string>({
      query: (accountId) => ({
        url: `/social/users/${accountId}/follow`,
        method: 'POST',
      }),
      invalidatesTags: ['SocialConnections', 'UserProfile'],
    }),
    unfollowAccount: builder.mutation<void, string>({
      query: (accountId) => ({
        url: `/social/users/${accountId}/follow`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SocialConnections', 'UserProfile'],
    }),
    followVenue: builder.mutation<void, string>({
      query: (venueId) => ({
        url: `/social/venues/${venueId}/follow`,
        method: 'POST',
      }),
      invalidatesTags: ['SocialConnections', 'VenueProfile'],
    }),
    unfollowVenue: builder.mutation<void, string>({
      query: (venueId) => ({
        url: `/social/venues/${venueId}/follow`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SocialConnections', 'VenueProfile'],
    }),
    blockUser: builder.mutation<void, string>({
      query: (accountId) => ({
        url: `/social/users/${accountId}/block`,
        method: 'POST',
      }),
      invalidatesTags: ['SocialConnections', 'UserProfile'],
    }),
    unblockUser: builder.mutation<void, string>({
      query: (accountId) => ({
        url: `/social/users/${accountId}/block`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SocialConnections', 'UserProfile'],
    }),
    getAccountFollowers: builder.query<PaginatedUsers, { accountId: string; cursor?: string; limit?: number }>({
      query: ({ accountId, cursor, limit }) => ({
        url: `/social/users/${accountId}/followers`,
        params: { cursor, limit },
      }),
      providesTags: ['SocialConnections'],
    }),
    getAccountFollowing: builder.query<PaginatedUsers, { accountId: string; cursor?: string; limit?: number }>({
      query: ({ accountId, cursor, limit }) => ({
        url: `/social/users/${accountId}/following`,
        params: { cursor, limit },
      }),
      providesTags: ['SocialConnections'],
    }),
  }),
});

export const {
  useFollowAccountMutation,
  useUnfollowAccountMutation,
  useFollowVenueMutation,
  useUnfollowVenueMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetAccountFollowersQuery,
  useGetAccountFollowingQuery,
} = socialApi;
