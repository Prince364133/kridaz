import React, { useState, useEffect } from 'react';
import ChatSidebar from '../components/messages/ChatSidebar';
import ChatWindow from '../components/messages/ChatWindow';
import CreateGroupModal from '../components/messages/CreateGroupModal';
import { useSearchParams } from 'react-router-dom';
import { useGetChatsQuery, useAccessChatMutation } from '../../redux/api/chatApi';

const Messages = () => {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: chatData } = useGetChatsQuery();
  const [accessChat] = useAccessChatMutation();

  useEffect(() => {
    if (userIdParam) {
      handleAccessChat(userIdParam);
    }
  }, [userIdParam]);

  const handleAccessChat = async (userId) => {
    try {
      const data = await accessChat(userId).unwrap();
      setSelectedChat(data);
    } catch (err) {
      console.error("Failed to access chat:", err);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row bg-[#0a0a0a] overflow-hidden">
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 h-full`}>
        <ChatSidebar 
          onSelectChat={setSelectedChat} 
          selectedChatId={selectedChat?._id}
          onCreateGroup={() => setIsModalOpen(true)}
        />
      </div>
      
      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 h-full`}>
        <ChatWindow 
          chat={selectedChat} 
          onBack={() => setSelectedChat(null)}
        />
      </div>

      {isModalOpen && (
        <CreateGroupModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(newChat) => setSelectedChat(newChat)}
        />
      )}
    </div>
  );
};

export default Messages;
