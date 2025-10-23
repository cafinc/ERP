import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  connectionError: string | null;
  subscribe: (channel: string) => boolean;
  unsubscribe: (channel: string) => boolean;
  sendMessage: (message: any) => boolean;
  onTaskCreated: (callback: (task: any) => void) => () => void;
  onTaskUpdated: (callback: (task: any) => void) => () => void;
  onTaskAssigned: (callback: (task: any) => void) => () => void;
  onWorkOrderCreated: (callback: (workOrder: any) => void) => () => void;
  onWorkOrderUpdated: (callback: (workOrder: any) => void) => () => void;
  onNotification: (callback: (notification: any) => void) => () => void;
  onWeatherAlert: (callback: (alert: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user } = useAuth();
  const [eventListeners, setEventListeners] = useState<Map<string, Set<Function>>>(new Map());

  const handleMessage = useCallback((message: any) => {
    const { type, data } = message;
    
    // Get listeners for this event type
    const listeners = eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }, [eventListeners]);

  const {
    isConnected,
    connectionError,
    send,
    subscribe: wsSubscribe,
    unsubscribe: wsUnsubscribe,
  } = useWebSocket({
    userId: user?.id,
    token: user?.token,
    onMessage: handleMessage,
    onConnect: () => {
      console.log('[WebSocketProvider] Connected');
      // Auto-subscribe to user's channels
      if (user?.role === 'admin') {
        wsSubscribe('dispatch');
      }
    },
    onDisconnect: () => {
      console.log('[WebSocketProvider] Disconnected');
    },
    onError: (error) => {
      console.error('[WebSocketProvider] Error:', error);
    },
  });

  const registerListener = useCallback((eventType: string, callback: Function) => {
    setEventListeners(prev => {
      const newMap = new Map(prev);
      const listeners = newMap.get(eventType) || new Set();
      listeners.add(callback);
      newMap.set(eventType, listeners);
      return newMap;
    });

    // Return unsubscribe function
    return () => {
      setEventListeners(prev => {
        const newMap = new Map(prev);
        const listeners = newMap.get(eventType);
        if (listeners) {
          listeners.delete(callback);
          if (listeners.size === 0) {
            newMap.delete(eventType);
          } else {
            newMap.set(eventType, listeners);
          }
        }
        return newMap;
      });
    };
  }, []);

  const onTaskCreated = useCallback((callback: (task: any) => void) => {
    return registerListener('task.created', callback);
  }, [registerListener]);

  const onTaskUpdated = useCallback((callback: (task: any) => void) => {
    return registerListener('task.updated', callback);
  }, [registerListener]);

  const onTaskAssigned = useCallback((callback: (task: any) => void) => {
    return registerListener('task.assigned', callback);
  }, [registerListener]);

  const onWorkOrderCreated = useCallback((callback: (workOrder: any) => void) => {
    return registerListener('work_order.created', callback);
  }, [registerListener]);

  const onWorkOrderUpdated = useCallback((callback: (workOrder: any) => void) => {
    return registerListener('work_order.updated', callback);
  }, [registerListener]);

  const onNotification = useCallback((callback: (notification: any) => void) => {
    return registerListener('notification.new', callback);
  }, [registerListener]);

  const onWeatherAlert = useCallback((callback: (alert: any) => void) => {
    return registerListener('weather.alert', callback);
  }, [registerListener]);

  const value: WebSocketContextType = {
    isConnected,
    connectionError,
    subscribe: wsSubscribe,
    unsubscribe: wsUnsubscribe,
    sendMessage: send,
    onTaskCreated,
    onTaskUpdated,
    onTaskAssigned,
    onWorkOrderCreated,
    onWorkOrderUpdated,
    onNotification,
    onWeatherAlert,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

export default WebSocketContext;
