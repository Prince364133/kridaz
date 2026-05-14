import { baseApi } from './baseApi';

export const reelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReelsFeed: builder.query({
      query: ({ cursor, initialId } = {}) => {
        let url = '/api/reels/feed?';
        if (cursor) url += `cursor=${cursor}&`;
        if (initialId) url += `initialId=${initialId}&`;
        return url;
      },
      providesTags: ['Reels'],
      // Merge logic for infinite scroll
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        if (!currentCache) return newItems;
        return {
          ...newItems,
          reels: [...currentCache.reels, ...newItems.reels],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
    uploadReel: builder.mutation({
      query: (formData) => ({
        url: '/api/reels/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Reels'],
    }),
    interactWithReel: builder.mutation({
      query: ({ reelId, ...data }) => ({
        url: `/api/reels/${reelId}/interact`,
        method: 'POST',
        body: data,
      }),
      async onQueryStarted({ reelId, type }, { dispatch, queryFulfilled }) {
        // Optimistic update for likes
        if (type === 'like') {
          const patchResult = dispatch(
            reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
              const reel = draft.reels.find((r) => r._id === reelId);
              if (reel) {
                reel.stats.likes += 1;
              }
            })
          );
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        }
      },
    }),
    addComment: builder.mutation({
      query: ({ reelId, ...data }) => ({
        url: `/api/reels/${reelId}/comment`,
        method: 'POST',
        body: data,
      }),
      async onQueryStarted({ reelId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
            const reel = draft.reels.find((r) => r._id === reelId);
            if (reel) {
              reel.stats.comments += 1;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteReel: builder.mutation({
      query: (reelId) => ({
        url: `/api/reels/${reelId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(reelId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
            draft.reels = draft.reels.filter((r) => r._id !== reelId);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    getCreatorAnalytics: builder.query({
      query: () => '/api/reels/analytics',
    }),
    getRecommendedReels: builder.query({
      query: (cursor) => `/api/reels/recommended${cursor ? `?cursor=${cursor}` : ''}`,
      providesTags: ['Reels'],
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newItems) => {
        if (!currentCache) return newItems;
        return {
          ...newItems,
          reels: [...currentCache.reels, ...newItems.reels],
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
    trackHeartbeat: builder.mutation({
      query: ({ reelId, ...data }) => ({
        url: `/api/reels/${reelId}/heartbeat`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetReelsFeedQuery,
  useGetRecommendedReelsQuery,
  useUploadReelMutation,
  useInteractWithReelMutation,
  useAddCommentMutation,
  useDeleteReelMutation,
  useGetCreatorAnalyticsQuery,
  useTrackHeartbeatMutation,
} = reelsApi;
