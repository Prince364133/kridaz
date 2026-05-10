import React, { useState, useEffect, useRef } from 'react';
import { useGetMessagesQuery, useSendMessageMutation } from '../../../redux/api/chatApi';
import { useSocket } from '../../../context/SocketContext';
import { useSelector } from 'react-redux';
import { 
  Send, 
  Users, 
  User, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

const ChatWindow = ({ chat, onBack }) => {
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const scrollRef = useRef();

  const { data, isLoading } = useGetMessagesQuery(chat?._id, {
    skip: !chat?._id
  });
  const [sendMessageMutation] = useSendMessageMutation();

  useEffect(() => {
    if (data) {
      setMessages(data);
    }
  }, [data]);

  useEffect(() => {
    if (socket && chat) {
      socket.emit('join chat', chat._id);

      socket.on('message received', (newMessage) => {
        if (!chat || chat._id !== newMessage.chat._id) {
          // Optional: Handle notification for other chats
        } else {
          setMessages((prev) => [...prev, newMessage]);
        }
      });

      socket.on('typing', (room) => {
        if (room === chat._id) setShowTypingIndicator(true);
      });

      socket.on('stop typing', (room) => {
        if (room === chat._id) setShowTypingIndicator(false);
      });

      return () => {
        socket.off('message received');
        socket.off('typing');
        socket.off('stop typing');
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

    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;
    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && isTyping) {
        socket.emit('stop typing', chat._id);
        setIsTyping(false);
      }
    }, timerLength);
  };

  const getChatName = () => {
    if (chat.isGroupChat) return chat.chatName;
    const otherUser = chat.users?.find((u) => u.user?._id !== user?._id)?.user;
    return otherUser?.name || "Unknown User";
  };

  const renderAvatar = () => {
    if (chat.isGroupChat) {
      return (
        <div className="w-10 h-10 rounded-full border border-white/10 bg-[#84CC16]/10 flex items-center justify-center">
          <Users size={20} className="text-[#84CC16]" />
        </div>
      );
    }

    const otherUser = chat.users?.find((u) => u.user?._id !== user?._id)?.user;
    const imageUrl = otherUser?.profilePicture || otherUser?.profileImage;

    return (
      <div className="w-10 h-10 rounded-full border border-white/10 bg-[#84CC16]/10 flex items-center justify-center overflow-hidden">
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
          <span className="text-[#84CC16] font-black text-xs">
            {otherUser?.name ? otherUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : <User size={18} />}
          </span>
        </div>
      </div>
    );
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black/40 text-center p-8">
        <div className="w-24 h-24 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6 animate-pulse">
          <MessageSquare size={40} className="text-white/10" />
        </div>
        <h3 className="text-xl font-black text-white italic uppercase tracking-wider mb-2">TurfSpot Messenger</h3>
        <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em] max-w-xs">
          Select a conversation from the sidebar to start chatting with players or groups.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black/40 relative overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-black/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={onBack}
            className="md:hidden w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all mr-1"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="relative shrink-0">
            {renderAvatar()}
            {!chat.isGroupChat && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#84CC16] border-2 border-black rounded-full" />
            )}
          </div>
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-wide truncate max-w-[120px] sm:max-w-none">{getChatName()}</h3>
            <p className="text-[10px] text-[#84CC16] font-bold uppercase tracking-widest opacity-60">
              {chat.isGroupChat ? `${chat.users?.length || 0} Members Online` : "Active Now"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
            <Phone size={18} />
          </button>
          <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
            <Video size={18} />
          </button>
          <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,_rgba(132,204,22,0.02)_0%,_transparent_70%)]">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#84CC16] animate-spin opacity-20" />
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Encrypting Chat</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => {
              const senderId = m.sender?._id || m.sender;
              const isMine = senderId === user?._id;
              const showSender = chat.isGroupChat && !isMine && (i === 0 || (messages[i-1].sender?._id || messages[i-1].sender) !== senderId);

              return (
                <div key={m._id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  {showSender && (
                    <span className="text-[9px] font-black text-[#84CC16] uppercase tracking-widest ml-3 mb-1 opacity-60">
                      {m.sender?.name || "Player"}
                    </span>
                  )}
                  <div className={`group relative max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl transition-all ${
                    isMine 
                      ? 'bg-[#84CC16] text-black rounded-tr-sm shadow-[0_4px_20px_rgba(132,204,22,0.1)]' 
                      : 'bg-white/5 text-white border border-white/5 rounded-tl-sm hover:bg-white/[0.08]'
                  }`}>
                    <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                    <div className={`flex items-center gap-1.5 mt-2 justify-end ${isMine ? 'text-black/40' : 'text-white/20'}`}>
                      <span className="text-[9px] font-bold uppercase tracking-tighter">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && <CheckCheck size={10} className="text-black/60" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showTypingIndicator && (
          <div className="flex items-center gap-3 animate-in fade-in duration-300">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-[#84CC16] rounded-full animate-bounce [animation-duration:0.8s]"></span>
              <span className="w-1.5 h-1.5 bg-[#84CC16] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-[#84CC16] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
            </div>
            <span className="text-[10px] font-black text-[#84CC16] uppercase tracking-widest opacity-40 italic">Player is typing</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-black/60 border-t border-white/10 backdrop-blur-xl">
        <form onSubmit={handleSendMessage} className="relative group">
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-2 pl-4 pr-2 focus-within:border-[#84CC16]/50 focus-within:bg-white/[0.05] transition-all">
            <button type="button" className="p-2 text-white/20 hover:text-white transition-colors">
              <ImageIcon size={20} />
            </button>
            <input
              type="text"
              value={message}
              onChange={typingHandler}
              placeholder="Message..."
              className="flex-1 bg-transparent border-none text-white px-2 py-2 focus:ring-0 text-sm placeholder:text-white/10 font-medium"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                message.trim() 
                  ? 'bg-[#84CC16] text-black shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:scale-105 active:scale-95' 
                  : 'bg-white/5 text-white/10'
              }`}
            >
              <Send size={18} className={message.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
