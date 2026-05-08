import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.sockets = {};
  }

  /**
   * Get or create a socket connection for a specific namespace
   * @param {string} namespace - The namespace to connect to (e.g., '/interview', '/analytics')
   * @param {Object} query - Optional query parameters (e.g., { userId: '...' })
   * @returns {Socket}
   */
  getSocket(namespace = '/', query = {}) {
    const ns = namespace.startsWith('/') ? namespace : `/${namespace}`;
    const key = ns;

    if (this.sockets[key] && this.sockets[key].connected) {
      return this.sockets[key];
    }

    // Connect to the specific namespace
    const socket = io(`${SOCKET_URL}${ns === '/' ? '' : ns}`, {
      path: '/socket.io',
      query,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log(`[SocketService] Connected to ${ns} | ID: ${socket.id}`);
    });

    socket.on('connect_error', (error) => {
      console.error(`[SocketService] Connection error for ${ns}:`, error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[SocketService] Disconnected from ${ns} | Reason: ${reason}`);
    });

    this.sockets[key] = socket;
    return socket;
  }

  /**
   * Disconnect a specific namespace socket
   * @param {string} namespace 
   */
  disconnect(namespace = '/') {
    const ns = namespace.startsWith('/') ? namespace : `/${namespace}`;
    if (this.sockets[ns]) {
      this.sockets[ns].disconnect();
      delete this.sockets[ns];
      console.log(`[SocketService] Disposed socket for ${ns}`);
    }
  }

  /**
   * Disconnect all active sockets
   */
  disconnectAll() {
    Object.keys(this.sockets).forEach(ns => {
      this.sockets[ns].disconnect();
      console.log(`[SocketService] Disposed socket for ${ns}`);
    });
    this.sockets = {};
  }
}

const socketService = new SocketService();
export default socketService;
