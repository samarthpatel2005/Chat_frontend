import React, { useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import socketService from '../utils/socket';

interface ChatBoxProps {
  chatId?: string;
  disabled?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ chatId, disabled = false }) => {
  const [message, setMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { sendMessage } = useChat();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (!isTyping && value.length > 0 && !disabled && chatId) {
      setIsTyping(true);
      socketService.startTyping(chatId);
    }

    // Clear existing timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Set new timer to stop typing
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      if (chatId) {
        socketService.stopTyping(chatId);
      }
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled && !isSending && chatId) {
      setIsSending(true);
      
      try {
        await sendMessage(chatId, message.trim());
        setMessage('');
        
        // Stop typing indicator
        if (isTyping) {
          setIsTyping(false);
          socketService.stopTyping(chatId);
          if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="chat-box">
      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-container">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => {
                handleInputChange(e);
                adjustTextareaHeight(e);
              }}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? 'Connecting to chat...' : 'Type your message... (Press Enter to send)'}
              disabled={disabled}
              className="message-input resize-none min-h-[48px] max-h-[120px] py-3 pr-12"
              maxLength={1000}
              rows={1}
            />
            <div className="absolute bottom-2 right-3 text-xs text-secondary-400">
              {message.length}/1000
            </div>
          </div>
          <button
            type="submit"
            disabled={disabled || !message.trim() || isSending}
            className="send-button flex items-center justify-center min-w-[80px]"
            title="Send message"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </div>
            )}
          </button>
        </div>
        {message.length > 900 && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
            Character limit approaching ({message.length}/1000)
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatBox;