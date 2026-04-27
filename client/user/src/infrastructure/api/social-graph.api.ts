import { api } from '@/lib/redux/api';
import { 
  VenueFollowStatusDTOSchema, 
  type VenueFollowStatusDTO,
  FollowActionResponseDTOSchema,
  type FollowActionResponseDTO
} from '@/contracts/social-graph.contract';
import { endpoints } from '@/infrastructure/config/endpoints';

export const socialGraphApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVenueFollowStatus: builder.query<VenueFollowStatusDTO, string>({
      queryFn: (venueId) => {
        return { data: { isFollowing: false, followersCount: 0 } };
      },
      providesTags: (result, error, id) => [{ type: 'Venues' as const, id }],
    }),
    
    followVenue: builder.mutation<FollowActionResponseDTO, string>({
      queryFn: (venueId) => {
        return { data: { success: true, message: "Mock followed" } };
      },
      invalidatesTags: (result, error, id) => [{ type: 'Venues' as const, id }],
    }),

    unfollowVenue: builder.mutation<FollowActionResponseDTO, string>({
      queryFn: (venueId) => {
        return { data: { success: true, message: "Mock unfollowed" } };
      },
      invalidatesTags: (result, error, id) => [{ type: 'Venues' as const, id }],
    }),
  }),
});

export const { 
  useGetVenueFollowStatusQuery, 
  useFollowVenueMutation, 
  useUnfollowVenueMutation 
} = socialGraphApi;
