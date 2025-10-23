import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'work_order' | 'estimate' | 'invoice' | 'form' | 'general' | 'project' | 'maintenance' | 'inspection';
  related_id?: string;
  related_type?: string;
  assigned_to: string[];
  assigned_by: string;
  assigned_by_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  start_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  attachments: any[];
  tags: string[];
  checklist: any[];
  estimated_hours?: number;
  actual_hours?: number;
  completion_notes?: string;
  watchers: string[];
  is_recurring: boolean;
  recurrence_pattern?: string;
}

export interface TaskNotification {
  id: string;
  task_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  read_at?: string;
  created_at: string;
}

interface TaskContextType {
  tasks: Task[];
  notifications: TaskNotification[];
  unreadCount: number;
  loading: boolean;
  fetchTasks: (filters?: any) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async (filters?: any) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.type) params.append('type', filters.type);
        if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
        if (filters.search) params.append('search', filters.search);
      }
      
      // Default: get tasks assigned to current user
      if (!filters?.assigned_to) {
        params.append('assigned_to', currentUser.id);
      }
      
      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const response = await api.get(`/tasks/notifications/me?user_id=${currentUser.id}`);
      setNotifications(response.data || []);
      
      // Get unread count
      const countResponse = await api.get(`/tasks/notifications/unread-count?user_id=${currentUser.id}`);
      setUnreadCount(countResponse.data?.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await api.put(`/tasks/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    
    try {
      await api.put(`/tasks/notifications/mark-all-read?user_id=${currentUser.id}`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const refreshTasks = async () => {
    await fetchTasks();
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // Auto-fetch on mount and user change
  useEffect(() => {
    if (currentUser) {
      fetchTasks();
      fetchNotifications();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  return (
    <TaskContext.Provider value={{
      tasks,
      notifications,
      unreadCount,
      loading,
      fetchTasks,
      fetchNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      refreshTasks,
      refreshNotifications
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}