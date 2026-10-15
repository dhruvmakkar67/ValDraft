import { io } from "socket.io-client";

// Determine active backend URL with fallbacks:
// 1. URL search param ?backend=...
// 2. localStorage override ('valdraft_backend_url')
// 3. Vite environment variable (VITE_BACKEND_URL)
// 4. Localhost if running locally
// 5. Default Render deployment domain (https://valdraft-backend.onrender.com)
export const getStoredBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const urlParam = new URLSearchParams(window.location.search).get('backend');
    if (urlParam) {
      localStorage.setItem('valdraft_backend_url', urlParam);
      return urlParam;
    }
    const saved = localStorage.getItem('valdraft_backend_url');
    if (saved) return saved;
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return 'https://valdraft-backend.onrender.com';
  }
  return 'http://localhost:8000';
};

export let SOCKET_URL = getStoredBackendUrl();

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 12,
  reconnectionDelay: 1500,
  transports: ["websocket", "polling"],
});

export const updateSocketUrl = (newUrl) => {
  if (typeof window !== 'undefined') {
    if (newUrl && newUrl.trim()) {
      localStorage.setItem('valdraft_backend_url', newUrl.trim());
      SOCKET_URL = newUrl.trim();
    } else {
      localStorage.removeItem('valdraft_backend_url');
      SOCKET_URL = getStoredBackendUrl();
    }
  }
  
  try {
    socket.disconnect();
    if (socket.io) {
      socket.io.uri = SOCKET_URL;
    }
    socket.connect();
  } catch (err) {
    console.error("Failed to re-point socket:", err);
  }

  return SOCKET_URL;
};

export default socket;

