import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import api from '../utils/api';

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  isOnline: boolean;
  lastSeen: Date;
  bio?: string;
}

export interface Message {
  _id: string;
  chat: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  replyTo?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      username: string;
    };
  };
  reactions: Array<{
    user: string;
    emoji: string;
    createdAt: Date;
  }>;
  timestamp: Date;
  readBy: Array<{
    user: string;
    readAt: Date;
  }>;
  isEdited: boolean;
  isDeleted: boolean;
}

export interface Chat {
  _id: string;
  type: 'private' | 'group';
  name?: string;
  avatar?: string;
  participants: User[];
  lastMessage?: Message;
  lastMessageTime?: Date;
  unreadCount?: number;
  isOnline?: boolean;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

export interface TypingUser {
  userId: string;
  username: string;
  chatId: string;
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: { [chatId: string]: Message[] };
  typingUsers: TypingUser[];
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'SET_ACTIVE_CHAT'; payload: Chat | null }
  | { type: 'SET_MESSAGES'; payload: { chatId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'DELETE_MESSAGE'; payload: { chatId: string; messageId: string } }
  | { type: 'ADD_TYPING_USER'; payload: TypingUser }
  | { type: 'REMOVE_TYPING_USER'; payload: { userId: string; chatId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: [],
  isLoading: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChat: action.payload, typingUsers: [] };
    case 'SET_MESSAGES':
      return { 
        ...state, 
        messages: { 
          ...state.messages, 
          [action.payload.chatId]: action.payload.messages 
        } 
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: [
            ...(state.messages[action.payload.chatId] || []),
            action.payload.message
          ]
        }
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: (state.messages[action.payload.chatId] || []).map(msg =>
            msg._id === action.payload.message._id ? action.payload.message : msg
          )
        }
      };
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: (state.messages[action.payload.chatId] || []).filter(
            msg => msg._id !== action.payload.messageId
          )
        }
      };
    case 'ADD_TYPING_USER':
      return {
        ...state,
        typingUsers: [
          ...state.typingUsers.filter(
            tu => !(tu.userId === action.payload.userId && tu.chatId === action.payload.chatId)
          ),
          action.payload,
        ],
      };
    case 'REMOVE_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(
          tu => !(tu.userId === action.payload.userId && tu.chatId === action.payload.chatId)
        ),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  loadChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, replyTo?: string) => Promise<void>;
  createChat: (type: 'private' | 'group', participants: string[], name?: string) => Promise<Chat | null>;
  deleteMessage: (messageId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const loadChats = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get('/chats');
      dispatch({ type: 'SET_CHATS', payload: response.data.chats });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load chats' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get(`/chats/${chatId}/messages`);
      dispatch({ type: 'SET_MESSAGES', payload: { chatId, messages: response.data.messages } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load messages' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendMessage = async (chatId: string, content: string, replyTo?: string) => {
    try {
      await api.post(`/chats/${chatId}/messages`, { content, replyTo });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send message' });
    }
  };

  const createChat = async (
    type: 'private' | 'group',
    participants: string[],
    name?: string
  ): Promise<Chat | null> => {
    try {
      // For private chats, first check if chat already exists
      if (type === 'private' && participants.length === 1) {
        const existingChat = state.chats.find(chat => 
          chat.type === 'private' && 
          chat.participants.some(p => p._id === participants[0])
        );
        
        if (existingChat) {
          console.log('Found existing private chat:', existingChat);
          return existingChat;
        }
      }

      const response = await api.post('/chats/create', { type, participants, name });
      const newChat = response.data.chat;
      dispatch({ type: 'SET_CHATS', payload: [newChat, ...state.chats] });
      return newChat;
    } catch (error: any) {
      console.error('Create chat error:', error);
      
      // If chat already exists (backend returns 400), try to find it in current chats
      if (error?.response?.status === 400 && error?.response?.data?.message?.includes('already exists')) {
        console.log('Chat already exists, searching in current chats...');
        
        if (type === 'private' && participants.length === 1) {
          const existingChat = state.chats.find(chat => 
            chat.type === 'private' && 
            chat.participants.some(p => p._id === participants[0])
          );
          
          if (existingChat) {
            console.log('Found existing chat after error:', existingChat);
            return existingChat;
          }
          
          // If not found in current chats, reload chats and try again
          console.log('Chat not found in current state, reloading chats...');
          await loadChats();
          
          const reloadedChat = state.chats.find(chat => 
            chat.type === 'private' && 
            chat.participants.some(p => p._id === participants[0])
          );
          
          if (reloadedChat) {
            return reloadedChat;
          }
        }
      }
      
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create chat' });
      return null;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await api.delete(`/chats/messages/${messageId}`);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete message' });
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      const response = await api.get(`/chats/search/users?query=${encodeURIComponent(query)}`);
      return response.data.users;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to search users' });
      return [];
    }
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        loadChats,
        loadMessages,
        sendMessage,
        createChat,
        deleteMessage,
        searchUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};