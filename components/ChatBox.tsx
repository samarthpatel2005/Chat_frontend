import React, { useState } from 'react';
import socketService from '../utils/socket';

interface ChatBoxProps {
  disabled?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ disabled = false }) => {
  const [message, setMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  let typingTimer: NodeJS.Timeout;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      socketService.startTyping();
    }

    // Clear existing timer
    clearTimeout(typingTimer);

    // Set new timer to stop typing
    typingTimer = setTimeout(() => {
      setIsTyping(false);
      socketService.stopTyping();
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      socketService.sendMessage(message.trim());
      setMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socketService.stopTyping();
        clearTimeout(typingTimer);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-box">
      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-container">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? 'Connecting...' : 'Type your message...'}
            disabled={disabled}
            className="message-input"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="send-button"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;