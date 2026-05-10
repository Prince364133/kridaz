import React from 'react';
import { useGetChatsQuery, useRespondToInvitationMutation } from '../../../redux/api/chatApi';
import { useSelector } from 'react-redux';
import { 
  MessageSquare, 
  Plus, 
  Users, 
  User, 
  Clock, 
  AlertCircle,
  Loader2,
  Check,
  X
} from 'lucide-react';

const ChatSidebar = ({ onSelectChat, selectedChatId, onCreateGroup }) => {
  const { user } = useSelector((state) => state.auth);
  const { data, isLoading, error } = useGetChatsQuery();
  const [respondToInvitation] = useRespondToInvitationMutation();

  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.chatName;
    const otherUser = chat.users?.find((u) => u.user?._id !== user?._id);
    return otherUser?.user?.name || "Unknown User";
  };

  const getChatOtherUser = (chat) => {
    if (chat.isGroupChat) return null;
    return chat.users?.find((u) => u.user?._id !== user?._id)?.user;
  };

  const getChatImage = (chat) => {
    if (chat.isGroupChat) return null;
    const otherUser = getChatOtherUser(chat);
    return otherUser?.profilePicture || otherUser?.profileImage;
  };

  const renderAvatar = (chat) => {
    if (chat.isGroupChat) {
      return (
        <div className="w-12 h-12 rounded-full border border-white/10 bg-[#84CC16]/10 flex items-center justify-center">
          <Users size={22} className="text-[#84CC16]" />
        </div>
      );
    }

    const otherUser = getChatOtherUser(chat);
    const imageUrl = otherUser?.profilePicture || otherUser?.profileImage;

    return (
      <div className="w-12 h-12 rounded-full border border-white/10 bg-[#84CC16]/10 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={otherUser?.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          <span className="text-[#84CC16] font-black text-sm">
            {otherUser?.name ? otherUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : <User size={20} />}
          </span>
        </div>
      </div>
    );
  };

  const handleRespond = async (chatId, status) => {
    try {
      await respondToInvitation({ chatId, status }).unwrap();
    } catch (err) {
      console.error("Failed to respond to invitation:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full md:w-80 h-full border-r border-white/10 bg-black/20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#84CC16] animate-spin mb-4 opacity-20" />
        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Loading Chats</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full md:w-80 h-full border-r border-white/10 bg-black/20 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-white font-bold mb-2">Sync Failed</h3>
        <p className="text-white/40 text-xs mb-6">We couldn't load your conversations. Please try again.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const chats = data?.chats || [];
  const invitations = data?.invitations || [];

  return (
    <div className="w-full md:w-80 h-full border-r border-white/10 bg-black/20 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">Messages</h2>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Inbox & Groups</p>
        </div>
        <button 
          onClick={onCreateGroup}
          className="w-10 h-10 bg-[#84CC16]/10 text-[#84CC16] hover:bg-[#84CC16] hover:text-black rounded-xl transition-all flex items-center justify-center group"
          title="Create Group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div className="space-y-3">
            <h3 className="px-3 text-[10px] font-black text-[#84CC16] uppercase tracking-[0.2em]">Pending Invitations</h3>
            {invitations.map((chat) => (
              <div key={chat._id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                    {getChatImage(chat) ? (
                      <img src={getChatImage(chat)} alt={chat.chatName} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={18} className="text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{chat.chatName}</p>
                    <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Group Invitation</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRespond(chat._id, 'accepted')}
                    className="flex-1 h-10 bg-[#84CC16] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleRespond(chat._id, 'rejected')}
                    className="flex-1 h-10 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chats Section */}
        <div className="space-y-1">
          <h3 className="px-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Conversations</h3>
          {chats.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white/10" />
              </div>
              <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No messages yet</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                  selectedChatId === chat._id 
                    ? 'bg-[#84CC16]/10 border border-[#84CC16]/20' 
                    : 'hover:bg-white/[0.03] border border-transparent hover:border-white/5'
                }`}
              >
                <div className="relative shrink-0">
                  {renderAvatar(chat)}
                  {chat.isGroupChat && (
                    <div className="absolute -bottom-1 -right-1 bg-[#84CC16] text-black text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">Grp</div>
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`font-bold truncate text-sm transition-colors ${selectedChatId === chat._id ? 'text-[#84CC16]' : 'text-white group-hover:text-white'}`}>
                      {getChatName(chat)}
                    </p>
                    {chat.latestMessage && (
                      <span className="text-[10px] font-medium text-white/20 shrink-0 ml-2">
                        {new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs truncate transition-colors flex-1 ${selectedChatId === chat._id ? 'text-[#84CC16]/60' : 'text-white/40 group-hover:text-white/60'}`}>
                      {chat.latestMessage ? chat.latestMessage.content : "No messages yet"}
                    </p>
                    {chat.latestMessage?.sender?.user?._id === user?._id && (
                      <Check size={12} className="text-[#84CC16] opacity-40 shrink-0" />
                    )}
                  </div>
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
