import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { Colors } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';

interface GeofenceLog {
  id: string;
  crew_name: string;
  site_name: string;
  event_type: 'entry' | 'exit';
  timestamp: string;
  manual_click: boolean;
}

export default function GeofenceScreen() {
  const [logs, setLogs] = useState<GeofenceLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { isAdmin, isCrew } = useAuth();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/geofence-logs?limit=50');
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching geofence logs:', error);
      Alert.alert('Error', 'Failed to load geofence logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Geofence</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={Colors.textSecondary} />
          <Text style={styles.accessDeniedText}>
            Admin access required
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading geofence logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Geofence Events</Text>
          <TouchableOpacity
            onPress={fetchLogs}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Recent site entry/exit events</Text>
      </View>

      {/* Events List */}
      <ScrollView style={styles.list}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="radio-button-on-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No geofence events yet</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View
              key={log.id}
              style={[
                styles.logCard,
                { borderLeftColor: log.event_type === 'entry' ? '#10b981' : '#f59e0b' },
              ]}
            >
              <View
                style={[
                  styles.eventIcon,
                  {
                    backgroundColor:
                      log.event_type === 'entry' ? '#10b98120' : '#f59e0b20',
                  },
                ]}
              >
                <Ionicons
                  name={
                    log.event_type === 'entry'
                      ? 'arrow-down-circle'
                      : 'arrow-up-circle'
                  }
                  size={28}
                  color={log.event_type === 'entry' ? '#10b981' : '#f59e0b'}
                />
              </View>

              <View style={styles.logInfo}>
                <View style={styles.logHeader}>
                  <Text style={styles.eventType}>
                    {log.event_type === 'entry' ? 'Entered' : 'Exited'} Geofence
                  </Text>
                  {log.manual_click && (
                    <View style={styles.manualBadge}>
                      <Text style={styles.manualText}>Manual</Text>
                    </View>
                  )}
                </View>

                <View style={styles.logDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{log.crew_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{log.site_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{formatTime(log.timestamp)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
  },
  list: {
    flex: 1,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  eventIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  manualBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
  },
  manualText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  logDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
