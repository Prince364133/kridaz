import React, { useState, useEffect } from 'react';
import ChatSidebar from '../components/messages/ChatSidebar';
import ChatWindow from '../components/messages/ChatWindow';
import CreateGroupModal from '../components/messages/CreateGroupModal';
import CreateCommunityModal from '../components/messages/CreateCommunityModal';
import { useSearchParams } from 'react-router-dom';
import { useGetChatsQuery, useAccessChatMutation } from '../../redux/api/chatApi';

const Messages = () => {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  
  const { data: chatData } = useGetChatsQuery();
  const [accessChat] = useAccessChatMutation();

  useEffect(() => {
    if (userIdParam) {
      handleAccessChat(userIdParam);
    }
  }, [userIdParam]);

  // Keep selectedChat updated if chatData changes (e.g., group rename, member add/remove)
  useEffect(() => {
    if (selectedChat && chatData) {
      const updatedChat = chatData.chats?.find((c) => c._id === selectedChat._id);
      // We do a simple JSON stringify comparison to avoid infinite loops
      // if the data structurally changed.
      if (updatedChat && JSON.stringify(updatedChat) !== JSON.stringify(selectedChat)) {
        setSelectedChat(updatedChat);
      }
    }
  }, [chatData, selectedChat]);

  const handleAccessChat = async (userId) => {
    try {
      const data = await accessChat(userId).unwrap();
      setSelectedChat(data);
    } catch (err) {
      console.error("Failed to access chat:", err);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex bg-[#0a0a0a] overflow-hidden">
      {/* Sidebar - hidden on mobile when a chat is selected */}
      <div className={`${selectedChat ? 'hidden md:block' : 'block'} w-full md:w-80 h-full shrink-0`}>
        <ChatSidebar 
          onSelectChat={setSelectedChat} 
          selectedChatId={selectedChat?._id}
          onCreateGroup={() => setIsModalOpen(true)}
          onCreateCommunity={() => setIsCommunityModalOpen(true)}
        />
      </div>
      
      {/* Chat Window - hidden on mobile when no chat is selected */}
      <div className={`${selectedChat ? 'block' : 'hidden md:block'} flex-1 h-full`}>
        <ChatWindow chat={selectedChat} onBack={() => setSelectedChat(null)} onSelectChat={setSelectedChat} />
      </div>

      {isModalOpen && (
        <CreateGroupModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(newChat) => setSelectedChat(newChat)}
        />
      )}

      {isCommunityModalOpen && (
        <CreateCommunityModal 
          isOpen={isCommunityModalOpen}
          onClose={() => setIsCommunityModalOpen(false)}
          onSuccess={(newChat) => setSelectedChat(newChat)}
        />
      )}
    </div>
  );
};

export default Messages;
