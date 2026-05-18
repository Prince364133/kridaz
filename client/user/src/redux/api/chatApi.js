import { baseApi } from "./baseApi";

const transformUser = (u) => {
  if (!u) return null;
  const idVal = u.id || u._id;
  return {
    ...u,
    _id: idVal,
    id: idVal,
  };
};

const transformChat = (chat) => {
  if (!chat) return chat;
  const chatIdVal = chat.id || chat._id;
  
  const mappedUsers = chat.participants?.map(p => {
    let resolvedUser = null;
    if (p.user) {
      resolvedUser = transformUser(p.user);
    } else if (p.owner) {
      const ownerVal = transformUser(p.owner);
      resolvedUser = {
        ...ownerVal,
        name: p.owner.businessName || p.owner.user?.name || "Owner",
        profilePicture: p.owner.user?.profilePicture,
      };
    }
    
    return {
      ...p,
      _id: p.id,
      user: resolvedUser,
    };
  }) || [];

  const mappedLatestMsg = chat.latestMessage ? {
    ...chat.latestMessage,
    _id: chat.latestMessage.id || chat.latestMessage._id,
    chat: chat.latestMessage.chatId || chat.latestMessage.chat,
    sender: {
      user: chat.latestMessage.senderUser 
        ? transformUser(chat.latestMessage.senderUser) 
        : chat.latestMessage.senderOwner 
          ? transformUser(chat.latestMessage.senderOwner) 
          : null,
    },
  } : null;

  return {
    ...chat,
    _id: chatIdVal,
    id: chatIdVal,
    users: mappedUsers,
    latestMessage: mappedLatestMsg,
    groupAdmins: chat.participants?.filter(p => p.isAdmin).map(p => ({
      ...p,
      _id: p.id,
      user: p.user ? transformUser(p.user) : p.owner ? transformUser(p.owner) : null
    })) || [],
    createdBy: chat.participants?.find(p => p.userId === chat.latestMessage?.senderUserId || p.ownerId === chat.latestMessage?.senderOwnerId) || null,
  };
};

const transformMessage = (msg) => {
  if (!msg) return msg;
  const msgIdVal = msg.id || msg._id;
  const chatIdVal = msg.chatId || msg.chat;
  
  return {
    ...msg,
    _id: msgIdVal,
    id: msgIdVal,
    chat: chatIdVal,
    sender: {
      user: msg.senderUser 
        ? transformUser(msg.senderUser) 
        : msg.senderOwner 
          ? transformUser(msg.senderOwner) 
          : null,
    },
  };
};

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query({
      query: () => "/api/chat",
      transformResponse: (response) => {
        return {
          chats: response?.chats?.map(transformChat) || [],
          invitations: response?.invitations?.map(transformChat) || [],
        };
      },
      providesTags: ["Chat"],
    }),
    getMessages: builder.query({
      query: (chatId) => `/api/chat/message/${chatId}`,
      transformResponse: (response) => {
        return response?.map(transformMessage) || [];
      },
      providesTags: (result, error, chatId) => [{ type: "Message", id: chatId }],
    }),
    sendMessage: builder.mutation({
      query: (data) => ({
        url: "/api/chat/message",
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => {
        return transformMessage(response);
      },
      invalidatesTags: (result, error, { chatId }) => [{ type: "Message", id: chatId }, "Chat"],
    }),
    createGroupChat: builder.mutation({
      query: (data) => ({
        url: "/api/chat/group",
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => {
        return transformChat(response);
      },
      invalidatesTags: ["Chat"],
    }),
    accessChat: builder.mutation({
      query: (userId) => ({
        url: "/api/chat",
        method: "POST",
        body: { userId },
      }),
      transformResponse: (response) => {
        return transformChat(response);
      },
      invalidatesTags: ["Chat"],
    }),
    respondToInvitation: builder.mutation({
      query: ({ chatId, status }) => ({
        url: "/api/chat/respond-invite",
        method: "POST",
        body: { chatId, status },
      }),
      transformResponse: (response) => {
        return transformChat(response);
      },
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
        const result = await fetchWithBQ({
          url: "/api/chat/group/update",
          method: "PUT",
          body: data,
        });
        return result.data ? { data: transformChat(result.data) } : { error: result.error };
      },
      invalidatesTags: ["Chat"],
    }),
    addToGroup: builder.mutation({
      query: (data) => ({
        url: "/api/chat/groupadd",
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => {
        return transformChat(response);
      },
      invalidatesTags: ["Chat"],
    }),
    removeFromGroup: builder.mutation({
      query: (data) => ({
        url: "/api/chat/groupremove",
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => {
        return transformChat(response);
      },
      invalidatesTags: ["Chat"],
    }),
    togglePinChat: builder.mutation({
      query: (data) => ({
        url: "/api/chat/pin",
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => {
        return transformChat(response);
      },
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
      transformResponse: (response) => {
        return response?.map(transformMessage) || response;
      },
      invalidatesTags: ["Chat"],
    }),
    broadcastMessage: builder.mutation({
      query: (data) => ({
        url: "/api/chat/message/broadcast",
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => {
        return response?.map(transformMessage) || response;
      },
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
      transformResponse: (response) => {
        return transformChat(response);
      },
      invalidatesTags: ["Chat"],
    }),
    makeGroupAdmin: builder.mutation({
      query: (data) => ({
        url: "/api/chat/groupadmin",
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => {
        return transformChat(response);
      },
      invalidatesTags: ["Chat"],
    }),
    dismissGroupAdmin: builder.mutation({
      query: (data) => ({
        url: "/api/chat/dismissadmin",
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => {
        return transformChat(response);
      },
      invalidatesTags: ["Chat"],
    }),
    getChatMedia: builder.query({
      query: (chatId) => `/api/chat/message/${chatId}/media`,
      transformResponse: (response) => {
        return response?.map(transformMessage) || [];
      },
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
