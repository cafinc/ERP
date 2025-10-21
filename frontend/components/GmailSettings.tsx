import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import api from '../utils/api';

// Required for OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

interface GmailConnection {
  id: string;
  email_address: string;
  is_shared: boolean;
  connected_at: string;
  last_synced: string | null;
}

export default function GmailSettings() {
  const [connections, setConnections] = useState<GmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      const response = await api.get('/gmail/status');
      setConnections(response.data.connections || []);
    } catch (error: any) {
      console.error('Error fetching Gmail status:', error);
      if (error.response?.status === 401) {
        setAuthError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      console.log('=== Starting Gmail connection ===');
      console.log('Fetching authorization URL from backend...');
      
      const response = await api.get('/gmail/connect');
      console.log('Backend response:', response.data);
      
      const authUrl = response.data.authorization_url;
      console.log('Authorization URL:', authUrl);
      
      if (!authUrl) {
        throw new Error('No authorization URL received from backend');
      }
      
      console.log('Opening OAuth URL in WebBrowser...');
      
      // Open OAuth URL using WebBrowser for proper redirect handling
      const result = await WebBrowser.openAuthSessionAsync(authUrl);
      
      console.log('WebBrowser result:', result);
      
      if (result.type === 'success') {
        Alert.alert('Success', 'Gmail account connected! Refreshing...');
        setTimeout(() => {
          fetchStatus();
        }, 2000);
      } else if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'Gmail connection was cancelled');
      } else if (result.type === 'dismiss') {
        console.log('Browser dismissed');
      }
    } catch (error: any) {
      console.error('=== Error connecting Gmail ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Unknown error';
      if (error.response) {
        errorMessage = error.response.data?.detail || error.response.statusText || error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', `Failed to connect Gmail: ${errorMessage}`);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await api.post('/gmail/sync');
      Alert.alert('Success', response.data.message);
      await fetchStatus();
    } catch (error) {
      console.error('Error syncing Gmail:', error);
      Alert.alert('Error', 'Failed to sync emails. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (connectionId: string, email: string) => {
    Alert.alert(
      'Disconnect Gmail',
      `Are you sure you want to disconnect ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/gmail/disconnect/${connectionId}`);
              Alert.alert('Success', 'Gmail account disconnected');
              await fetchStatus();
            } catch (error) {
              console.error('Error disconnecting Gmail:', error);
              Alert.alert('Error', 'Failed to disconnect. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="mail" size={24} color={Colors.primary} />
          <Text style={styles.title}>Gmail Integration</Text>
        </View>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (authError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="mail" size={24} color={Colors.primary} />
          <Text style={styles.title}>Gmail Integration</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Please log in to connect Gmail</Text>
          <Text style={styles.errorSubtext}>
            You need to be authenticated to use Gmail integration
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="mail" size={24} color={Colors.primary} />
        <Text style={styles.title}>Gmail Integration</Text>
      </View>

      <Text style={styles.description}>
        Connect your Gmail account to view and manage emails in the Communication Center.
      </Text>

      {connections.length === 0 ? (
        <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
          <Ionicons name="add-circle" size={20} color="#ffffff" />
          <Text style={styles.connectButtonText}>Connect Gmail</Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Connected Accounts */}
          {connections.map((conn) => (
            <View key={conn.id} style={styles.connectionCard}>
              <View style={styles.connectionInfo}>
                <View style={styles.emailRow}>
                  <Ionicons 
                    name={conn.is_shared ? "people" : "person"} 
                    size={20} 
                    color={conn.is_shared ? Colors.primary : "#10b981"} 
                  />
                  <Text style={styles.emailText}>{conn.email_address}</Text>
                  {conn.is_shared && (
                    <View style={styles.sharedBadge}>
                      <Text style={styles.sharedBadgeText}>SHARED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.connectedText}>
                  Connected: {new Date(conn.connected_at).toLocaleDateString()}
                </Text>
                {conn.last_synced && (
                  <Text style={styles.syncedText}>
                    Last synced: {new Date(conn.last_synced).toLocaleString()}
                  </Text>
                )}
              </View>
              {!conn.is_shared && (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => handleDisconnect(conn.id, conn.email_address)}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.syncButton} 
              onPress={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="sync" size={18} color="#ffffff" />
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.addButton} onPress={handleConnect}>
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Another Account</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  connectionInfo: {
    flex: 1,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sharedBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sharedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  connectedText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  syncedText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  disconnectButton: {
    padding: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
