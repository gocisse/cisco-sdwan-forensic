// useSSE.js
// Custom React hook for Server-Sent Events (SSE) connections

import { useEffect, useRef, useState } from 'react';

/**
 * useSSE - Custom hook for connecting to SSE endpoints
 * 
 * @param {string} url - The SSE endpoint URL (e.g., '/events/bfd?system-ip=1.1.1.1')
 * @param {object} options - Configuration options
 * @param {number} options.reconnectInterval - Time in ms before reconnecting (default: 3000)
 * @param {function} options.onMessage - Callback for handling parsed JSON data
 * @param {function} options.onError - Callback for handling errors
 * @param {function} options.onConnect - Callback when connection is established
 * @param {function} options.onDisconnect - Callback when connection is lost
 * 
 * @returns {object} - { data, error, isConnected, reconnect }
 */
export function useSSE(url, options = {}) {
  const {
    reconnectInterval = 3000,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Connection opened
    eventSource.addEventListener('connected', (event) => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
      if (onConnect) onConnect(event);
    });

    // Data received
    eventSource.addEventListener('data', (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
        if (onMessage) onMessage(parsedData);
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
        setError(err);
        if (onError) onError(err);
      }
    });

    // Heartbeat received (connection still alive)
    eventSource.addEventListener('heartbeat', (event) => {
      // Connection is alive, no action needed
    });

    // Generic message handler (fallback)
    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
        if (onMessage) onMessage(parsedData);
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    // Error handler
    eventSource.onerror = (err) => {
      setIsConnected(false);
      
      if (eventSource.readyState === EventSource.CLOSED) {
        if (onDisconnect) onDisconnect();
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
          console.log(`SSE disconnected. Reconnecting in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setError(new Error('Max reconnection attempts reached'));
          if (onError) onError(new Error('Max reconnection attempts reached'));
        }
      }
    };
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  };

  const reconnect = () => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  };

  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Reconnect when URL changes

  return {
    data,
    error,
    isConnected,
    reconnect,
    disconnect,
  };
}

export default useSSE;
