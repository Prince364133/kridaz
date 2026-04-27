import { api } from '@/lib/redux/api';
import { 
  PaginatedReviewsDTOSchema, 
  type PaginatedReviewsDTO, 
  type SubmitReviewPayloadDTO 
} from '@/contracts/reviews.contract';
import { endpoints } from '@/infrastructure/config/endpoints';

export const reviewsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVenueReviews: builder.query<PaginatedReviewsDTO, { venueId: string; page: number; limit: number }>({
      query: ({ venueId, page, limit }) => endpoints.core.reviews.byVenueId(venueId, page, limit),
      transformResponse: (response: unknown) => {
        // Enforce strict runtime schema validation
        return PaginatedReviewsDTOSchema.parse(response);
      },
      providesTags: (result, error, arg) => [{ type: 'Reviews' as const, id: arg.venueId }],
    }),
    submitReview: builder.mutation<void, SubmitReviewPayloadDTO>({
      query: (body) => ({
        url: endpoints.core.reviews.create(),
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reviews'],
    }),
  }),
});
