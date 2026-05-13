import { baseApi } from "./baseApi";

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query({
      query: () => "/api/chat",
      providesTags: ["Chat"],
    }),
    getMessages: builder.query({
      query: (chatId) => `/api/chat/message/${chatId}`,
      providesTags: (result, error, chatId) => [{ type: "Message", id: chatId }],
    }),
    sendMessage: builder.mutation({
      query: (data) => ({
        url: "/api/chat/message",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { chatId }) => [{ type: "Message", id: chatId }, "Chat"],
    }),
    createGroupChat: builder.mutation({
      query: (data) => ({
        url: "/api/chat/group",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    accessChat: builder.mutation({
      query: (userId) => ({
        url: "/api/chat",
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: ["Chat"],
    }),
    respondToInvitation: builder.mutation({
      query: ({ chatId, status }) => ({
        url: "/api/chat/respond-invite",
        method: "POST",
        body: { chatId, status },
      }),
      invalidatesTags: ["Chat"],
    }),
    getFollowersFollowing: builder.query({
      query: () => "/api/user/players/network",
      providesTags: ["User"],
    }),
    markMessagesRead: builder.mutation({
      query: (chatId) => ({
        url: `/api/chat/message/${chatId}/read`,
        method: "PUT",
      }),
    }),
    updateGroup: builder.mutation({
      async queryFn(data, _queryApi, _extraOptions, fetchWithBQ) {
        // If data is FormData (image upload), pass it directly.
        // fetchBaseQuery auto-detects FormData and skips JSON serialization
        // and lets the browser set the correct multipart/form-data Content-Type.
        const result = await fetchWithBQ({
          url: "/api/chat/group/update",
          method: "PUT",
          body: data,
        });
        return result.data ? { data: result.data } : { error: result.error };
      },
      invalidatesTags: ["Chat"],
    }),
    addToGroup: builder.mutation({
      query: (data) => ({
        url: "/api/chat/groupadd",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    removeFromGroup: builder.mutation({
      query: (data) => ({
        url: "/api/chat/groupremove",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    togglePinChat: builder.mutation({
      query: (data) => ({
        url: "/api/chat/pin",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    deleteMessages: builder.mutation({
      query: (data) => ({
        url: "/api/chat/message/delete",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { chatId }) => [{ type: "Message", id: chatId }, "Chat"],
    }),
    forwardMessage: builder.mutation({
      query: (data) => ({
        url: "/api/chat/message/forward",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    broadcastMessage: builder.mutation({
      query: (data) => ({
        url: "/api/chat/message/broadcast",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    deleteChat: builder.mutation({
      query: (chatId) => ({
        url: `/api/chat/${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chat"],
    }),
    clearChat: builder.mutation({
      query: (chatId) => ({
        url: "/api/chat/message/clear",
        method: "POST",
        body: { chatId },
      }),
      invalidatesTags: (result, error, chatId) => [{ type: "Message", id: chatId }, "Chat"],
    }),
    addGroupsToCommunity: builder.mutation({
      query: (data) => ({
        url: "/api/chat/community/add-groups",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    makeGroupAdmin: builder.mutation({
      query: (data) => ({
        url: "/api/chat/groupadmin",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    dismissGroupAdmin: builder.mutation({
      query: (data) => ({
        url: "/api/chat/dismissadmin",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    getChatMedia: builder.query({
      query: (chatId) => `/api/chat/message/${chatId}/media`,
      providesTags: ["Message"],
    }),
  }),
});

export const {
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateGroupChatMutation,
  useAccessChatMutation,
  useRespondToInvitationMutation,
  useGetFollowersFollowingQuery,
  useMarkMessagesReadMutation,
  useUpdateGroupMutation,
  useAddToGroupMutation,
  useRemoveFromGroupMutation,
  useDeleteMessagesMutation,
  useForwardMessageMutation,
  useBroadcastMessageMutation,
  useDeleteChatMutation,
  useClearChatMutation,
  useAddGroupsToCommunityMutation,
  useMakeGroupAdminMutation,
  useDismissGroupAdminMutation,
  useGetChatMediaQuery,
  useTogglePinChatMutation
} = chatApi;
