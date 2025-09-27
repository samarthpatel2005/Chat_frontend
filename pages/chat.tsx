import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import ChatBox from '../components/ChatBox';
import MessageList from '../components/MessageList';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import socketService from '../utils/socket';

interface Message {
  _id: string;
  sender: string;
  username: string;
  content: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await api.get('/chat/history?limit=50');
        setMessages(response.data.messages);
      } catch (err: any) {
        setError('Failed to load chat history');
        console.error('Error loading chat history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadChatHistory();
    }
  }, [isAuthenticated]);

  // Setup socket connection
  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = socketService.connect(token);
      
      socket.on('connect', () => {
        setIsConnected(true);
        setError('');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('connect_error', () => {
        setError('Failed to connect to chat server');
        setIsConnected(false);
      });

      // Listen for new messages
      socketService.onNewMessage((message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      // Listen for deleted messages
      socketService.onMessageDeleted((data: { messageId: string }) => {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      });

      // Listen for user events
      socketService.onUserJoined((data) => {
        console.log(data.message);
      });

      socketService.onUserLeft((data) => {
        console.log(data.message);
      });

      socketService.onError((error) => {
        setError(error.message || 'An error occurred');
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  const handleDeleteMessage = (messageId: string) => {
    socketService.deleteMessage(messageId);
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="chat-page">
      <Navbar />
      
      <div className="chat-container">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
        
        <div className="chat-content">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading chat history...</p>
            </div>
          ) : (
            <MessageList 
              messages={messages} 
              onDeleteMessage={handleDeleteMessage}
            />
          )}
        </div>
        
        <div className="chat-input-container">
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </span>
          </div>
          <ChatBox disabled={!isConnected} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;