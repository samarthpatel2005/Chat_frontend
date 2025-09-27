import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat, User } from '../context/ChatContext';
import api from '../utils/api';

interface OnlineUsersProps {
  onUserSelect: (user: User) => void;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ onUserSelect }) => {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingChatWithUser, setCreatingChatWithUser] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const { createChat } = useChat();

  useEffect(() => {
    loadOnlineUsers();
    // Refresh every 30 seconds
    const interval = setInterval(loadOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOnlineUsers = async () => {
    try {
      console.log('Loading users from API...');
      console.log('Current user:', currentUser);
      
      // Get all users (for demo - you might want to limit this in production)
      const response = await api.get('/users/all');
      console.log('Users API response:', response.data);
      
      if (response.data && response.data.users) {
        const users = response.data.users || [];
        
        // Filter out current user and set all as online for demo
        const otherUsers = users.filter((user: User) => user._id !== currentUser?.id)
          .map((user: User) => ({
            ...user,
            isOnline: true, // Set all as online for demo
            status: 'online' as const
          }));
        
        console.log('Processed users:', otherUsers);
        setOnlineUsers(otherUsers);
      } else {
        console.warn('Invalid response format from users API');
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      
      // If API fails, create some demo users for testing
      const demoUsers: User[] = [
        {
          _id: 'demo1',
          username: 'samarth',
          email: 'samarth@gmail.com',
          isOnline: true,
          status: 'online' as const,
          lastSeen: new Date()
        },
        {
          _id: 'demo2', 
          username: 'ashok',
          email: 'ashok@gmail.com',
          isOnline: true,
          status: 'online' as const,
          lastSeen: new Date()
        },
        {
          _id: 'demo3', 
          username: 'john_doe',
          email: 'john@gmail.com',
          isOnline: true,
          status: 'online' as const,
          lastSeen: new Date()
        }
      ].filter(demoUser => demoUser.username !== currentUser?.username);
      
      console.log('Using demo users:', demoUsers);
      setOnlineUsers(demoUsers);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChat = async (user: User) => {
    if (creatingChatWithUser === user._id) {
      console.log('Already creating chat with this user, ignoring click');
      return;
    }

    try {
      setCreatingChatWithUser(user._id);
      console.log('Creating/selecting chat with user:', user);
      
      const newChat = await createChat('private', [user._id]);
      if (newChat) {
        console.log('Chat created successfully:', newChat);
        // Call the parent callback with the selected user
        onUserSelect(user);
      } else {
        // If createChat returns null, create a temporary chat object
        console.log('Chat creation returned null, creating temporary chat object');
        const tempChat = {
          _id: `temp_${user._id}_${Date.now()}`,
          type: 'private' as const,
          participants: [user],
          isOnline: user.isOnline,
          status: user.status,
          lastSeen: user.lastSeen
        };
        onUserSelect(user);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      // Even if chat creation fails, still try to select the user
      console.log('Chat creation failed, but selecting user anyway');
      onUserSelect(user);
    } finally {
      setCreatingChatWithUser(null);
    }
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

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-secondary-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-secondary-200">
      <div className="p-4 bg-secondary-50">
        <h3 className="text-sm font-semibold text-secondary-700 mb-3">Available Users</h3>
        
        {onlineUsers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-secondary-500">No other users available</p>
            <p className="text-xs text-secondary-400 mt-1">
              Make sure other users are registered
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => handleCreateChat(user)}
                className={`group flex items-center p-2 rounded-lg transition-all duration-200 ${
                  creatingChatWithUser === user._id 
                    ? 'bg-primary-50 cursor-wait opacity-75' 
                    : 'hover:bg-white hover:shadow-sm cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0 mr-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-8 h-8 bg-gradient-to-r ${getUserColor(user.username)} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-semibold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Online status */}
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-white rounded-full ${
                    user.isOnline ? 'bg-green-500' : 
                    user.status === 'away' ? 'bg-yellow-500' : 'bg-secondary-400'
                  }`}></div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-secondary-900 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-secondary-500 truncate">
                    {user.isOnline ? 'Online' : user.status}
                  </p>
                </div>

                {/* Chat icon or loading */}
                <div className="text-secondary-400 flex items-center">
                  {creatingChatWithUser === user._id ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                      <span className="text-xs text-primary-600">Connecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 group-hover:space-x-2 transition-all">
                      <svg className="w-4 h-4 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Chat</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;