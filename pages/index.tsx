import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/chat');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center space-y-6 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center shadow-large animate-bounce-soft">
              <span className="text-4xl">💬</span>
            </div>
          </div>
          
          {/* Loading content */}
          <div className="space-y-4">
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              WizChat
            </h1>
            <p className="text-secondary-600 text-lg">Initializing your chat experience...</p>
          </div>
          
          {/* Loading spinner */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* Features preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-md mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-soft text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm">⚡</span>
              </div>
              <p className="text-xs text-secondary-600 font-medium">Real-time</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-soft text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm">🔒</span>
              </div>
              <p className="text-xs text-secondary-600 font-medium">Secure</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-soft text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm">👥</span>
              </div>
              <p className="text-xs text-secondary-600 font-medium">Social</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default HomePage;