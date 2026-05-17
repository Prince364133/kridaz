import React, { useState, useEffect, useRef } from 'react';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';
import { useGetChatsQuery, useRespondToInvitationMutation, useTogglePinChatMutation, useDeleteChatMutation, useRemoveFromGroupMutation } from '../../../redux/api/chatApi';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';
import { useSelector } from 'react-redux';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';
import { useSocket } from '../../../context/SocketContext';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';
import { 
import { SOCKET } from '@kridaz/shared-constants/socketEvents';
  MessageSquare, 
  Plus, 
  Users, 
  User, 
  AlertCircle,
  Loader2,
  Check,
  CheckCheck,
  X,
  Globe,
  MoreVertical,
  Pin,
  PinOff,
  Trash2
} from 'lucide-react';
import ConfirmModal from '../modals/ConfirmModal';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';

const ChatSidebar = ({ onSelectChat, selectedChatId, onCreateGroup, onCreateCommunity, onEditProfile, onChatDeleted }) => {
  const { user } = useSelector((state) => state.auth);
  const { data, isLoading, error, refetch } = useGetChatsQuery();
  const [respondToInvitation] = useRespondToInvitationMutation();
  const { socket, isUserOnline } = useSocket();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingChats, setTypingChats] = useState({});
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const addMenuRef = useRef(null);
  const menuRef = useRef(null);
  
  const [togglePinChat] = useTogglePinChatMutation();
  const [deleteChatMutation] = useDeleteChatMutation();
  const [removeFromGroup] = useRemoveFromGroupMutation();

  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const openConfirmModal = (title, message, onConfirm) => {
    setConfirmModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setIsAddMenuOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for incoming messages to bump unread count
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const chatId = newMessage.chat?._id || newMessage.chat;
      // If this chat is not currently selected, increment unread
      if (chatId !== selectedChatId) {
        setUnreadCounts(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1
        }));
      }
      // Refetch chat list to update latest message preview
      refetch();
    };

    const handleTyping = (room) => {
      setTypingChats(prev => ({ ...prev, [room]: true }));
    };

    const handleStopTyping = (room) => {
      setTypingChats(prev => ({ ...prev, [room]: false }));
    };

    const handleChatUpdated = () => {
      refetch();
    };

    const handleChatDeleted = (deletedChatId) => {
      refetch();
      if (selectedChatId === deletedChatId && onChatDeleted) {
        onChatDeleted();
      }
    };

    const handleProfileUpdated = () => {
      refetch();
    };

    socket.on(SOCKET.MESSAGE_RECEIVED, handleNewMessage);
    socket.on(SOCKET.TYPING, handleTyping);
    socket.on(SOCKET.STOP_TYPING, handleStopTyping);
    socket.on(SOCKET.CHAT_UPDATED, handleChatUpdated);
    socket.on(SOCKET.CHAT_DELETED, handleChatDeleted);
    socket.on(SOCKET.USER_PROFILE_UPDATED, handleProfileUpdated);

    return () => {
      socket.off(SOCKET.MESSAGE_RECEIVED, handleNewMessage);
      socket.off(SOCKET.TYPING, handleTyping);
      socket.off(SOCKET.STOP_TYPING, handleStopTyping);
      socket.off(SOCKET.CHAT_UPDATED, handleChatUpdated);
      socket.off(SOCKET.CHAT_DELETED, handleChatDeleted);
      socket.off(SOCKET.USER_PROFILE_UPDATED, handleProfileUpdated);
    };
  }, [socket, selectedChatId, refetch]);

  // Clear unread count when a chat is selected
  useEffect(() => {
    if (selectedChatId) {
      setUnreadCounts(prev => ({ ...prev, [selectedChatId]: 0 }));
    }
  }, [selectedChatId]);

  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.chatName;
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    const otherUser = chat.users?.find((u) => {
      const uid = u.user?._id || u.user;
      return !myIds.includes(uid);
    });
    return otherUser?.user?.name || "Unknown User";
  };

  const getChatOtherUser = (chat) => {
    if (chat.isGroupChat) return null;
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    // Try matching by IDs
    const byId = chat.users?.find((u) => {
      const uid = u.user?._id || u.user;
      return !myIds.includes(uid);
    })?.user;
    if (byId) return byId;
    // Fallback: match by name
    const byName = chat.users?.find((u) => u.user?.name !== user?.name)?.user;
    return byName || null;
  };

  const getChatImage = (chat) => {
    if (chat.isGroupChat) return null;
    const otherUser = getChatOtherUser(chat);
    return otherUser?.profilePicture || otherUser?.profileImage;
  };

  const renderAvatar = (chat) => {
    const otherUser = getChatOtherUser(chat);
    const online = otherUser?._id ? isUserOnline(otherUser._id) : false;

    const getInitials = (name) => {
      if (!name) return "?";
      return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    };

    if (chat.isGroupChat) {
      const groupImg = chat.groupImage;
      return (
        <div className="relative">
          <div className="w-12 h-12 rounded-full border border-white/10 bg-[#84CC16]/10 flex items-center justify-center overflow-hidden shadow-lg">
            {groupImg ? (
              <img 
                src={groupImg} 
                className="w-full h-full object-cover" 
                alt={chat.chatName}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#84CC16]/20 to-[#84CC16]/5"
              style={{ display: groupImg ? 'none' : 'flex' }}
            >
              <Users size={22} className="text-[#84CC16] opacity-80" />
            </div>
          </div>
        </div>
      );
    }

    const imageUrl = otherUser?.profilePicture || otherUser?.profileImage;

    return (
      <div className="relative">
        <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shadow-lg group-hover/chat:border-[#84CC16]/30 transition-all">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={otherUser?.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5"
            style={{ display: imageUrl ? 'none' : 'flex' }}
          >
            <span className="text-[#84CC16] font-black text-sm tracking-tighter">
              {getInitials(otherUser?.name)}
            </span>
          </div>
        </div>
        {/* Online dot */}
        {online && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#84CC16] rounded-full border-[3px] border-[#0a0a0a] shadow-sm animate-pulse" />
        )}
      </div>
    );
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const oneDay = 86400000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 2 * oneDay) return "Yesterday";
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
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
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight italic uppercase">Messages</h2>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-0.5">Inbox & Groups</p>
        </div>
        <div className="relative" ref={addMenuRef}>
          <button 
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className={`w-10 h-10 ${isAddMenuOpen ? 'bg-[#84CC16] text-black' : 'bg-[#84CC16]/10 text-[#84CC16]'} hover:bg-[#84CC16] hover:text-black rounded-xl transition-all flex items-center justify-center group`}
            title="Add New"
          >
            <Plus size={20} className={`${isAddMenuOpen ? 'rotate-45' : ''} transition-transform duration-300`} />
          </button>

          {isAddMenuOpen && (
            <div className="absolute right-0 top-12 w-56 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-scale-up overflow-hidden">
              <button 
                onClick={() => {
                  setIsAddMenuOpen(false);
                  onCreateGroup();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-[#84CC16] hover:text-black flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-black/10">
                  <Users size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Create Group</span>
                  <span className="text-[10px] opacity-60">Chat with multiple people</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  setIsAddMenuOpen(false);
                  // Trigger community creation
                  if (typeof onCreateCommunity === 'function') onCreateCommunity();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-[#84CC16] hover:text-black flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-black/10">
                  <MessageSquare size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Create Community</span>
                  <span className="text-[10px] opacity-60">Organize related groups</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar - Clickable to edit profile */}
        <div 
          className="relative group cursor-pointer shrink-0"
          onClick={onEditProfile}
        >
          <div className="w-10 h-10 rounded-full border border-white/10 bg-[#84CC16]/10 flex items-center justify-center overflow-hidden hover:border-[#84CC16]/50 transition-all shadow-lg active:scale-95 group-hover:shadow-[#84CC16]/10">
            {(user?.profilePicture || user?.profileImage) ? (
              <img 
                src={user.profilePicture || user.profileImage} 
                alt="My Profile" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#84CC16]/20 to-[#84CC16]/5"
              style={{ display: (user?.profilePicture || user?.profileImage) ? 'none' : 'flex' }}
            >
              <span className="text-[#84CC16] font-black text-xs tracking-tighter">
                {user?.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "ME"}
              </span>
            </div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#1a1a1a] text-[#84CC16] text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border border-[#84CC16]/20 shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-1 whitespace-nowrap pointer-events-none z-[100] backdrop-blur-md">
            My Profile
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div className="p-3 space-y-2">
            <h3 className="px-3 py-2 text-[10px] font-black text-[#84CC16] uppercase tracking-[0.2em]">Pending Invitations</h3>
            {invitations.map((chat) => (
              <div key={chat._id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
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
                    className="flex-1 h-9 bg-[#84CC16] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleRespond(chat._id, 'rejected')}
                    className="flex-1 h-9 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Chats Section */}
        <div className="px-2 py-1">
          {chats.filter(chat => !chat.parentCommunity)
            .sort((a, b) => {
              const myId = user?._id || user?.id || user?.userId;
              const aPinned = a.pinnedBy?.includes(myId) ? 1 : 0;
              const bPinned = b.pinnedBy?.includes(myId) ? 1 : 0;
              if (aPinned !== bPinned) return bPinned - aPinned;
              return 0; 
            })
            .map((chat) => {
            const myId = user?._id || user?.id || user?.userId;
            const unreadCount = unreadCounts[chat._id] || 0;
            const isTypingInChat = typingChats[chat._id];
            const isSelected = selectedChatId === chat._id;
            const isPinned = chat.pinnedBy?.includes(myId);
            const latestSenderId = chat.latestMessage?.sender?.user?._id || chat.latestMessage?.sender?.user;
            const latestSenderName = chat.latestMessage?.sender?.user?.name || chat.latestMessage?.sender?.name;
            const isMySentMessage = [myId].includes(latestSenderId) || (latestSenderName && latestSenderName === user?.name);

            return (
              <div key={chat._id} className="relative group/chat">
                <button
                  onClick={() => onSelectChat(chat)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#84CC16]/10 border border-[#84CC16]/20' 
                      : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    {renderAvatar(chat)}
                    {chat.isCommunity ? (
                      <div className="absolute -bottom-1 -right-1 bg-[#84CC16] text-black text-[7px] px-1 py-0.5 rounded font-black uppercase">Com</div>
                    ) : chat.isGroupChat ? (
                      <div className="absolute -bottom-1 -right-1 bg-[#84CC16] text-black text-[7px] px-1 py-0.5 rounded font-black uppercase">Grp</div>
                    ) : null}
                  </div>
                  <div className="flex-1 text-left overflow-hidden min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className={`font-bold truncate text-sm transition-colors ${
                        isSelected ? 'text-[#84CC16]' : unreadCount > 0 ? 'text-white' : 'text-white/80 group-hover/chat:text-white'
                      }`}>
                        {isPinned && <Pin size={10} className="inline mr-1 text-[#84CC16]" />}
                        {getChatName(chat)}
                      </p>
                    <span className={`text-[10px] font-medium shrink-0 ml-2 ${
                      unreadCount > 0 ? 'text-[#84CC16]' : 'text-white/20'
                    }`}>
                      {chat.latestMessage ? formatTime(chat.latestMessage.createdAt) : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      {isMySentMessage && !isTypingInChat && (
                        <CheckCheck size={14} className="text-[#84CC16]/40 shrink-0" />
                      )}
                      <p className={`text-xs truncate ${
                        isTypingInChat 
                          ? 'text-[#84CC16] font-medium italic' 
                          : isSelected 
                            ? 'text-[#84CC16]/60' 
                            : unreadCount > 0 
                              ? 'text-white/70 font-medium' 
                              : 'text-white/40 group-hover:text-white/60'
                      }`}>
                        {isTypingInChat 
                          ? 'typing...' 
                          : chat.latestMessage 
                            ? chat.latestMessage.content 
                            : chat.isCommunity ? "Community Created" : "No messages yet"
                        }
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <div className="shrink-0 min-w-[20px] h-5 bg-[#84CC16] text-black text-[10px] font-black rounded-full flex items-center justify-center px-1.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
              
              {/* 3-Dot Menu Button */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/chat:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveMenu(activeMenu === chat._id ? null : chat._id); 
                  }} 
                  className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Dropdown Menu */}
              {activeMenu === chat._id && (() => {
                const isGroupAdmin = chat.isGroupChat && chat.groupAdmins?.some(admin => {
                  const adminId = (admin.user?._id || admin.user)?.toString();
                  return adminId === myId;
                });

                const creatorId = (chat.createdBy?.user?._id || chat.createdBy?.user)?.toString();
                const isCreator = creatorId === myId;

                const handleDelete = async () => {
                  setActiveMenu(null);
                  try {
                    await deleteChatMutation(chat._id).unwrap();
                    if (selectedChatId === chat._id) onChatDeleted?.();
                  } catch (err) {
                    console.error("Delete failed:", err);
                    alert(err.data?.message || "Failed to delete");
                  }
                };

                const handleExit = async () => {
                  setActiveMenu(null);
                  try {
                    await removeFromGroup({ chatId: chat._id, userId: myId }).unwrap();
                    if (selectedChatId === chat._id) onChatDeleted?.();
                  } catch (err) {
                    console.error("Exit failed:", err);
                    alert(err.data?.message || "Failed to exit");
                  }
                };

                return (
                  <div ref={menuRef} className="absolute right-8 top-1/2 -translate-y-1/2 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-scale-up">
                    {/* Pin / Unpin */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePinChat({ chatId: chat._id }); setActiveMenu(null); }}
                      className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                    >
                      {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                      {isPinned ? "Unpin chat" : "Pin chat"}
                    </button>

                    {/* --- 1-on-1 Chat: just Delete --- */}
                    {!chat.isGroupChat && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setActiveMenu(null);
                          openConfirmModal(
                            "Delete Chat",
                            "Are you sure you want to delete this entire conversation?",
                            handleDelete
                          );
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                      >
                        <Trash2 size={14} /> Delete chat
                      </button>
                    )}

                    {/* --- Group (not community): Exit + Delete --- */}
                    {chat.isGroupChat && !chat.isCommunity && (
                      <>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMenu(null);
                            openConfirmModal(
                              "Delete Group",
                              "Are you sure you want to exit and permanently delete this group and all its messages?",
                              handleDelete
                            );
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Exit and delete group
                        </button>
                        {isGroupAdmin && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveMenu(null);
                              openConfirmModal(
                                "Delete Group",
                                "Permanently delete this group and all messages for everyone?",
                                handleDelete
                              );
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-500 font-semibold hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                          >
                            <Trash2 size={14} /> Delete group
                          </button>
                        )}
                      </>
                    )}

                    {/* --- Community: Exit + Delete --- */}
                    {chat.isCommunity && (
                      <>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMenu(null);
                            openConfirmModal(
                              "Exit Community",
                              "Are you sure you want to exit this community? You will be removed from all its sub-groups as well.",
                              handleExit
                            );
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Exit community
                        </button>
                        {isCreator && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveMenu(null);
                              openConfirmModal(
                                "Delete Community",
                                "Permanently delete this community and ALL its groups and messages for everyone?",
                                handleDelete
                              );
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-500 font-semibold hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                          >
                            <Trash2 size={14} /> Delete community
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
            );
          })}
        </div>
      </div>
      
      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
};

export default ChatSidebar;
