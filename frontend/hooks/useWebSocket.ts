import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  userId?: string;
  token?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    userId,
    token,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const getWebSocketUrl = useCallback(() => {
    const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://fieldview-3.preview.emergentagent.com';
    const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    let url = `${wsUrl}/api/ws`;
    const params = new URLSearchParams();
    
    if (userId) params.append('user_id', userId);
    if (token) params.append('token', token);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return url;
  }, [userId, token]);

  const connect = useCallback(() => {
    if (!userId) {
      console.log('[WebSocket] No user ID provided, skipping connection');
      return;
    }

    try {
      const url = getWebSocketUrl();
      console.log('[WebSocket] Connecting to:', url);
      
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setConnectionError(null);
        onConnect?.();
        
        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        ws.current.addEventListener('close', () => clearInterval(pingInterval));
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', message.type);
          onMessage?.(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionError('Connection error');
        onError?.(error);
      };

      ws.current.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        onDisconnect?.();
        
        ws.current = null;

        // Auto-reconnect if enabled and not a normal closure
        if (autoReconnect && event.code !== 1000) {
          console.log(`[WebSocket] Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      setConnectionError('Failed to connect');
      onError?.(error);
    }
  }, [userId, token, onMessage, onConnect, onDisconnect, onError, autoReconnect, reconnectInterval, getWebSocketUrl]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (ws.current) {
      console.log('[WebSocket] Disconnecting...');
      ws.current.close(1000, 'User disconnected');
      ws.current = null;
      setIsConnected(false);
    }
  }, []);

  const send = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
      return false;
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    return send({ type: 'subscribe', channel });
  }, [send]);

  const unsubscribe = useCallback((channel: string) => {
    return send({ type: 'unsubscribe', channel });
  }, [send]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('[WebSocket] App foregrounded, reconnecting...');
        if (!isConnected && userId) {
          connect();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        console.log('[WebSocket] App backgrounded');
        // Keep connection alive in background for notifications
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isConnected, userId, connect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId]); // Only reconnect if userId changes

  return {
    isConnected,
    connectionError,
    send,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  };
}

export default useWebSocket;
