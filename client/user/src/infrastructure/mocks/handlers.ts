import { http, HttpResponse } from 'msw';
import { endpoints } from '../config/endpoints';

// Example True API Mocking for Reviews endpoint using the strictly typed endpoints registry
export const handlers = [
  http.get(endpoints.core.reviews.byVenueId(':venueId', 1, 5), ({ params }: { params: any }) => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'mock-1',
          author: { id: 'user-1', name: 'Mock User (QA)' },
          rating: 5,
          comment: 'This is a mocked response from MSW, demonstrating offline UI capabilities.',
          images: [],
          status: 'APPROVED',
          isEdited: false,
          createdAt: new Date().toISOString(),
          response: null,
        }
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 5,
        totalPages: 1
      }
    });
  }),
];
