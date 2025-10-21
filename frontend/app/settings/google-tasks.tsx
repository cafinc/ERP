import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';
import api from '../../utils/api';

export default function GoogleTasksSettings() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/google-tasks/status');
      setConnected(res.data.connected);
      setConnectionInfo(res.data);
    } catch (error) {
      console.error('Error loading Google Tasks status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await api.get('/google-tasks/connect');
      if (res.data.authorization_url) {
        if (Platform.OS === 'web') {
          // Open in new window
          const width = 600;
          const height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          
          const authWindow = window.open(
            res.data.authorization_url,
            'Google Tasks Authorization',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
          );
          
          // Poll for window closure
          const pollTimer = setInterval(() => {
            if (authWindow?.closed) {
              clearInterval(pollTimer);
              // Reload status after a delay to allow callback to complete
              setTimeout(() => {
                loadConnectionStatus();
              }, 1000);
            }
          }, 500);
        } else {
          await Linking.openURL(res.data.authorization_url);
          Alert.alert(
            'Authorization',
            'Please complete the authorization in your browser, then return to this app.',
            [{ text: 'OK', onPress: () => loadConnectionStatus() }]
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to initiate Google Tasks connection');
      console.error('Connect error:', error);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Google Tasks',
      'Are you sure you want to disconnect your Google Tasks account? Your local tasks will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/google-tasks/disconnect');
              setConnected(false);
              setConnectionInfo(null);
              Alert.alert('Success', 'Google Tasks disconnected');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect Google Tasks');
            }
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/google-tasks/sync');
      Alert.alert(
        'Sync Complete',
        `Synced ${res.data.synced} tasks from ${res.data.task_lists} lists`
      );
      await loadConnectionStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to sync tasks');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Tasks Integration</Text>
      <Text style={styles.description}>
        Connect your Google Tasks account to enable two-way sync between your project tasks and Google Tasks.
      </Text>

      {connected ? (
        <View style={styles.connectedCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
          </View>

          {connectionInfo?.connected_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Connected Since:</Text>
              <Text style={styles.infoValue}>
                {new Date(connectionInfo.connected_at).toLocaleDateString()}
              </Text>
            </View>
          )}

          {connectionInfo?.last_synced && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Synced:</Text>
              <Text style={styles.infoValue}>
                {new Date(connectionInfo.last_synced).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, styles.syncButton]}
              onPress={handleSync}
              disabled={syncing}
            >
              <Ionicons name="sync" size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.disconnectButton]}
              onPress={handleDisconnect}
            >
              <Ionicons name="unlink" size={20} color={Colors.error} />
              <Text style={[styles.buttonText, { color: Colors.error }]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.disconnectedCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-google" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.disconnectedText}>
            Connect your Google Tasks account to sync tasks across devices and integrate with your workflow.
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle-outline" size={24} color={Colors.success} />
              <Text style={styles.featureText}>Two-way sync with Google Tasks</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle-outline" size={24} color={Colors.success} />
              <Text style={styles.featureText}>Create tasks from projects</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle-outline" size={24} color={Colors.success} />
              <Text style={styles.featureText}>Auto-sync every 15 minutes</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle-outline" size={24} color={Colors.success} />
              <Text style={styles.featureText}>Access tasks from any device</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.connectButton]}
            onPress={handleConnect}
          >
            <Ionicons name="link" size={20} color="#fff" />
            <Text style={styles.buttonText}>Connect Google Tasks</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>How it works:</Text>
        <View style={styles.helpItem}>
          <Text style={styles.helpNumber}>1.</Text>
          <Text style={styles.helpText}>
            Connect your Google account to authorize access to Google Tasks
          </Text>
        </View>
        <View style={styles.helpItem}>
          <Text style={styles.helpNumber}>2.</Text>
          <Text style={styles.helpText}>
            Create tasks in projects, and they'll automatically sync to Google Tasks
          </Text>
        </View>
        <View style={styles.helpItem}>
          <Text style={styles.helpNumber}>3.</Text>
          <Text style={styles.helpText}>
            Update task status anywhere - changes sync automatically
          </Text>
        </View>
        <View style={styles.helpItem}>
          <Text style={styles.helpNumber}>4.</Text>
          <Text style={styles.helpText}>
            View all tasks (personal & project) in one unified view
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 24,
  },
  connectedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  statusHeader: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.success,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  disconnectedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  disconnectedText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  features: {
    width: '100%',
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    width: '100%',
  },
  syncButton: {
    backgroundColor: Colors.primary,
  },
  disconnectButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  helpSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  helpNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 12,
    width: 20,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
