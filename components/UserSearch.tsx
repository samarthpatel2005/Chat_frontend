import React, { useState, useEffect } from 'react';
import { useChat, User } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

interface UserSearchProps {
  onUserSelect: (user: User) => void;
  onClose: () => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { searchUsers } = useChat();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const users = await searchUsers(searchQuery);
      // Filter out current user
      const filteredUsers = users.filter(user => user._id !== currentUser?.id);
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900">Start New Chat</h3>
          <button
            onClick={onClose}
            className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="loading-spinner mx-auto mb-2"></div>
              <p className="text-secondary-500">Searching users...</p>
            </div>
          ) : searchResults.length === 0 && searchQuery ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-secondary-600 font-medium">No users found</p>
              <p className="text-sm text-secondary-500 mt-1">Try a different search term</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-secondary-600 font-medium">Start typing to search</p>
              <p className="text-sm text-secondary-500 mt-1">Find users by name or email</p>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => onUserSelect(user)}
                  className="flex items-center p-3 hover:bg-secondary-50 rounded-lg cursor-pointer transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 mr-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-10 h-10 bg-gradient-to-r ${getUserColor(user.username)} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Online status */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                      user.isOnline ? 'bg-green-500' : 
                      user.status === 'away' ? 'bg-yellow-500' : 'bg-secondary-400'
                    }`}></div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-secondary-900 truncate">
                      {user.username}
                    </h4>
                    <p className="text-sm text-secondary-600 truncate">
                      {user.email}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-secondary-500 truncate mt-1">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.isOnline ? 'bg-green-100 text-green-800' :
                      user.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-secondary-100 text-secondary-600'
                    }`}>
                      {user.isOnline ? 'Online' : 
                       user.status === 'away' ? 'Away' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;