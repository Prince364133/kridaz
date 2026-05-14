import { baseApi } from './baseApi';

export const communityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommunityFeed: builder.query({
      query: () => '/api/user/community',
      providesTags: ['Community'],
    }),
    getStoriesFeed: builder.query({
      query: () => '/api/user/stories/feed',
      providesTags: ['Stories'],
    }),
    getCommunityStats: builder.query({
      query: () => '/api/user/community/stats',
      providesTags: ['Community'],
    }),
    createPost: builder.mutation({
      query: (formData) => ({
        url: '/api/user/community',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Community'],
    }),
    updatePost: builder.mutation({
      query: ({ postId, formData }) => ({
        url: `/api/user/community/${postId}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Community'],
    }),
    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/api/user/community/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Community'],
    }),
    likePost: builder.mutation({
      query: (postId) => ({
        url: `/api/user/community/${postId}/like`,
        method: 'POST',
      }),
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        // Optimistic update for likes
        const patchResult = dispatch(
          communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
            const post = draft.posts.find((p) => p._id === postId);
            // This is a simplified optimistic update; real implementation depends on user state
            if (post) {
               // We don't have the user ID easily here without extra logic, 
               // but we can increment length as a placeholder or wait for response.
               // For now, let's wait for queryFulfilled for likes as it's more complex (add/remove).
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Community'],
    }),
    addComment: builder.mutation({
      query: ({ postId, text }) => ({
        url: `/api/user/community/${postId}/comment`,
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: ['Community'],
    }),
    deleteComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/api/user/community/${postId}/comment/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Community'],
    }),
    getUserStories: builder.query({
      query: (userId) => `/api/user/community/user-stories/${userId}`,
    }),
    uploadStory: builder.mutation({
      query: (formData) => ({
        url: '/api/user/stories',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Stories'],
    }),
    deleteStory: builder.mutation({
      query: (storyId) => ({
        url: `/api/user/stories/${storyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Stories'],
    }),
  }),
});

export const {
  useGetCommunityFeedQuery,
  useGetStoriesFeedQuery,
  useGetCommunityStatsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useGetUserStoriesQuery,
  useUploadStoryMutation,
  useDeleteStoryMutation,
} = communityApi;
