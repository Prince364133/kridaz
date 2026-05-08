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
    })
  }),
});

export const {
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateGroupChatMutation,
  useAccessChatMutation,
  useRespondToInvitationMutation,
  useGetFollowersFollowingQuery
} = chatApi;
