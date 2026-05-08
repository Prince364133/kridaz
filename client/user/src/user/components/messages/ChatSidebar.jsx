import React from 'react';
import { useGetChatsQuery, useRespondToInvitationMutation } from '../../../redux/api/chatApi';
import { useSelector } from 'react-redux';

const ChatSidebar = ({ onSelectChat, selectedChatId, onCreateGroup }) => {
  const { user } = useSelector((state) => state.auth);
  const { data, isLoading, error } = useGetChatsQuery();
  const [respondToInvitation] = useRespondToInvitationMutation();

  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.chatName;
    const otherUser = chat.users.find((u) => u._id !== user?._id);
    return otherUser ? otherUser.name : "Unknown User";
  };

  const getChatImage = (chat) => {
    if (chat.isGroupChat) return "https://cdn-icons-png.flaticon.com/512/166/166258.png";
    const otherUser = chat.users.find((u) => u._id !== user?._id);
    return otherUser?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  };

  const handleRespond = async (chatId, status) => {
    try {
      await respondToInvitation({ chatId, status }).unwrap();
    } catch (err) {
      console.error("Failed to respond to invitation:", err);
    }
  };

  if (isLoading) return <div className="p-4 text-white">Loading chats...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading chats</div>;

  const chats = data?.chats || [];
  const invitations = data?.invitations || [];

  return (
    <div className="w-full md:w-80 h-full border-r border-white/10 bg-black/20 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
        <h2 className="text-xl font-bold text-white">Messages</h2>
        <button 
          onClick={onCreateGroup}
          className="p-2 bg-primary/20 text-primary hover:bg-primary/40 rounded-full transition-all"
          title="Create Group"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Pending Invitations</h3>
            {invitations.map((chat) => (
              <div key={chat._id} className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2 animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <img src={getChatImage(chat)} alt={chat.chatName} className="w-10 h-10 rounded-full border border-white/20" />
                  <div>
                    <p className="text-white font-medium text-sm">{chat.chatName}</p>
                    <p className="text-white/60 text-xs">Invited to join group</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRespond(chat._id, 'accepted')}
                    className="flex-1 py-1.5 bg-primary text-black text-xs font-bold rounded-lg hover:bg-primary/80 transition-all"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleRespond(chat._id, 'rejected')}
                    className="flex-1 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chats Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Conversations</h3>
          {chats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm">No conversations yet</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 ${
                  selectedChatId === chat._id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="relative">
                  <img src={getChatImage(chat)} alt={getChatName(chat)} className="w-12 h-12 rounded-full border border-white/10" />
                  {chat.isGroupChat && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-black text-[10px] px-1 rounded-sm font-bold">GP</div>
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-start">
                    <p className="text-white font-semibold truncate text-sm">{getChatName(chat)}</p>
                    {chat.latestMessage && (
                      <span className="text-[10px] text-white/40">{new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                  <p className="text-white/50 text-xs truncate">
                    {chat.latestMessage ? chat.latestMessage.content : "Start a conversation"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
