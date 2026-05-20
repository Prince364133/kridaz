import { baseApi } from "./baseApi";

export const transformMessage = (msg) => {
  if (!msg) return msg;

  let sender = null;
  if (msg.senderUser) {
    sender = {
      ...msg.senderUser,
      _id: msg.senderUser.id,
      id: msg.senderUser.id,
      user: {
        ...msg.senderUser,
        _id: msg.senderUser.id,
        id: msg.senderUser.id,
      }
    };
  } else if (msg.senderOwner) {
    sender = {
      ...msg.senderOwner,
      _id: msg.senderOwner.id,
      id: msg.senderOwner.id,
      name: msg.senderOwner.businessName || msg.senderOwner.user?.name,
      profilePicture: msg.senderOwner.user?.profilePicture,
      user: {
        ...msg.senderOwner,
        _id: msg.senderOwner.id,
        id: msg.senderOwner.id,
        name: msg.senderOwner.businessName || msg.senderOwner.user?.name,
        profilePicture: msg.senderOwner.user?.profilePicture,
      }
    };
  } else if (msg.sender) {
    sender = msg.sender;
  }

  let chat = msg.chat;
  if (chat && typeof chat === 'object') {
    chat = {
      ...chat,
      _id: chat.id,
    };
  }

  return {
    ...msg,
    _id: msg.id,
    sender,
    chat,
  };
};

export const transformChat = (chat) => {
  if (!chat) return chat;

  const users = (chat.participants || []).map((p) => {
    let userObj = p.user;
    if (p.owner) {
      userObj = {
        ...p.owner.user,
        name: p.owner.businessName || p.owner.user?.name,
        profilePicture: p.owner.user?.profilePicture,
        ...p.owner,
      };
    }
    
    const userId = p.userId || p.ownerId;
    const resolvedUserObj = userObj ? {
      ...userObj,
      _id: userObj.id || userId,
      id: userObj.id || userId,
    } : {
      _id: userId,
      id: userId,
      name: "Deleted User",
    };

    return {
      ...p,
      _id: p.id,
      user: resolvedUserObj,
    };
  });

  const groupAdmins = (chat.participants || [])
    .filter((p) => p.role === 'ADMIN' || p.role === 'SUPER_ADMIN' || p.isChatAdmin || p.isAdmin)
    .map((p) => {
      let userObj = p.user;
      if (p.owner) {
        userObj = {
          ...p.owner.user,
          name: p.owner.businessName || p.owner.user?.name,
          profilePicture: p.owner.user?.profilePicture,
          ...p.owner,
        };
      }
      const userId = p.userId || p.ownerId;
      return {
        ...p,
        _id: p.id,
        user: userObj ? {
          ...userObj,
          _id: userObj.id || userId,
          id: userObj.id || userId,
        } : {
          _id: userId,
          id: userId,
        }
      };
    });

  let createdBy = chat.createdBy;
  if (chat.createdByUser) {
    createdBy = {
      ...chat.createdByUser,
      _id: chat.createdByUser.id,
    };
  } else if (chat.createdByOwner) {
    createdBy = {
      ...chat.createdByOwner,
      _id: chat.createdByOwner.id,
      name: chat.createdByOwner.businessName || chat.createdByOwner.user?.name,
      profilePicture: chat.createdByOwner.user?.profilePicture,
    };
  } else if (chat.createdByUserId) {
    createdBy = {
      _id: chat.createdByUserId,
      id: chat.createdByUserId,
    };
  } else if (chat.createdByOwnerId) {
    createdBy = {
      _id: chat.createdByOwnerId,
      id: chat.createdByOwnerId,
    };
  }

  let latestMessage = chat.latestMessage;
  if (latestMessage) {
    latestMessage = transformMessage(latestMessage);
  }

  return {
    ...chat,
    _id: chat.id,
    users,
    groupAdmins,
    createdBy,
    latestMessage,
  };
};

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query({
      query: () => "/api/chat",
      transformResponse: (response) => Array.isArray(response) ? response.map(transformChat) : response,
      providesTags: ["Chat"],
    }),
    getMessages: builder.query({
      query: (chatId) => `/api/chat/message/${chatId}`,
      transformResponse: (response) => Array.isArray(response) ? response.map(transformMessage) : response,
      providesTags: (result, error, chatId) => [{ type: "Message", id: chatId }],
    }),
    sendMessage: builder.mutation({
      query: (data) => ({
        url: "/api/chat/message",
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => transformMessage(response),
      invalidatesTags: (result, error, { chatId }) => [{ type: "Message", id: chatId }, "Chat"],
    }),
    createGroupChat: builder.mutation({
      query: (data) => ({
        url: "/api/chat/group",
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => transformChat(response),
      invalidatesTags: ["Chat"],
    }),
    accessChat: builder.mutation({
      query: (userId) => ({
        url: "/api/chat",
        method: "POST",
        body: { userId },
      }),
      transformResponse: (response) => transformChat(response),
      invalidatesTags: ["Chat"],
    }),
    respondToInvitation: builder.mutation({
      query: ({ chatId, status }) => ({
        url: "/api/chat/respond-invite",
        method: "POST",
        body: { chatId, status },
      }),
      transformResponse: (response) => transformChat(response),
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
      transformResponse: (response) => transformChat(response),
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
