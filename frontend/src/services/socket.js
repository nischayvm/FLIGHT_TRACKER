import io from 'socket.io-client';

// Connect to backend URL (default 5000)
const SOCKET_URL = 'http://localhost:5000';

export const socket = io(SOCKET_URL);
