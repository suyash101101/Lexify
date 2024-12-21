import { useState, useEffect, useCallback } from 'react';

export const useWebSocket = (url) => {
  const [ws, setWs] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      setConnectionStatus('connected');
    };

    websocket.onclose = () => {
      setConnectionStatus('disconnected');
    };

    websocket.onmessage = (event) => {
      setLastMessage(event.data);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url]);

  const sendMessage = useCallback((message) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }, [ws]);

  return { sendMessage, lastMessage, connectionStatus };
}; 