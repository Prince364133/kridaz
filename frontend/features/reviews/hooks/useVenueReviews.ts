import { useState, useEffect, useCallback } from 'react';
import { reviewsApi } from '@/infrastructure/api/reviews.api';
import { toReviewViewModel } from '../mappers/review.mapper';
import type { ReviewViewModel } from '../types';

export function useVenueReviews(venueId: string, limit: number = 5) {
  const [page, setPage] = useState(1);
  const [accumulatedReviews, setAccumulatedReviews] = useState<ReviewViewModel[]>([]);

  const { data, isLoading, isError, error, isFetching } = reviewsApi.useGetVenueReviewsQuery(
    { venueId, page, limit },
    { skip: !venueId }
  );

  useEffect(() => {
    if (data?.data) {
      const newReviews = data.data.map(toReviewViewModel);
      setAccumulatedReviews(prev => {
        if (page === 1) return newReviews;
        // Avoid duplicates if cache hits trigger extra renders
        const existingIds = new Set(prev.map(r => r.id));
        const filteredNew = newReviews.filter(r => !existingIds.has(r.id));
        return [...prev, ...filteredNew];
      });
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (data?.meta && page < data.meta.totalPages && !isFetching) {
      setPage(prev => prev + 1);
    }
  }, [data?.meta, page, isFetching]);

  return {
    reviews: accumulatedReviews,
    meta: data?.meta,
    isLoading: isLoading || isFetching,
    isInitialLoading: isLoading && page === 1,
    isError,
    error,
    loadMore,
    hasMore: data?.meta ? page < data.meta.totalPages : false
  };
}

export function useSubmitReview() {
  const [submitMutation, { isLoading, isError, error, isSuccess }] = reviewsApi.useSubmitReviewMutation();

  const submitReview = async (payload: { bookingId: string; rating: number; comment?: string; images?: string[] }) => {
    return submitMutation(payload).unwrap();
  };

  return {
    submitReview,
    isSubmitting: isLoading,
    isError,
    isSuccess,
    error,
  };
}
