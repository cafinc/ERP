"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// WebSocket connection states
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// Event types
export enum EventType {
  // System events
  SYSTEM_ALERT = 'system_alert',
  
  // Work order events
  WORK_ORDER_CREATED = 'work_order_created',
  WORK_ORDER_ASSIGNED = 'work_order_assigned',
  WORK_ORDER_UPDATED = 'work_order_updated',
  WORK_ORDER_COMPLETED = 'work_order_completed',
  
  // Task events
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  
  // Weather events
  WEATHER_ALERT = 'weather_alert',
  
  // Fleet events
  CREW_LOCATION_UPDATE = 'crew_location_update',
  CREW_STATUS_CHANGE = 'crew_status_change',
  
  // Notification events
  NOTIFICATION = 'notification',
  
  // Communication events
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_READ = 'message_read',
}

interface WebSocketMessage {
  type: EventType | string;
  data: any;
  timestamp: string;
}

interface WebSocketContextType {
  status: ConnectionStatus;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  subscribe: (eventType: EventType | string, callback: (data: any) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  userId?: string;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  userId,
  autoConnect = true,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [subscribers, setSubscribers] = useState<Map<string, Set<(data: any) => void>>>(new Map());
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  // Get WebSocket URL from environment
  const getWebSocketUrl = useCallback(() => {
    // Use the backend URL from environment and convert to WebSocket protocol
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = backendUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${wsHost}/api/ws/${userId || 'admin'}`;
  }, [userId]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    setStatus(ConnectionStatus.CONNECTING);
    const wsUrl = getWebSocketUrl();
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setStatus(ConnectionStatus.CONNECTED);
        setReconnectAttempts(0);
        
        // Send heartbeat
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Every 30 seconds

        // Store heartbeat interval ID
        (ws as any).heartbeat = heartbeat;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Notify subscribers
          const eventSubscribers = subscribers.get(message.type);
          if (eventSubscribers) {
            eventSubscribers.forEach((callback) => callback(message.data));
          }

          // Also notify wildcard subscribers (*)
          const wildcardSubscribers = subscribers.get('*');
          if (wildcardSubscribers) {
            wildcardSubscribers.forEach((callback) => callback(message));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus(ConnectionStatus.ERROR);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setStatus(ConnectionStatus.DISCONNECTED);
        
        // Clear heartbeat
        if ((ws as any).heartbeat) {
          clearInterval((ws as any).heartbeat);
        }

        // Attempt reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms...`);
          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, delay);
        }
      };

      setSocket(ws);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setStatus(ConnectionStatus.ERROR);
    }
  }, [socket, getWebSocketUrl, reconnectAttempts, subscribers]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [socket]);

  // Send message through WebSocket
  const sendMessage = useCallback(
    (message: any) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket is not connected');
      }
    },
    [socket]
  );

  // Subscribe to specific event type
  const subscribe = useCallback(
    (eventType: EventType | string, callback: (data: any) => void) => {
      setSubscribers((prev) => {
        const newSubscribers = new Map(prev);
        const eventSubscribers = newSubscribers.get(eventType) || new Set();
        eventSubscribers.add(callback);
        newSubscribers.set(eventType, eventSubscribers);
        return newSubscribers;
      });

      // Return unsubscribe function
      return () => {
        setSubscribers((prev) => {
          const newSubscribers = new Map(prev);
          const eventSubscribers = newSubscribers.get(eventType);
          if (eventSubscribers) {
            eventSubscribers.delete(callback);
            if (eventSubscribers.size === 0) {
              newSubscribers.delete(eventType);
            } else {
              newSubscribers.set(eventType, eventSubscribers);
            }
          }
          return newSubscribers;
        });
      };
    },
    []
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId]);

  const value: WebSocketContextType = {
    status,
    lastMessage,
    sendMessage,
    subscribe,
    connect,
    disconnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

// Hook to subscribe to specific event types
export const useWebSocketEvent = (
  eventType: EventType | string,
  callback: (data: any) => void
) => {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe(eventType, callback);
    return unsubscribe;
  }, [eventType, callback, subscribe]);
};

// Hook to get connection status
export const useConnectionStatus = (): ConnectionStatus => {
  const { status } = useWebSocket();
  return status;
};
