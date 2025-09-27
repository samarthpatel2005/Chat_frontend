import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat, Message } from '../context/ChatContext';
import socketService from '../utils/socket';

interface TypingUser {
  username: string;
  isTyping: boolean;
}

interface MessageListProps {
  chatId?: string;
}

const MessageList: React.FC<MessageListProps> = ({ chatId }) => {
  const { user } = useAuth();
  const { state, loadMessages, deleteMessage } = useChat();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
    }
  }, [chatId]);

  // Get messages for current chat
  const messages = chatId ? (state.messages[chatId] || []) : [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for typing indicators
    socketService.onUserTyping((data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.username !== data.username);
        if (data.isTyping) {
          return [...filtered, data];
        }
        return filtered;
      });
    });

    return () => {
      // Cleanup would go here if needed
    };
  }, []);

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatFullTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleDelete = (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId);
    }
  };

  const getUserInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const getUserColor = (username: string) => {
    // Generate consistent color based on username
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

  if (messages.length === 0) {
    return (
      <div className="message-list">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-700 mb-2">No messages yet</h3>
              <p className="text-secondary-500">Start the conversation by sending your first message!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      <div ref={messagesContainerRef} className="messages-container scrollbar-hide">
        {messages.map((message: Message, index: number) => {
          const isOwn = message.sender._id === user?.id;
          const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;
          
          return (
            <div
              key={message._id}
              className={`message ${isOwn ? 'own-message' : 'other-message'} group`}
              onMouseEnter={() => setHoveredMessage(message._id)}
              onMouseLeave={() => setHoveredMessage(null)}
            >
              {!isOwn && showAvatar && (
                <div className="flex items-end space-x-3 mb-1">
                  <div className={`w-8 h-8 bg-gradient-to-r ${getUserColor(message.sender.username)} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-semibold text-sm">
                      {getUserInitial(message.sender.username)}
                    </span>
                  </div>
                  <div className="text-xs text-secondary-600 font-medium">
                    {message.sender.username}
                  </div>
                </div>
              )}
              
              <div className={`flex ${isOwn ? 'justify-end' : showAvatar ? 'ml-11' : 'ml-11'}`}>
                <div className="relative max-w-xs sm:max-w-md lg:max-w-lg group">
                  <div className="message-content relative">
                    <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Timestamp tooltip */}
                    <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10`}>
                      <div className="bg-secondary-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                        {formatFullTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Message actions */}
                  {hoveredMessage === message._id && (
                    <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center space-x-1 px-2 animate-fade-in`}>
                      <div className="bg-white border border-secondary-200 rounded-lg shadow-medium p-1 flex space-x-1">
                        <span className="text-xs text-secondary-500 px-2 py-1">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(message._id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all duration-200"
                            title="Delete message"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="ml-11 mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {typingUsers.slice(0, 3).map((typingUser, index) => (
                  <div key={typingUser.username} className={`w-6 h-6 bg-gradient-to-r ${getUserColor(typingUser.username)} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-semibold text-xs">
                      {getUserInitial(typingUser.username)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-secondary-200 rounded-2xl px-4 py-2 shadow-soft">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
            <div className="text-xs text-secondary-500 mt-1 ml-8">
              {typingUsers.length === 1 
                ? `${typingUsers[0].username} is typing...`
                : typingUsers.length <= 3
                ? `${typingUsers.map(u => u.username).join(', ')} are typing...`
                : `${typingUsers.slice(0, 2).map(u => u.username).join(', ')} and ${typingUsers.length - 2} others are typing...`
              }
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;