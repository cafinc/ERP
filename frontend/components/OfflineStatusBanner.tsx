import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useOfflineMode } from '../utils/offlineManager';

export const OfflineStatusBanner: React.FC = () => {
  const { isOnline, queueSize, isSyncing, lastSyncTime, syncNow } = useOfflineMode();

  if (isOnline && queueSize === 0) {
    return null; // Don't show banner when online with empty queue
  }

  return (
    <View style={[styles.banner, isOnline ? styles.syncing : styles.offline]}>
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={styles.iconContainer}>
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View
              style={[
                styles.statusDot,
                isOnline ? styles.dotOnline : styles.dotOffline,
              ]}
            />
          )}
        </View>

        {/* Status Text */}
        <View style={styles.textContainer}>
          {isSyncing ? (
            <Text style={styles.text}>Syncing {queueSize} changes...</Text>
          ) : !isOnline ? (
            <>
              <Text style={styles.text}>Offline Mode</Text>
              {queueSize > 0 && (
                <Text style={styles.subtext}>
                  {queueSize} change{queueSize > 1 ? 's' : ''} pending
                </Text>
              )}
            </>
          ) : queueSize > 0 ? (
            <>
              <Text style={styles.text}>Ready to sync</Text>
              <Text style={styles.subtext}>
                {queueSize} change{queueSize > 1 ? 's' : ''} pending
              </Text>
            </>
          ) : null}
        </View>

        {/* Sync Button */}
        {isOnline && queueSize > 0 && !isSyncing && (
          <TouchableOpacity style={styles.syncButton} onPress={syncNow}>
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Last Sync Time */}
      {lastSyncTime && (
        <Text style={styles.lastSync}>
          Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  offline: {
    backgroundColor: '#6B7280', // Gray
  },
  syncing: {
    backgroundColor: '#3B82F6', // Blue
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotOnline: {
    backgroundColor: '#10B981', // Green
  },
  dotOffline: {
    backgroundColor: '#EF4444', // Red
  },
  textContainer: {
    flex: 1,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lastSync: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 4,
  },
});

export default OfflineStatusBanner;
