import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGetMessagesQuery, useSendMessageMutation, useMarkMessagesReadMutation, useRemoveFromGroupMutation, useDeleteMessagesMutation, useCreateGroupChatMutation, useDeleteChatMutation, useGetChatsQuery, useClearChatMutation } from '../../../redux/api/chatApi';
import { useSocket } from '../../../context/SocketContext';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import GroupInfoModal from './GroupInfoModal';
import { Plus, Users, MessageSquare, ChevronLeft, Search, MoreVertical, Send, CheckCheck, Trash2, Globe } from 'lucide-react';
import AddGroupToCommunityModal from './AddGroupToCommunityModal';
import ConfirmModal from '../modals/ConfirmModal';
import ForwardModal from '../modals/ForwardModal';

const ChatWindow = ({ chat, onBack, onSelectChat }) => {
  const { user } = useSelector((state) => state.auth);
  const { socket, isUserOnline, getLastSeen } = useSocket();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messageDropdownId, setMessageDropdownId] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [isAddGroupToCommunityOpen, setIsAddGroupToCommunityOpen] = useState(false);
  
  const [forwardModalConfig, setForwardModalConfig] = useState({
    isOpen: false,
    messageId: null,
  });

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

  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const [removeFromGroup] = useRemoveFromGroupMutation();
  const [deleteMessages] = useDeleteMessagesMutation();
  const [clearChat] = useClearChatMutation();
  const [deleteChatMutation] = useDeleteChatMutation();
  const { data: chatData } = useGetChatsQuery();

  const { data, isLoading } = useGetMessagesQuery(chat?._id, {
    skip: !chat?._id
  });
  const [sendMessageMutation] = useSendMessageMutation();
  const [markMessagesReadMutation] = useMarkMessagesReadMutation();

  useEffect(() => {
    if (data) {
      setMessages(data);
    }
  }, [data]);

  useEffect(() => {
    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chat]);

  useEffect(() => {
    const handleFocusSearch = () => {
      setIsSearchOpen(true);
    };
    window.addEventListener('focus-chat-search', handleFocusSearch);
    return () => window.removeEventListener('focus-chat-search', handleFocusSearch);
  }, []);

  // Notify server we've read messages when chat opens or new messages arrive
  useEffect(() => {
    if (socket && chat && messages.length > 0) {
      const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
      // Check if there are any messages not read by me
      const hasUnread = messages.some(m => {
        if (!m.readBy) return true;
        return !m.readBy.some(r => myIds.includes(r.user?._id || r.user));
      });

      if (hasUnread) {
        const myIdToSend = user?._id || user?.id;
        socket.emit('messages read', { chatId: chat._id, userId: myIdToSend });
        markMessagesReadMutation(chat._id).catch(console.error);
      }
    }
  }, [socket, chat?._id, messages, user, markMessagesReadMutation]);

  useEffect(() => {
    if (socket && chat) {
      socket.emit('join chat', chat._id);

      const handleNewMessage = (newMessage) => {
        if (chat._id === (newMessage.chat?._id || newMessage.chat)) {
          setMessages((prev) => [...prev, newMessage]);
          // Mark as read immediately since chat is open
          socket.emit('messages read', { chatId: chat._id, userId: user?._id || user?.id });
        }
      };

      const handleTyping = (room) => {
        if (room === chat._id) setShowTypingIndicator(true);
      };

      const handleStopTyping = (room) => {
        if (room === chat._id) setShowTypingIndicator(false);
      };

      const handleMessagesRead = ({ chatId, userId }) => {
        if (chatId === chat._id) {
          setMessages((prev) => prev.map(m => {
            // Add to readBy array if not already present
            const readByArray = m.readBy || [];
            const alreadyRead = readByArray.some(r => (r.user?._id || r.user) === userId);
            if (!alreadyRead) {
              return { ...m, readBy: [...readByArray, { user: userId }] };
            }
            return m;
          }));
        }
      };

      socket.on('message recieved', handleNewMessage);
      socket.on('typing', handleTyping);
      socket.on('stop typing', handleStopTyping);
      socket.on('message deleted', ({ messageIds }) => {
        setMessages(prev => prev.filter(m => !messageIds.includes(m._id)));
      });
      socket.on('messages read', handleMessagesRead);

      return () => {
        socket.off('message recieved', handleNewMessage);
        socket.off('typing', handleTyping);
        socket.off('stop typing', handleStopTyping);
        socket.off('message deleted');
        socket.off('messages read', handleMessagesRead);
      };
    }
  }, [socket, chat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTypingIndicator]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit('stop typing', chat._id);
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const data = await sendMessageMutation({
        chatId: chat._id,
        content: message
      }).unwrap();

      socket.emit('new message', data);
      setMessages((prev) => [...prev, data]);
      setMessage('');
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const typingHandler = (e) => {
    setMessage(e.target.value);

    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', chat._id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop typing', chat._id);
      setIsTyping(false);
    }, 3000);
  };

  const getChatOtherUser = () => {
    if (!chat || chat.isGroupChat) return null;
    // Match by _id, handling Owner/User polymorphism
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    return chat.users?.find((u) => {
      const uid = u.user?._id || u.user;
      return !myIds.includes(uid);
    })?.user;
  };

  // Get "my" user entry from the chat to extract my ID in the chat context
  const getMyUserEntry = () => {
    if (!chat) return null;
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    // First try matching by any of my IDs
    const byId = chat.users?.find((u) => {
      const uid = u.user?._id || u.user;
      return myIds.includes(uid);
    });
    if (byId) return byId;
    // Fallback: match by name (for Owner/User cross-model)
    return chat.users?.find((u) => u.user?.name === user?.name);
  };

  const getChatName = () => {
    if (chat.isGroupChat) return chat.chatName;
    const otherUser = getChatOtherUser();
    return otherUser?.name || "Unknown User";
  };

  // Format last seen
  // Format status text (online/last seen)
  const getStatusText = () => {
    if (chat.isGroupChat) return `${chat.users.length} members`;

    const otherUser = getChatOtherUser();
    const otherId = otherUser?._id;
    if (!otherId) return "";

    if (isUserOnline(otherId)) return "online";

    // Try socket state first, then fallback to DB value
    const lastSeen = getLastSeen(otherId) || otherUser?.lastSeen;
    if (lastSeen) {
      const date = new Date(lastSeen);
      const now = new Date();
      
      const isToday = date.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isToday) return `last seen today at ${timeStr}`;
      if (isYesterday) return `last seen yesterday at ${timeStr}`;
      
      return `last seen ${date.toLocaleDateString([], { day: 'numeric', month: 'short' })} at ${timeStr}`;
    }

    return "offline";
  };

  // Group messages by date
  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Determine sender ID from message object (handles nested and flat sender shapes)
  const getSenderId = (m) => {
    return m.sender?.user?._id || m.sender?.user || m.sender?._id || m.sender;
  };

  // Check if a message was sent by the current user
  const checkIsMine = (m) => {
    const senderId = getSenderId(m);
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    // Direct ID match against any of my IDs
    if (myIds.includes(senderId)) return true;
    // Cross-model match: check if sender ID matches my chat entry
    const myEntry = getMyUserEntry();
    const myEntryId = myEntry?.user?._id || myEntry?.user;
    if (myEntryId && senderId === myEntryId) return true;
    // Name-based fallback for edge cases
    const senderName = m.sender?.user?.name || m.sender?.name;
    if (senderName && senderName === user?.name) return true;
    return false;
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black/40 text-white/40">
        <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-white/20">Select a conversation</p>
        <p className="text-xs text-white/10 mt-1">to start chatting</p>
      </div>
    );
  }

  const otherUserObj = getChatOtherUser();
  const imageUrl = otherUserObj?.profilePicture || otherUserObj?.profileImage;
  const otherOnline = otherUserObj?._id ? isUserOnline(otherUserObj._id) : false;

  return (
    <div className="flex-1 flex flex-col h-full bg-black/40 relative">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-black/60 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="md:hidden p-2 -ml-2 text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Avatar with online dot - clickable to profile/group info */}
        <div 
          className="relative shrink-0 cursor-pointer" 
          onClick={() => {
            if (chat.isGroupChat) {
              setIsGroupInfoOpen(true);
            } else if (otherUserObj?._id) {
              navigate(`/profile/${otherUserObj._id}`);
            }
          }}
        >
          <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-[#84CC16]/10 flex items-center justify-center">
            {chat.isGroupChat ? (
              chat.groupImage ? (
                <img src={chat.groupImage} className="w-full h-full object-cover" alt="" />
              ) : (
                <svg className="w-5 h-5 text-[#84CC16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )
            ) : (
              <>
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={getChatName()}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#84CC16]/20 to-[#84CC16]/5"
                  style={{ display: imageUrl ? 'none' : 'flex' }}
                >
                  <span className="text-[#84CC16] font-black text-xs tracking-tighter">
                    {otherUserObj?.name ? otherUserObj.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U"}
                  </span>
                </div>
              </>
            )}
          </div>
          {/* Online indicator dot */}
          {!chat.isGroupChat && otherOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#84CC16] rounded-full border-[3px] border-[#0a0a0a] shadow-sm animate-pulse" />
          )}
        </div>

          <div 
            className="flex-1 min-w-0 cursor-pointer" 
            onClick={() => {
              if (chat.isGroupChat) {
                setIsGroupInfoOpen(true);
              } else if (otherUserObj?._id) {
                navigate(`/profile/${otherUserObj._id}`);
              }
            }}
          >
            <h3 className="text-white font-bold text-sm truncate hover:underline">{getChatName()}</h3>
            <p className={`text-[11px] transition-colors ${
              showTypingIndicator 
                ? 'text-[#84CC16] font-medium' 
                : otherOnline 
                  ? 'text-green-400' 
                  : 'text-white/40'
            }`}>
              {showTypingIndicator ? 'typing...' : getStatusText()}
            </p>
          </div>

          {/* Header Actions (Search & Three Dots Dropdown) */}
          <div className="flex items-center gap-2 relative" ref={dropdownRef}>
            {chat.isCommunity && !isSelectionMode && (
              <button 
                onClick={() => setIsAddGroupToCommunityOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#84CC16]/10 text-[#84CC16] hover:bg-[#84CC16] hover:text-black rounded-lg transition-all text-[11px] font-black uppercase tracking-wider shadow-sm"
              >
                <Plus size={14} />
                <span>Add Group</span>
              </button>
            )}
            {!isSelectionMode && (
              <button 
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setMessageSearchQuery("");
                }}
                className={`p-2 transition-colors rounded-full ${isSearchOpen ? 'bg-white/[0.1] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.05]'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`p-2 transition-colors rounded-full ${isDropdownOpen ? 'bg-white/[0.1] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.05]'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (() => {
              const myId = user?._id || user?.id || user?.userId;
              const isAdmin = myId && chat.groupAdmins?.some(admin => {
                const adminUserId = (admin.user?._id || admin.user)?.toString();
                return String(myId) === String(adminUserId);
              });

              return (
                <div className="absolute top-12 right-0 w-48 bg-[#232323] border border-white/10 rounded-lg shadow-xl py-2 z-50 animate-fade-in">
                  {/* Info */}
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (chat.isGroupChat) setIsGroupInfoOpen(true);
                      else if (otherUserObj?._id) navigate(`/profile/${otherUserObj._id}`);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    {chat.isGroupChat ? 'Group info' : 'Contact info'}
                  </button>

                  {/* Search */}
                  <button 
                    onClick={() => { setIsDropdownOpen(false); setIsSearchOpen(true); }}
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    Search
                  </button>

                  {/* Select messages */}
                  <button 
                    onClick={() => { setIsDropdownOpen(false); setIsSelectionMode(true); setSelectedMessages([]); }}
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    Select messages
                  </button>

                  {/* Add group to community (community only) */}
                  {chat.isCommunity && (
                    <button 
                      onClick={() => { setIsDropdownOpen(false); setIsAddGroupToCommunityOpen(true); }}
                      className="w-full text-left px-4 py-2 text-sm text-[#84CC16] hover:bg-white/[0.05] transition-colors"
                    >
                      Add group to community
                    </button>
                  )}

                  {/* Close chat */}
                  <button 
                    onClick={() => { setIsDropdownOpen(false); onBack(); }}
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    Close chat
                  </button>

                  {/* Clear chat */}
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      openConfirmModal(
                        "Clear Chat",
                        "Clear all messages? This only removes them for you.",
                        async () => {
                          try {
                            await clearChat(chat._id).unwrap();
                            setMessages([]);
                          } catch (err) {
                            console.error("Failed to clear chat", err);
                          }
                        }
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    Clear chat
                  </button>

                  {/* Divider before destructive actions */}
                  <div className="border-t border-white/5 my-1" />

                  {/* --- 1-on-1 Chat: Delete --- */}
                  {!chat.isGroupChat && (
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        openConfirmModal(
                          "Delete Chat",
                          "Delete this entire conversation?",
                          async () => {
                            try {
                              await deleteChatMutation(chat._id).unwrap();
                              onBack();
                            } catch (err) {
                              console.error("Failed to delete chat:", err);
                              alert(err.data?.message || "Failed to delete chat");
                            }
                          }
                        );
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Delete chat
                    </button>
                  )}

                  {/* --- Group (not community): Exit + Delete --- */}
                  {chat.isGroupChat && !chat.isCommunity && (
                    <>
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          openConfirmModal(
                            "Delete Group",
                            "Are you sure you want to exit and permanently delete this group and all its messages?",
                            async () => {
                              try {
                                await deleteChatMutation(chat._id).unwrap();
                                onBack();
                              } catch (err) {
                                console.error("Failed to delete group:", err);
                                alert(err.data?.message || "Failed to delete group");
                              }
                            }
                          );
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Exit and delete group
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            setIsDropdownOpen(false);
                            openConfirmModal(
                              "Delete Group",
                              "Permanently delete this group and all messages for everyone?",
                              async () => {
                                try {
                                  await deleteChatMutation(chat._id).unwrap();
                                  onBack();
                                } catch (err) {
                                  console.error("Failed to delete group:", err);
                                  alert(err.data?.message || "Failed to delete group");
                                }
                              }
                            );
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 font-bold hover:bg-red-500/10 transition-colors"
                        >
                          Delete group
                        </button>
                      )}
                    </>
                  )}

                  {/* --- Community: Exit + Delete --- */}
                  {chat.isCommunity && (
                    <>
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          openConfirmModal(
                            "Delete Community",
                            "Are you sure you want to permanently delete this community? All child groups and messages will be wiped.",
                            async () => {
                              try {
                                await deleteChatMutation(chat._id).unwrap();
                                onBack();
                              } catch (err) {
                                console.error("Failed to delete community:", err);
                                alert(err.data?.message || "Failed to delete community");
                              }
                            }
                          );
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Exit and delete community
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            setIsDropdownOpen(false);
                            openConfirmModal(
                              "Delete Community",
                              "Permanently delete this community and ALL its groups and messages?",
                              async () => {
                                try {
                                  await deleteChatMutation(chat._id).unwrap();
                                  onBack();
                                } catch (err) {
                                  console.error("Failed to delete community:", err);
                                  alert(err.data?.message || "Failed to delete community");
                                }
                              }
                            );
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-500/10 transition-colors"
                        >
                          Delete community
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
      </div>

      {/* Contextual Action Bar for Selection Mode */}
      {isSelectionMode && (
        <div className="absolute top-0 left-0 right-0 h-[68px] bg-[#84CC16] z-20 flex items-center justify-between px-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedMessages([]);
              }} 
              className="p-2 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <span className="text-white font-medium text-lg">{selectedMessages.length} selected</span>
          </div>
          {selectedMessages.length > 0 && (
            <button 
              onClick={() => setShowDeleteOptions(true)}
              className="p-2 text-black/60 hover:text-black hover:bg-black/10 rounded-full transition-colors"
              title="Delete selected messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      )}

      {/* Inline Search Bar */}
      {isSearchOpen && (
        <div className="bg-[#111111] px-4 py-2 border-b border-white/10 flex items-center gap-3 shadow-md z-10 animate-fade-in relative">
          <div className="flex-1 bg-white/[0.05] rounded-lg flex items-center px-3 border border-white/10 focus-within:border-[#84CC16]/40 transition-colors">
            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              autoFocus
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-transparent border-none text-white text-sm py-2 px-3 focus:outline-none placeholder:text-white/30"
            />
            {messageSearchQuery && (
              <button onClick={() => setMessageSearchQuery("")} className="text-white/40 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <button 
            onClick={() => {
              setIsSearchOpen(false);
              setMessageSearchQuery("");
            }} 
            className="text-white/60 hover:text-white text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 relative overflow-hidden bg-black/40">
        {/* Scrollable Messages Content */}
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar z-0 flex flex-col px-4 py-4 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#84CC16]"></div></div>
          ) : (
            (() => {
              const filteredMessages = messageSearchQuery.trim()
                ? messages.filter(m => m.content.toLowerCase().includes(messageSearchQuery.toLowerCase()))
                : messages;

              if (chat.isCommunity) {
                const childGroups = chatData?.chats?.filter(c => 
                  (c.parentCommunity === chat._id || c.parentCommunity?._id === chat._id) && !c.isCommunity
                ) || [];

                const announcementGroup = childGroups.find(g => g.isAnnouncementGroup || g.chatName === "Announcements");
                const regularGroups = childGroups.filter(g => !g.isAnnouncementGroup && g.chatName !== "Announcements");

                const myId = user?._id || user?.id || user?.userId;
                const groupAdmins = chat.groupAdmins || [];
                const isAdmin = myId && groupAdmins.some(admin => {
                  const adminUserId = admin.user?._id || admin.user;
                  return String(myId) === String(adminUserId);
                });
                const canMessage = !chat.adminOnlyMessages || isAdmin;

                return (
                  <div className="flex-1 flex flex-col p-6 animate-fade-in">
                    {/* Dashboard Header */}
                    <div className="flex flex-col items-center text-center mb-10">
                      <div className="w-24 h-24 rounded-3xl bg-[#84CC16]/10 flex items-center justify-center mb-4 border border-[#84CC16]/20 shadow-[0_0_40px_-10px_rgba(132,204,22,0.2)]">
                        <Globe size={48} className="text-[#84CC16]" />
                      </div>
                      <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">{chat.chatName}</h2>
                      <p className="text-white/40 text-sm mt-2 max-w-md">{chat.description || "Welcome to our community! Add groups below to get started."}</p>
                    </div>

                    {/* Groups Section */}
                    <div className="max-w-2xl mx-auto w-full space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-[#84CC16] uppercase tracking-[0.3em]">Groups in this community</h3>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{childGroups.length} Groups</span>
                      </div>

                      <div className="grid gap-3">
                        {/* Add Group Action */}
                        <button 
                          onClick={() => setIsAddGroupToCommunityOpen(true)}
                          className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-[#84CC16]/10 hover:border-[#84CC16]/30 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-[#84CC16] text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-bold text-sm">Add group</p>
                            <p className="text-white/40 text-xs mt-0.5">Create or add existing groups to this community</p>
                          </div>
                        </button>

                        {/* Announcement Group */}
                        {announcementGroup ? (
                          <button 
                            onClick={() => onSelectChat && onSelectChat(announcementGroup)}
                            className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all"
                          >
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                              <MessageSquare size={20} className="text-[#84CC16]" />
                            </div>
                            <div className="text-left flex-1">
                              <div className="flex justify-between">
                                <p className="text-white font-bold text-sm">Announcements</p>
                                <span className="text-[10px] bg-[#84CC16]/20 text-[#84CC16] px-2 py-0.5 rounded font-black uppercase">System</span>
                              </div>
                              <p className="text-white/40 text-xs mt-0.5">Only admins can post messages here</p>
                            </div>
                          </button>
                        ) : (
                          <div className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl cursor-default opacity-80">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                              <MessageSquare size={20} className="text-[#84CC16]" />
                            </div>
                            <div className="text-left flex-1">
                              <div className="flex justify-between">
                                <p className="text-white font-bold text-sm">Announcements</p>
                                <span className="text-[10px] bg-[#84CC16]/20 text-[#84CC16] px-2 py-0.5 rounded font-black uppercase">System</span>
                              </div>
                              <p className="text-white/40 text-xs mt-0.5">Only admins can post messages here</p>
                            </div>
                          </div>
                        )}

                        {/* Render Sub-groups */}
                        {regularGroups.map((group) => (
                          <button 
                            key={group._id}
                            onClick={() => onSelectChat && onSelectChat(group)}
                            className="w-full flex items-center gap-4 p-4 bg-white/[0.02] border border-transparent hover:border-white/10 hover:bg-white/[0.04] rounded-2xl transition-all"
                          >
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                              <Users size={20} className="text-white/20" />
                            </div>
                            <div className="text-left">
                              <p className="text-white font-bold text-sm">{group.chatName}</p>
                              <p className="text-white/40 text-xs mt-0.5">{group.users?.length || 0} Members</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="pt-10 text-center">
                        <p className="text-white/10 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                          Groups added to the community will appear here.<br/>Community members can join these groups.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              if (messageSearchQuery.trim() && filteredMessages.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full text-white/40 mt-10">
                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <p className="text-sm">No messages found for "{messageSearchQuery}"</p>
                  </div>
                );
              }

              return filteredMessages.map((m, i) => {
            const senderId = getSenderId(m);
            const isMine = checkIsMine(m);
            const prevMsg = messages[i - 1];
            const prevSenderId = prevMsg ? getSenderId(prevMsg) : null;
            const prevIsMine = prevMsg ? checkIsMine(prevMsg) : null;
            const showSender = chat.isGroupChat && !isMine && senderId !== prevSenderId;
            const senderName = m.sender?.user?.name || m.sender?.name || "";

            // Date separator
            const currentDate = getDateLabel(m.createdAt);
            const prevDate = prevMsg ? getDateLabel(prevMsg.createdAt) : null;
            const showDateSeparator = currentDate !== prevDate;

            // Message grouping: reduce spacing between consecutive same-sender messages
            const isSameSender = prevSenderId === senderId;
            const isSameDirection = prevMsg && (isMine === prevIsMine);

            // Check if message is read by the other person
            const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
            const isRead = m.readBy && m.readBy.some(r => !myIds.includes(r.user?._id || r.user));

            return (
              <React.Fragment key={m._id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center py-3">
                    <span className="bg-white/[0.06] text-white/40 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/5">
                      {currentDate}
                    </span>
                  </div>
                )}

                <div 
                  className={`w-full flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${isSameDirection ? 'mt-0.5' : 'mt-3'}`}
                  onClick={() => {
                    if (isSelectionMode) {
                      setSelectedMessages(prev => 
                        prev.includes(m._id) ? prev.filter(id => id !== m._id) : [...prev, m._id]
                      );
                    }
                  }}
                >
                  {/* Receiver Profile Picture */}
                  {!isMine && (
                    <div 
                      className="w-8 h-8 shrink-0 mb-1 cursor-pointer hover:scale-105 active:scale-95 transition-all group/avatar"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (senderId) navigate(`/profile/${senderId}`);
                      }}
                    >
                      {!isSameDirection ? (
                        <div className="relative w-full h-full rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                          {m.sender?.user?.profilePicture || m.sender?.user?.profileImage ? (
                            <img 
                              src={m.sender?.user?.profilePicture || m.sender?.user?.profileImage} 
                              alt="" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5"
                            style={{ display: (m.sender?.user?.profilePicture || m.sender?.user?.profileImage) ? 'none' : 'flex' }}
                          >
                            <span className="text-[#84CC16] font-black text-[10px] tracking-tighter">
                              {senderName ? senderName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?"}
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-[#84CC16]/0 group-hover/avatar:bg-[#84CC16]/10 rounded-full transition-colors" />
                        </div>
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col relative ${isMine ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[65%] ${isSelectionMode ? 'cursor-pointer pointer-events-none' : ''}`}>
                    <div className="flex items-start group">
                      {/* Receiver Tail */}
                      {!isMine && !isSameDirection && (
                        <div className="absolute top-0 -left-1.5 text-[#84CC16]/20">
                          <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
                            <path d="M2.812 1H8v11.193L1.533 3.568C.474 2.156 1.042 1 2.812 1z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Message Bubble */}
                      <div className={`relative px-3 py-1.5 shadow-md border bg-[#84CC16]/10 border-[#84CC16]/30 text-[#84CC16] rounded-[8px] group/bubble ${
                        isMine 
                          ? (!isSameDirection ? 'rounded-tr-none' : '') 
                          : (!isSameDirection ? 'rounded-tl-none' : '')
                      }`}>
                        {/* Hover Dropdown Button (WhatsApp Style) */}
                        {!isSelectionMode && (
                          <div className={`absolute top-1 right-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10`}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setMessageDropdownId(messageDropdownId === m._id ? null : m._id);
                              }}
                              className="p-1 hover:bg-black/20 rounded text-[#84CC16]/40 hover:text-[#84CC16]"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {messageDropdownId === m._id && (
                              <div className="absolute top-full right-0 mt-1 w-32 bg-[#232323] border border-white/10 rounded shadow-xl py-1 z-20 overflow-hidden">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMessageDropdownId(null);
                                    setSelectedMessages([m._id]);
                                    setShowDeleteOptions(true);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[11px] text-white/80 hover:bg-[#84CC16] hover:text-black transition-colors"
                                >
                                  Delete
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMessageDropdownId(null);
                                    // Handle reply or other actions here
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/[0.05] transition-colors border-b border-white/5"
                                >
                                  Reply
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMessageDropdownId(null);
                                    setForwardModalConfig({ isOpen: true, messageId: m._id });
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/[0.05] transition-colors"
                                >
                                  Forward
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {m.isForwarded && (
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#84CC16]/60 mb-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            Forwarded
                          </div>
                        )}
                        {chat.isGroupChat && !isMine && !isSameDirection && (
                          <p 
                            className="text-[11px] font-black uppercase tracking-wider mb-0.5 opacity-60 cursor-pointer hover:text-[#84CC16] hover:opacity-100 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (senderId) navigate(`/profile/${senderId}`);
                            }}
                          >
                            {senderName}
                          </p>
                        )}
                        <p className="text-[14.2px] leading-[19px] break-words whitespace-pre-wrap">{m.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 -mb-1 float-right ml-4 text-[#84CC16]/60">
                          <span className="text-[11px]">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            <svg className={`w-4 h-[11px] ${isRead ? 'text-[#34B7F1]' : 'text-[#84CC16]/40'}`} viewBox="0 0 20 12" fill="none">
                              <path d="M1 6l4 4L13 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 6l4 4L19 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Sender Tail */}
                      {isMine && !isSameDirection && (
                        <div className="absolute top-0 -right-1.5 text-[#84CC16]/20">
                          <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
                            <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selection Checkbox for Sent Messages */}
                  {isSelectionMode && isMine && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                      selectedMessages.includes(m._id) ? 'bg-[#84CC16] border-[#84CC16]' : 'border-white/30'
                    }`}>
                      {selectedMessages.includes(m._id) && <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                  )}
                </div>
               </React.Fragment>
            );
              });
            })()
          )}

          {/* Typing indicator bubble */}
        {showTypingIndicator && (
          <div className="flex items-start mt-3">
            <div className="bg-white/[0.08] rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      {!chat.isCommunity && (
        (() => {
          const myId = user?._id || user?.id || user?.userId;
          const groupAdmins = chat.groupAdmins || [];
          const isAdmin = myId && groupAdmins.some(admin => {
            const adminUserId = admin.user?._id || admin.user;
            return String(myId) === String(adminUserId);
          });
          const canMessage = !chat.adminOnlyMessages || isAdmin;

          return canMessage ? (
            <form onSubmit={handleSendMessage} className="p-3 bg-black/60 border-t border-white/10 z-10 relative">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-1 focus-within:border-[#84CC16]/40 transition-all">
                <button 
                  type="button"
                  className="p-2 text-white/40 hover:text-[#84CC16] transition-colors"
                >
                  <Plus size={20} />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={typingHandler}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none text-white py-2.5 focus:ring-0 focus:outline-none text-sm placeholder:text-white/20"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2 bg-[#84CC16] text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 disabled:bg-white/10 disabled:text-white/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 bg-black/60 border-t border-white/10 text-center relative z-10">
              <p className="text-xs text-[#84CC16]/60 font-bold uppercase tracking-widest italic">
                Only admins can send messages to this group
              </p>
            </div>
          );
        })()
      )}

      {isGroupInfoOpen && (
        <GroupInfoModal 
          key={chat?._id}
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          chat={chat}
        />
      )}

      {isAddGroupToCommunityOpen && (
        <AddGroupToCommunityModal 
          isOpen={isAddGroupToCommunityOpen}
          onClose={() => setIsAddGroupToCommunityOpen(false)}
          communityId={chat._id}
        />
      )}

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

      {/* Forward Modal */}
      <ForwardModal
        isOpen={forwardModalConfig.isOpen}
        onClose={() => setForwardModalConfig({ isOpen: false, messageId: null })}
        messageId={forwardModalConfig.messageId}
      />

      {showDeleteOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteOptions(false)} />
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
            <h3 className="text-white text-lg font-bold mb-4">Delete messages?</h3>
            <p className="text-white/60 text-sm mb-6">
              Delete {selectedMessages.length} selected message{selectedMessages.length > 1 ? 's' : ''}?
            </p>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={async () => {
                  try {
                    await deleteMessages({ messageIds: selectedMessages, chatId: chat._id, deleteType: 'everyone' }).unwrap();
                    // Emit socket event for everyone deletion
                    if (socket) {
                      socket.emit('delete message', { chatId: chat._id, messageIds: selectedMessages });
                    }
                    // Remove deleted messages from local state immediately
                    setMessages(prev => prev.filter(m => !selectedMessages.includes(m._id)));
                    setShowDeleteOptions(false);
                    setIsSelectionMode(false);
                    setSelectedMessages([]);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="w-full py-3 bg-[#84CC16] text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Delete for everyone
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    await deleteMessages({ messageIds: selectedMessages, chatId: chat._id, deleteType: 'me' }).unwrap();
                    // Remove from local state immediately
                    setMessages(prev => prev.filter(m => !selectedMessages.includes(m._id)));
                    setShowDeleteOptions(false);
                    setIsSelectionMode(false);
                    setSelectedMessages([]);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="w-full py-3 bg-white/[0.05] text-white font-bold rounded-xl hover:bg-white/[0.1] transition-all"
              >
                Delete for me
              </button>

              <button 
                onClick={() => setShowDeleteOptions(false)}
                className="w-full py-3 text-white/40 text-sm hover:text-white transition-all mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
