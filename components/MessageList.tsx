import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import socketService from '../utils/socket';

interface Message {
  _id: string;
  sender: string;
  username: string;
  content: string;
  timestamp: Date;
}

interface TypingUser {
  username: string;
  isTyping: boolean;
}

interface MessageListProps {
  messages: Message[];
  onDeleteMessage: (messageId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onDeleteMessage }) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDeleteMessage(messageId);
    }
  };

  return (
    <div className="message-list">
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${message.sender === user?.id ? 'own-message' : 'other-message'}`}
          >
            <div className="message-header">
              <span className="username">{message.username}</span>
              <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
              {message.sender === user?.id && (
                <button
                  onClick={() => handleDelete(message._id)}
                  className="delete-button"
                  title="Delete message"
                >
                  ×
                </button>
              )}
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        
        {/* Typing indicators */}
        {typingUsers.map((typingUser) => (
          <div key={typingUser.username} className="typing-indicator">
            <span className="username">{typingUser.username}</span> is typing...
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;