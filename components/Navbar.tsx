import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">💬</span>
            </div>
            <h1>WizChat</h1>
          </div>
        </div>
        <div className="nav-content">
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="welcome-text">Welcome, {user?.username}!</span>
            </div>
            <div className="sm:hidden">
              <span className="welcome-text">{user?.username}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">🚪</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;