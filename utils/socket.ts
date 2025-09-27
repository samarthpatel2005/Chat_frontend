import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

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

  // Message methods
  sendMessage(content: string): void {
    if (this.socket) {
      this.socket.emit('send_message', { content });
    }
  }

  deleteMessage(messageId: string): void {
    if (this.socket) {
      this.socket.emit('delete_message', { messageId });
    }
  }

  // Typing indicators
  startTyping(): void {
    if (this.socket) {
      this.socket.emit('typing_start');
    }
  }

  stopTyping(): void {
    if (this.socket) {
      this.socket.emit('typing_stop');
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

  onError(callback: (error: any) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }
}

export const socketService = new SocketService();
export default socketService;