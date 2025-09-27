import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private currentChatId: string | null = null;

  connect(token: string): Socket {
    this.token = token;
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      // Auto-join user's chats when connected
      this.socket?.emit('join_chats');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Chat management
  joinChat(chatId: string): void {
    this.currentChatId = chatId;
    if (this.socket) {
      this.socket.emit('join_chat', { chatId });
    }
  }

  leaveChat(chatId: string): void {
    if (this.socket) {
      this.socket.emit('leave_chat', { chatId });
    }
    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }
  }

  getCurrentChatId(): string | null {
    return this.currentChatId;
  }

  // Message methods
  sendMessage(chatId: string, content: string, replyTo?: string): void {
    if (this.socket) {
      this.socket.emit('send_message', { chatId, content, replyTo });
    }
  }

  deleteMessage(messageId: string): void {
    if (this.socket) {
      this.socket.emit('delete_message', { messageId });
    }
  }

  // Typing indicators
  startTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('typing_start', { chatId });
    }
  }

  stopTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('typing_stop', { chatId });
    }
  }

  // Reactions
  addReaction(messageId: string, emoji: string): void {
    if (this.socket) {
      this.socket.emit('add_reaction', { messageId, emoji });
    }
  }

  // Status updates
  updateStatus(status: 'online' | 'away' | 'offline'): void {
    if (this.socket) {
      this.socket.emit('update_status', { status });
    }
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onMessageDeleted(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('message_deleted', callback);
    }
  }

  onMessageReaction(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('message_reaction', callback);
    }
  }

  onUserJoined(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user_joined', callback);
    }
  }

  onUserLeft(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user_left', callback);
    }
  }

  onUserTyping(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserOnline(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user_online', callback);
    }
  }

  onUserOffline(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user_offline', callback);
    }
  }

  onUserStatusUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user_status_update', callback);
    }
  }

  onJoinedChat(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('joined_chat', callback);
    }
  }

  onError(callback: (error: any) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }
}

const socketService = new SocketService();
export default socketService;