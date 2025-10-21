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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';
import api from '../../utils/api';

interface IntegrationStatus {
  service: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  connectionInfo?: any;
  features: string[];
  settingsRoute?: string;
}

export default function GoogleIntegrationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    {
      service: 'gmail',
      name: 'Gmail',
      icon: 'mail',
      description: 'Access and manage your Gmail emails directly in the app',
      connected: false,
      features: [
        'Read and send emails',
        'Email synchronization',
        'Label management',
        'Mark as read/unread',
      ],
      settingsRoute: '/settings/email-config',
    },
    {
      service: 'tasks',
      name: 'Google Tasks',
      icon: 'checkmark-done',
      description: 'Sync your project tasks with Google Tasks',
      connected: false,
      features: [
        'Two-way task sync',
        'Project task lists',
        'Auto-sync every 15 minutes',
        'Access from any device',
      ],
      settingsRoute: '/settings/google-tasks',
    },
    {
      service: 'drive',
      name: 'Google Drive',
      icon: 'cloud',
      description: 'Store and access files in Google Drive',
      connected: false,
      features: [
        'File storage',
        'Document sharing',
        'Automatic backups',
        'Team collaboration',
      ],
    },
    {
      service: 'calendar',
      name: 'Google Calendar',
      icon: 'calendar',
      description: 'Sync dispatch schedules with Google Calendar',
      connected: false,
      features: [
        'Schedule synchronization',
        'Event reminders',
        'Team calendars',
        'Availability tracking',
      ],
    },
    {
      service: 'contacts',
      name: 'Google Contacts',
      icon: 'people',
      description: 'Sync customer contacts with Google Contacts',
      connected: false,
      features: [
        'Contact synchronization',
        'Customer information backup',
        'Cross-device access',
        'Contact groups',
      ],
    },
  ]);

  useEffect(() => {
    loadAllIntegrations();
  }, []);

  const loadAllIntegrations = async () => {
    try {
      setLoading(true);
      
      // Load Gmail status
      const gmailRes = await api.get('/gmail/status');
      
      // Load Google Tasks status
      const tasksRes = await api.get('/google-tasks/status');
      
      // Update integrations with connection status
      setIntegrations(prev => prev.map(integration => {
        if (integration.service === 'gmail') {
          return {
            ...integration,
            connected: gmailRes.data.connected,
            connectionInfo: gmailRes.data,
          };
        }
        if (integration.service === 'tasks') {
          return {
            ...integration,
            connected: tasksRes.data.connected,
            connectionInfo: tasksRes.data,
          };
        }
        return integration;
      }));
      
    } catch (error: any) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (service: string) => {
    try {
      let endpoint = '';
      if (service === 'gmail') {
        endpoint = '/gmail/connect';
      } else if (service === 'tasks') {
        endpoint = '/google-tasks/connect';
      } else {
        Alert.alert('Coming Soon', `${service} integration will be available soon!`);
        return;
      }

      const res = await api.get(endpoint);
      if (res.data.authorization_url) {
        if (Platform.OS === 'web') {
          const width = 600;
          const height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          
          const authWindow = window.open(
            res.data.authorization_url,
            `Google ${service} Authorization`,
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
          );
          
          const pollTimer = setInterval(() => {
            if (authWindow?.closed) {
              clearInterval(pollTimer);
              setTimeout(() => {
                loadAllIntegrations();
              }, 1000);
            }
          }, 500);
        } else {
          await Linking.openURL(res.data.authorization_url);
          Alert.alert(
            'Authorization',
            'Please complete the authorization in your browser, then return to this app.',
            [{ text: 'OK', onPress: () => loadAllIntegrations() }]
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to initiate ${service} connection`);
      console.error('Connect error:', error);
    }
  };

  const handleDisconnect = (service: string, name: string) => {
    Alert.alert(
      `Disconnect ${name}`,
      `Are you sure you want to disconnect ${name}? Your local data will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              let endpoint = '';
              if (service === 'gmail') {
                // Gmail requires connection ID, get it from connections
                const gmailStatus = integrations.find(i => i.service === 'gmail');
                const connectionId = gmailStatus?.connectionInfo?.connections?.[0]?.id;
                if (connectionId) {
                  endpoint = `/gmail/disconnect/${connectionId}`;
                } else {
                  Alert.alert('Error', 'No connection found');
                  return;
                }
              } else if (service === 'tasks') {
                endpoint = '/google-tasks/disconnect';
              }

              await api.post(endpoint);
              Alert.alert('Success', `${name} disconnected`);
              await loadAllIntegrations();
            } catch (error) {
              Alert.alert('Error', `Failed to disconnect ${name}`);
            }
          },
        },
      ]
    );
  };

  const handleSync = async (service: string, name: string) => {
    try {
      let endpoint = '';
      if (service === 'gmail') {
        endpoint = '/gmail/sync';
      } else if (service === 'tasks') {
        endpoint = '/google-tasks/sync';
      }

      const res = await api.post(endpoint);
      Alert.alert('Success', `${name} synced successfully`);
      await loadAllIntegrations();
    } catch (error) {
      Alert.alert('Error', `Failed to sync ${name}`);
    }
  };

  const renderIntegrationCard = (integration: IntegrationStatus) => {
    const { service, name, icon, description, connected, connectionInfo, features, settingsRoute } = integration;
    
    return (
      <View key={service} style={styles.integrationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, connected && styles.iconContainerConnected]}>
              <Ionicons 
                name={icon as any} 
                size={32} 
                color={connected ? Colors.primary : Colors.textSecondary} 
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.integrationName}>{name}</Text>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: connected ? Colors.success : Colors.textSecondary }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: connected ? Colors.success : Colors.textSecondary }
                ]}>
                  {connected ? 'Connected' : 'Not Connected'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.description}>{description}</Text>

        {/* Connection Info */}
        {connected && connectionInfo && (
          <View style={styles.connectionInfo}>
            {connectionInfo.connections && connectionInfo.connections.length > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  {connectionInfo.connections[0].email_address}
                </Text>
              </View>
            )}
            {connectionInfo.last_synced && (
              <View style={styles.infoRow}>
                <Ionicons name="sync-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  Last synced: {new Date(connectionInfo.last_synced).toLocaleString()}
                </Text>
              </View>
            )}
            {connectionInfo.connected_at && !connectionInfo.connections && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  Connected: {new Date(connectionInfo.connected_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Features:</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={connected ? Colors.success : Colors.textSecondary} 
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {connected ? (
            <>
              {(service === 'gmail' || service === 'tasks') && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.syncButton]}
                  onPress={() => handleSync(service, name)}
                >
                  <Ionicons name="sync" size={18} color={Colors.primary} />
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                </TouchableOpacity>
              )}
              {settingsRoute && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.settingsButton]}
                  onPress={() => router.push(settingsRoute as any)}
                >
                  <Ionicons name="settings-outline" size={18} color={Colors.textPrimary} />
                  <Text style={styles.settingsButtonText}>Settings</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.disconnectButton]}
                onPress={() => handleDisconnect(service, name)}
              >
                <Ionicons name="unlink" size={18} color={Colors.error} />
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.connectButton]}
              onPress={() => handleConnect(service)}
            >
              <Ionicons name="link" size={18} color="#fff" />
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const connectedCount = integrations.filter(i => i.connected).length;
  const totalCount = integrations.length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading integrations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="logo-google" size={40} color="#4285F4" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Google Workspace</Text>
            <Text style={styles.subtitle}>
              {connectedCount} of {totalCount} services connected
            </Text>
          </View>
        </View>
        
        {connectedCount < totalCount && (
          <View style={styles.headerBanner}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.bannerText}>
              Connect more Google services to unlock powerful integrations
            </Text>
          </View>
        )}
      </View>

      {/* Overview Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{connectedCount}</Text>
          <Text style={styles.statLabel}>Connected</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCount - connectedCount}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{integrations.filter(i => i.connected && i.connectionInfo?.last_synced).length}</Text>
          <Text style={styles.statLabel}>Active Sync</Text>
        </View>
      </View>

      {/* Integrations List */}
      <View style={styles.integrationsList}>
        <Text style={styles.sectionTitle}>Available Integrations</Text>
        {integrations.map(renderIntegrationCard)}
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>💡 About Google Integrations</Text>
        <Text style={styles.helpText}>
          Connect your Google Workspace services to seamlessly integrate your work across platforms. 
          All connections use secure OAuth 2.0 authentication and can be disconnected at any time.
        </Text>
        <Text style={styles.helpText}>
          Your data is never stored on our servers - we only access what's necessary to provide the 
          integration features you use.
        </Text>
      </View>
    </ScrollView>
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
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.infoLight,
    borderRadius: 8,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.info,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  integrationsList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  integrationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerConnected: {
    backgroundColor: Colors.primaryLight,
  },
  headerInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  connectionInfo: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  featuresSection: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    flex: 1,
    minWidth: '100%',
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  syncButton: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  settingsButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  disconnectButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  helpSection: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 32,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
});
