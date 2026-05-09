import React, { useState, useEffect, useRef } from 'react';
import { useGetMessagesQuery, useSendMessageMutation } from '../../../redux/api/chatApi';
import { useSocket } from '../../../context/SocketContext';
import { useSelector } from 'react-redux';

const ChatWindow = ({ chat }) => {
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
    const otherUser = chat.users.find((u) => u._id !== user?._id);
    return otherUser ? otherUser.name : "Unknown User";
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black/40 text-white/40">
        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="text-lg">Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black/40 relative">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/60 backdrop-blur-md sticky top-0 z-10">
        <div className="relative w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-[#84CC16]/10 flex items-center justify-center shrink-0">
          {chat.isGroupChat ? (
            <svg className="w-5 h-5 text-[#84CC16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ) : (
            <>
              {chat.users.find(u => u._id !== user?._id)?.profilePicture ? (
                <img 
                  src={chat.users.find(u => u._id !== user?._id).profilePicture} 
                  alt={getChatName()}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ display: chat.users.find(u => u._id !== user?._id)?.profilePicture ? 'none' : 'flex' }}
              >
                <span className="text-[#84CC16] font-black text-xs">
                  {chat.users.find(u => u._id !== user?._id)?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
            </>
          )}
        </div>
        <div>
          <h3 className="text-white font-bold">{getChatName()}</h3>
          <p className="text-xs text-white/40">
            {chat.isGroupChat ? `${chat.users.length} members` : "Online"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
        ) : (
          messages.map((m, i) => {
            const isMine = (m.sender._id || m.sender) === user?._id;
            const showSender = chat.isGroupChat && !isMine && (i === 0 || messages[i-1].sender._id !== m.sender._id);

            return (
              <div key={m._id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                {showSender && <span className="text-[10px] text-white/40 ml-2 mb-1">{m.sender.name}</span>}
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-lg ${
                  isMine ? 'bg-primary text-black rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'
                }`}>
                  <p className="text-sm">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-black/50' : 'text-white/40'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {showTypingIndicator && (
          <div className="flex items-center gap-2 text-white/40 text-xs italic">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            Typing...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-black/60 border-t border-white/10">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-primary/50 transition-all">
          <input
            type="text"
            value={message}
            onChange={typingHandler}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none text-white px-4 py-2 focus:ring-0 text-sm"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-primary text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
