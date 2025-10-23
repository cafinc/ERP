import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect, useCallback } from 'react';

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_QUEUE: '@offline_queue',
  CACHED_DATA: '@cached_data_',
  LAST_SYNC: '@last_sync',
  USER_DATA: '@user_data',
};

// Operation types for sync queue
export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

// Queued operation interface
export interface QueuedOperation {
  id: string;
  type: OperationType;
  entity: string; // 'task', 'work_order', 'time_entry', etc.
  data: any;
  timestamp: number;
  retryCount: number;
}

// Network status
export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
}

class OfflineManager {
  private static instance: OfflineManager;
  private queue: QueuedOperation[] = [];
  private isSyncing: boolean = false;
  private networkStatus: NetworkStatus = {
    isConnected: null,
    isInternetReachable: null,
    type: null,
  };

  private constructor() {
    this.loadQueue();
    this.setupNetworkListener();
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  // Setup network listener
  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.networkStatus.isConnected;
      
      this.networkStatus = {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };

      console.log('Network status changed:', this.networkStatus);

      // If we just came back online, sync queue
      if (wasOffline && state.isConnected && state.isInternetReachable) {
        console.log('Back online - triggering sync');
        this.syncQueue();
      }
    });
  }

  // Get current network status
  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  // Check if online
  public async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  }

  // Add operation to queue
  public async addToQueue(
    type: OperationType,
    entity: string,
    data: any
  ): Promise<void> {
    const operation: QueuedOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(operation);
    await this.saveQueue();

    console.log(`Added to offline queue: ${entity} ${type}`, operation);

    // Try to sync if online
    if (await this.isOnline()) {
      this.syncQueue();
    }
  }

  // Load queue from storage
  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(`Loaded ${this.queue.length} items from offline queue`);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  // Save queue to storage
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(this.queue)
      );
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  // Get queue size
  public getQueueSize(): number {
    return this.queue.length;
  }

  // Get queue items
  public getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  // Sync queue with server
  public async syncQueue(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!(await this.isOnline())) {
      console.log('Cannot sync - offline');
      return;
    }

    if (this.queue.length === 0) {
      console.log('Queue is empty');
      return;
    }

    this.isSyncing = true;
    console.log(`Starting sync of ${this.queue.length} operations`);

    const operations = [...this.queue];
    const failedOperations: QueuedOperation[] = [];

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        // Remove successful operation from queue
        this.queue = this.queue.filter((op) => op.id !== operation.id);
        console.log(`Successfully synced: ${operation.entity} ${operation.type}`);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        operation.retryCount++;
        
        // Keep in queue if retry count < 3
        if (operation.retryCount < 3) {
          failedOperations.push(operation);
        } else {
          console.log(`Max retries reached for operation ${operation.id}, removing from queue`);
        }
      }
    }

    this.queue = failedOperations;
    await this.saveQueue();

    this.isSyncing = false;
    
    // Update last sync time
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    console.log(`Sync complete. ${failedOperations.length} operations failed`);
  }

  // Execute a single operation
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
    const endpoint = this.getEndpointForEntity(operation.entity);
    const url = `${backendUrl}/api${endpoint}`;

    let method: string;
    let finalUrl = url;

    switch (operation.type) {
      case OperationType.CREATE:
        method = 'POST';
        break;
      case OperationType.UPDATE:
        method = 'PUT';
        finalUrl = `${url}/${operation.data.id}`;
        break;
      case OperationType.DELETE:
        method = 'DELETE';
        finalUrl = `${url}/${operation.data.id}`;
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    const response = await fetch(finalUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method !== 'DELETE' ? JSON.stringify(operation.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  }

  // Get API endpoint for entity
  private getEndpointForEntity(entity: string): string {
    const endpoints: Record<string, string> = {
      task: '/tasks',
      work_order: '/work-orders',
      time_entry: '/hr/time-entries',
      photo: '/photos',
      gps_location: '/gps/locations',
      form_response: '/forms/responses',
    };

    return endpoints[entity] || `/${entity}s`;
  }

  // Cache data for offline access
  public async cacheData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CACHED_DATA}${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
      console.log(`Cached data for key: ${key}`);
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // Get cached data
  public async getCachedData<T>(key: string, maxAge?: number): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${STORAGE_KEYS.CACHED_DATA}${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      // Check if data is too old
      if (maxAge && Date.now() - timestamp > maxAge) {
        console.log(`Cached data for ${key} is too old`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Clear cache
  public async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(STORAGE_KEYS.CACHED_DATA));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cleared ${cacheKeys.length} cached items`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Clear queue
  public async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('Offline queue cleared');
  }

  // Get last sync time
  public async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();

// React Hook for offline mode
export const useOfflineMode = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: null,
    isInternetReachable: null,
    type: null,
  });
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    // Initial network status
    NetInfo.fetch().then((state) => {
      setNetworkStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Listen to network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Update queue size periodically
    const interval = setInterval(() => {
      setQueueSize(offlineManager.getQueueSize());
    }, 1000);

    // Get last sync time
    offlineManager.getLastSyncTime().then(setLastSyncTime);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      await offlineManager.syncQueue();
      const syncTime = await offlineManager.getLastSyncTime();
      setLastSyncTime(syncTime);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const addToQueue = useCallback(
    async (type: OperationType, entity: string, data: any) => {
      await offlineManager.addToQueue(type, entity, data);
      setQueueSize(offlineManager.getQueueSize());
    },
    []
  );

  const clearQueue = useCallback(async () => {
    await offlineManager.clearQueue();
    setQueueSize(0);
  }, []);

  return {
    isOnline: networkStatus.isConnected && networkStatus.isInternetReachable,
    networkStatus,
    queueSize,
    isSyncing,
    lastSyncTime,
    syncNow,
    addToQueue,
    clearQueue,
  };
};

export default offlineManager;
