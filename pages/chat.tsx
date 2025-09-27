import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ChatBox from '../components/ChatBox';
import MessageList from '../components/MessageList';
import ChatList from '../components/ChatList';
import { useAuth } from '../context/AuthContext';
import { useChat, Chat } from '../context/ChatContext';
import socketService from '../utils/socket';

const ChatPage: React.FC = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated, token } = useAuth();
  const { loadChats } = useChat();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Setup socket connection and load chats
  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect to socket
      socketService.connect(token);
      
      // Load user's chats
      loadChats();
      
      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token, loadChats]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const getChatName = (chat: Chat | null) => {
    if (!chat) return 'Select a chat';
    if (chat.name) return chat.name;
    if (chat.type === 'group') return 'Group Chat';
    
    // For private chats, get other participant's name
    const otherParticipant = chat.participants.find(p => p._id !== user?.id);
    return otherParticipant?.username || 'Unknown User';
  };

  const getChatAvatar = (chat: Chat | null) => {
    if (!chat) return null;
    if (chat.avatar) return chat.avatar;
    if (chat.type === 'group') return '👥';
    
    // For private chats, get other participant's avatar
    const otherParticipant = chat.participants.find(p => p._id !== user?.id);
    return otherParticipant?.avatar || otherParticipant?.username?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="h-screen flex bg-secondary-100">
      {/* Sidebar - Chat List */}
      <div className="w-80 flex-shrink-0">
        <ChatList onChatSelect={handleChatSelect} selectedChatId={selectedChat?._id || null} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <header className="bg-white border-b border-secondary-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Chat Avatar */}
                  <div className="relative">
                    {typeof getChatAvatar(selectedChat) === 'string' && getChatAvatar(selectedChat)!.length === 1 ? (
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {getChatAvatar(selectedChat)}
                        </span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-secondary-200 rounded-full flex items-center justify-center text-lg">
                        {getChatAvatar(selectedChat)}
                      </div>
                    )}
                    
                    {/* Online status for private chats */}
                    {selectedChat.type === 'private' && selectedChat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div>
                    <h2 className="font-semibold text-secondary-900">{getChatName(selectedChat)}</h2>
                    {selectedChat.type === 'private' ? (
                      <p className="text-sm text-secondary-600">
                        {selectedChat.isOnline ? 'Online' : 
                         selectedChat.status === 'away' ? 'Away' : 
                         selectedChat.lastSeen ? `Last seen ${new Date(selectedChat.lastSeen).toLocaleDateString()}` : 'Offline'}
                      </p>
                    ) : (
                      <p className="text-sm text-secondary-600">
                        {selectedChat.participants.length} participants
                      </p>
                    )}
                  </div>
                </div>

                {/* Chat Actions */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 bg-chat-pattern overflow-hidden">
              <MessageList chatId={selectedChat._id} />
            </div>
            
            {/* Chat Input */}
            <div className="bg-white border-t border-secondary-200 p-4">
              <ChatBox chatId={selectedChat._id} />
            </div>
          </>
        ) : (
          // Welcome Screen
          <div className="flex-1 flex items-center justify-center bg-secondary-50">
            <div className="text-center max-w-md">
              <div className="w-32 h-32 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-secondary-800 mb-4">Welcome to ChatApp</h2>
              <p className="text-secondary-600 mb-8">Select a chat from the sidebar to start messaging, or create a new conversation.</p>
              
              {/* User Profile */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-secondary-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user?.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-secondary-900">{user?.username}</h3>
                    <p className="text-sm text-secondary-600">{user?.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={logout}
                  className="w-full bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;