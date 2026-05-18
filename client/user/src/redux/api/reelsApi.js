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
      merge: (currentCache, newItems, { arg }) => {
        // If it's a fresh fetch (no cursor), replace the cache
        if (!arg?.cursor) {
          return newItems;
        }
        
        if (!currentCache) return newItems;
        
        // Pagination: combine and deduplicate on Prisma `id` field (UUID)
        const combinedReels = [...currentCache.reels, ...newItems.reels];
        const uniqueReels = combinedReels.filter((v, i, a) => 
          a.findIndex(t => t.id === v.id) === i
        );
        
        return {
          ...newItems,
          reels: uniqueReels,
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
    getReelUploadUrl: builder.query({
      query: (params) => ({
        url: '/api/reels/upload-url',
        params,
      }),
    }),
    confirmReelUpload: builder.mutation({
      query: (data) => ({
        url: '/api/reels/confirm-upload',
        method: 'POST',
        body: data,
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
        // Optimistic update for likes — Prisma UUID is `id`, not `_id`
        if (type === 'like') {
          const patchResult = dispatch(
            reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
              if (!draft?.reels) return;
              const reel = draft.reels.find((r) => r.id === reelId);
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
            if (!draft?.reels) return;
            // Prisma UUID is `id`, not Mongo `_id`
            const reel = draft.reels.find((r) => r.id === reelId);
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
            if (!draft?.reels) return;
            // Prisma UUID is `id`, not Mongo `_id`
            draft.reels = draft.reels.filter((r) => r.id !== reelId);
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
        const combinedReels = [...currentCache.reels, ...newItems.reels];
        const uniqueReels = combinedReels.filter((v, i, a) => 
          a.findIndex(t => t.id === v.id) === i
        );
        return {
          ...newItems,
          reels: uniqueReels,
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
  useGetReelUploadUrlQuery,
  useLazyGetReelUploadUrlQuery,
  useConfirmReelUploadMutation,
  useInteractWithReelMutation,
  useAddCommentMutation,
  useDeleteReelMutation,
  useGetCreatorAnalyticsQuery,
  useTrackHeartbeatMutation,
} = reelsApi;
