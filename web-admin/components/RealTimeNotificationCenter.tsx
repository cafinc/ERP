"use client";

import React, { useState, useEffect } from 'react';
import { useWebSocket, useWebSocketEvent, EventType, ConnectionStatus } from '@/lib/WebSocketContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

export const RealTimeNotificationCenter: React.FC = () => {
  const { status } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to notification events
  useWebSocketEvent(EventType.NOTIFICATION, (data) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: data.type || 'general',
      title: data.title || 'Notification',
      message: data.message || '',
      timestamp: new Date().toISOString(),
      read: false,
      severity: data.severity || 'info',
    };

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
      });
    }
  });

  // Subscribe to weather alerts
  useWebSocketEvent(EventType.WEATHER_ALERT, (data) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'weather_alert',
      title: `Weather Alert: ${data.snow_forecast}" Snow`,
      message: `${data.action} - ${data.location}`,
      timestamp: new Date().toISOString(),
      read: false,
      severity: data.severity === 'high' ? 'error' : 'warning',
    };

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  // Subscribe to work order events
  useWebSocketEvent(EventType.WORK_ORDER_CREATED, (data) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'work_order',
      title: 'New Work Order',
      message: `${data.service_type} for ${data.customer_name}`,
      timestamp: new Date().toISOString(),
      read: false,
      severity: 'info',
    };

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  // Subscribe to system alerts
  useWebSocketEvent(EventType.SYSTEM_ALERT, (data) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'system_alert',
      title: 'System Alert',
      message: data.message || '',
      timestamp: new Date().toISOString(),
      read: false,
      severity: data.severity || 'warning',
    };

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'success':
        return 'bg-green-100 border-green-500 text-green-800';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const getConnectionStatusColor = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'bg-green-500';
      case ConnectionStatus.CONNECTING:
        return 'bg-yellow-500 animate-pulse';
      case ConnectionStatus.ERROR:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getConnectionStatusColor()}`}
          title={`Status: ${status}`}
        />
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    ({unreadCount} unread)
                  </span>
                )}
              </h3>
              <div className="flex space-x-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear all
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div className="mt-2 text-xs text-gray-600">
              <span className="flex items-center">
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${getConnectionStatusColor()}`}
                />
                {status === ConnectionStatus.CONNECTED && 'Connected - Real-time updates active'}
                {status === ConnectionStatus.CONNECTING && 'Connecting...'}
                {status === ConnectionStatus.DISCONNECTED && 'Disconnected - Attempting to reconnect'}
                {status === ConnectionStatus.ERROR && 'Connection error'}
              </span>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="mt-2">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                        !notification.read ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(
                            notification.severity
                          )}`}
                        >
                          {notification.type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotificationCenter;
