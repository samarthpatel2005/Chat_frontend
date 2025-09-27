import React, { useState, useEffect } from 'react';
import { useChat, Chat, User } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import UserSearch from './UserSearch';
import OnlineUsers from './OnlineUsers';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChatId: string | null;
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const { state, loadChats, createChat } = useChat();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const filteredChats = state.chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => 
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatLastMessageTime = (date: Date | undefined) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString();
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.avatar) return chat.avatar;
    if (chat.type === 'group') return '👥';
    
    // For private chats, get other participant's avatar
    const otherParticipant = chat.participants.find(p => p._id !== user?.id);
    return otherParticipant?.avatar || otherParticipant?.username?.charAt(0).toUpperCase() || '?';
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.type === 'group') return 'Group Chat';
    
    // For private chats, get other participant's name
    const otherParticipant = chat.participants.find(p => p._id !== user?.id);
    return otherParticipant?.username || 'Unknown User';
  };

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const content = chat.lastMessage.content;
    if (content.length > 50) {
      return content.substring(0, 50) + '...';
    }
    return content;
  };

  const getUserColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-red-400 to-red-600',
      'from-yellow-400 to-yellow-600',
      'from-teal-400 to-teal-600',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const handleUserSelect = async (selectedUser: User) => {
    try {
      console.log('=== ChatList: Handling user selection ===');
      console.log('Selected user:', selectedUser);
      console.log('Current chats count:', state.chats.length);
      
      // First, check if a chat already exists with this user
      const existingChat = state.chats.find(chat => 
        chat.type === 'private' && 
        chat.participants.some(p => p._id === selectedUser._id)
      );
      
      if (existingChat) {
        console.log('Found existing chat, selecting it:', existingChat);
        setShowUserSearch(false);
        onChatSelect(existingChat);
        return;
      }
      
      console.log('No existing chat found, creating new one...');
      
      // Create a private chat with the selected user
      const newChat = await createChat('private', [selectedUser._id]);
      if (newChat) {
        console.log('Successfully created new chat:', newChat);
        setShowUserSearch(false);
        onChatSelect(newChat);
        // Reload chats to update the list
        await loadChats();
      } else {
        console.warn('Chat creation returned null, trying to find existing chat...');
        // Try to find the chat again after creation attempt
        await loadChats(); // Reload first
        const retryChat = state.chats.find(chat => 
          chat.type === 'private' && 
          chat.participants.some(p => p._id === selectedUser._id)
        );
        if (retryChat) {
          console.log('Found chat after reload:', retryChat);
          setShowUserSearch(false);
          onChatSelect(retryChat);
        } else {
          console.warn('Still no chat found after reload');
        }
      }
    } catch (error) {
      console.error('Error in user selection:', error);
      // Even if there's an error, try to reload chats and find existing chat
      try {
        await loadChats();
        const existingChat = state.chats.find(chat => 
          chat.type === 'private' && 
          chat.participants.some(p => p._id === selectedUser._id)
        );
        if (existingChat) {
          console.log('Found existing chat after error and reload:', existingChat);
          setShowUserSearch(false);
          onChatSelect(existingChat);
        } else {
          console.error('No chat found even after error recovery');
        }
      } catch (reloadError) {
        console.error('Failed to reload chats during error recovery:', reloadError);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-secondary-200">
      {/* Header */}
      <div className="p-4 bg-primary-600 text-white">
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-secondary-500">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">No chats yet</p>
            <p className="text-sm">Start a conversation with someone!</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => onChatSelect(chat)}
              className={`flex items-center p-4 hover:bg-secondary-50 cursor-pointer transition-colors border-b border-secondary-100 ${
                selectedChatId === chat._id ? 'bg-primary-50 border-r-4 border-r-primary-500' : ''
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0 mr-3">
                {typeof getChatAvatar(chat) === 'string' && getChatAvatar(chat).length === 1 ? (
                  <div className={`w-12 h-12 bg-gradient-to-r ${getUserColor(getChatName(chat))} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-semibold text-lg">
                      {getChatAvatar(chat)}
                    </span>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-secondary-200 rounded-full flex items-center justify-center text-2xl">
                    {getChatAvatar(chat)}
                  </div>
                )}
                
                {/* Online status for private chats */}
                {chat.type === 'private' && chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-secondary-900 truncate">
                    {getChatName(chat)}
                  </h3>
                  <span className="text-xs text-secondary-500 ml-2">
                    {formatLastMessageTime(chat.lastMessageTime)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary-600 truncate">
                    {getLastMessagePreview(chat)}
                  </p>
                  
                  {/* Unread count */}
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <span className="ml-2 bg-primary-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </span>
                  )}
                </div>

                {/* Online status text for private chats */}
                {chat.type === 'private' && (
                  <div className="flex items-center mt-1">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      chat.isOnline ? 'bg-green-500' : chat.status === 'away' ? 'bg-yellow-500' : 'bg-secondary-400'
                    }`}></div>
                    <span className="text-xs text-secondary-500">
                      {chat.isOnline ? 'Online' : 
                       chat.status === 'away' ? 'Away' : 
                       chat.lastSeen ? `Last seen ${formatLastMessageTime(chat.lastSeen)}` : 'Offline'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Available Users Section */}
      <OnlineUsers onUserSelect={handleUserSelect} />

      {/* New Chat Button */}
      <div className="p-4 border-t border-secondary-200">
        <button 
          onClick={() => setShowUserSearch(true)}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search Users</span>
        </button>
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearch
          onUserSelect={handleUserSelect}
          onClose={() => setShowUserSearch(false)}
        />
      )}
    </div>
  );
};

export default ChatList;