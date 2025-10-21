import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { Site, Customer } from '../../types';

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams();
  const [site, setSite] = useState<Site | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  useEffect(() => {
    fetchSiteDetails();
  }, [id]);

  const fetchSiteDetails = async () => {
    try {
      const siteRes = await api.get(`/sites/${id}`);
      const siteData: Site = siteRes.data;
      setSite(siteData);

      // Fetch customer details
      const customerRes = await api.get(`/customers/${siteData.customer_id}`);
      setCustomer(customerRes.data);
    } catch (error) {
      console.error('Error fetching site details:', error);
      Alert.alert('Error', 'Failed to load site details');
    } finally {
      setLoading(false);
    }
  };

  const handleCallPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMaps = () => {
    if (site) {
      const url = `https://maps.google.com/?q=${site.location.latitude},${site.location.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleEdit = () => {
    setShowActionsMenu(false);
    router.push({
      pathname: '/sites/create',
      params: { 
        editId: id,
        ...site,
      },
    });
  };

  const handleDuplicate = () => {
    setShowActionsMenu(false);
    Alert.alert(
      'Duplicate Site',
      `Create a copy of ${site?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: async () => {
            try {
              const duplicateData = {
                ...site,
                name: `${site?.name} (Copy)`,
                id: undefined,
                _id: undefined,
                created_at: undefined,
                updated_at: undefined,
              };
              const response = await api.post('/sites', duplicateData);
              Alert.alert('Success', 'Site duplicated successfully', [
                { 
                  text: 'View Copy', 
                  onPress: () => router.replace(`/sites/${response.data.id || response.data._id}`)
                },
                { text: 'Stay Here', style: 'cancel' }
              ]);
            } catch (error) {
              console.error('Error duplicating site:', error);
              Alert.alert('Error', 'Failed to duplicate site');
            }
          },
        },
      ]
    );
  };

  const handleExport = () => {
    setShowActionsMenu(false);
    try {
      const exportData = {
        site: site,
        customer: customer,
        exportDate: new Date().toISOString(),
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `site_${site?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Site data exported successfully');
      } else {
        Alert.alert(
          'Export Data',
          'Site data has been prepared. In a production app, this would use the Share API.',
          [{ text: 'OK' }]
        );
        console.log('Export data:', jsonString);
      }
    } catch (error) {
      console.error('Error exporting site:', error);
      Alert.alert('Error', 'Failed to export site data');
    }
  };

  const handleArchive = () => {
    setShowActionsMenu(false);
    Alert.alert(
      'Archive Site',
      `Are you sure you want to archive ${site?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              await api.patch(`/sites/${id}`, { archived: true });
              Alert.alert('Success', 'Site archived successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error archiving site:', error);
              Alert.alert('Error', 'Failed to archive site');
            }
          },
        },
      ]
    );
  };

  const handleUnarchive = () => {
    setShowActionsMenu(false);
    try {
      api.patch(`/sites/${id}`, { archived: false });
      Alert.alert('Success', 'Site restored successfully');
      fetchSiteDetails();
    } catch (error) {
      console.error('Error unarchiving site:', error);
      Alert.alert('Error', 'Failed to restore site');
    }
  };

  const handleDelete = () => {
    setShowActionsMenu(false);
    Alert.alert(
      'Delete Site',
      'Are you sure you want to delete this site? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/sites/${id}`);
              Alert.alert('Success', 'Site deleted', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete site');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!site) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Details</Text>
        <TouchableOpacity onPress={() => setShowActionsMenu(true)} style={styles.editButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#4682B4" />
        </TouchableOpacity>
      </View>

      {/* Actions Menu Modal */}
      <Modal
        visible={showActionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={styles.actionsMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={handleEdit}>
              <Ionicons name="create-outline" size={22} color={Colors.primary} />
              <Text style={styles.actionText}>Edit Site</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionItem} onPress={handleDuplicate}>
              <Ionicons name="copy-outline" size={22} color={Colors.primary} />
              <Text style={styles.actionText}>Duplicate Site</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionItem} onPress={handleExport}>
              <Ionicons name="download-outline" size={22} color={Colors.primary} />
              <Text style={styles.actionText}>Export Data</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {site?.archived ? (
              <TouchableOpacity style={styles.actionItem} onPress={handleUnarchive}>
                <Ionicons name="archive-outline" size={22} color="#10b981" />
                <Text style={[styles.actionText, { color: '#10b981' }]}>Restore Site</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionItem} onPress={handleArchive}>
                <Ionicons name="archive-outline" size={22} color="#f59e0b" />
                <Text style={[styles.actionText, { color: '#f59e0b' }]}>Archive Site</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete Site</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => setShowActionsMenu(false)}
            >
              <Ionicons name="close-outline" size={22} color={Colors.gray500} />
              <Text style={[styles.actionText, { color: Colors.gray500 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Site Name & Reference */}
        <View style={styles.titleSection}>
          <View style={styles.iconLarge}>
            <Ionicons name="location" size={48} color="#4682B4" />
          </View>
          <Text style={styles.siteName}>{site.name}</Text>
          {site.site_reference && (
            <View style={styles.refBadgeLarge}>
              <Text style={styles.refBadgeTextLarge}>#{site.site_reference}</Text>
            </View>
          )}
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#6b7280" />
            <Text style={styles.sectionTitle}>Customer</Text>
          </View>
          <TouchableOpacity
            style={styles.customerCard}
            onPress={() => router.push(`/customers/${site.customer_id}`)}
          >
            <Text style={styles.customerName}>{customer?.name || 'Unknown'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color="#6b7280" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Site Type</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{site.site_type.replace('_', ' ')}</Text>
              </View>
            </View>
            {site.area_size && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Area Size</Text>
                <Text style={styles.value}>{site.area_size} sq ft</Text>
              </View>
            )}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map" size={20} color="#6b7280" />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.address}>{site.location.address}</Text>
            <Text style={styles.coordinates}>
              {site.location.latitude.toFixed(6)}, {site.location.longitude.toFixed(6)}
            </Text>
            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
              <Ionicons name="navigate" size={18} color="#ffffff" />
              <Text style={styles.mapButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Access & Security */}
        {site.access_fields && site.access_fields.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="key" size={20} color="#6b7280" />
              <Text style={styles.sectionTitle}>Site Access & Security</Text>
            </View>
            <View style={styles.card}>
              {site.access_fields.map((field, index) => (
                <View key={index} style={styles.accessField}>
                  <View style={styles.accessFieldHeader}>
                    <Ionicons 
                      name={
                        field.field_type === 'code' ? 'keypad' :
                        field.field_type === 'phone' ? 'call' : 'information-circle'
                      } 
                      size={18} 
                      color="#4682B4" 
                    />
                    <Text style={styles.accessFieldName}>{field.field_name}</Text>
                  </View>
                  {field.field_type === 'phone' ? (
                    <TouchableOpacity
                      style={styles.phoneButton}
                      onPress={() => handleCallPhone(field.field_value)}
                    >
                      <Text style={styles.phoneButtonText}>{field.field_value}</Text>
                      <Ionicons name="call" size={16} color="#10b981" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.accessFieldValue}>{field.field_value}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Services */}
        {site.services && site.services.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="construct" size={20} color="#6b7280" />
              <Text style={styles.sectionTitle}>Configured Services</Text>
            </View>
            {site.services.map((service, index) => (
              <View key={index} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{service.service_name}</Text>
                  <Text style={styles.serviceCost}>${service.cost.toFixed(2)}</Text>
                </View>
                <View style={styles.serviceDetails}>
                  <View style={styles.serviceDetailItem}>
                    <Text style={styles.serviceDetailLabel}>Type:</Text>
                    <Text style={styles.serviceDetailValue}>{service.service_type}</Text>
                  </View>
                  <View style={styles.serviceDetailItem}>
                    <Text style={styles.serviceDetailLabel}>Unit:</Text>
                    <Text style={styles.serviceDetailValue}>{service.unit_type.replace('_', ' ')}</Text>
                  </View>
                  {service.trigger_type && (
                    <View style={styles.serviceDetailItem}>
                      <Text style={styles.serviceDetailLabel}>Trigger:</Text>
                      <Text style={styles.serviceDetailValue}>
                        {service.trigger_type === 'Custom' && service.trigger_value 
                          ? service.trigger_value 
                          : service.trigger_type}
                      </Text>
                    </View>
                  )}
                </View>
                {service.notes && (
                  <Text style={styles.serviceNotes}>{service.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {(site.crew_notes || site.internal_notes) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#6b7280" />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            {site.crew_notes && (
              <View style={[styles.card, styles.notesCard]}>
                <View style={styles.notesBadge}>
                  <Ionicons name="people" size={14} color="#1e40af" />
                  <Text style={styles.notesBadgeText}>Crew & Customer</Text>
                </View>
                <Text style={styles.notesText}>{site.crew_notes}</Text>
              </View>
            )}
            {site.internal_notes && (
              <View style={[styles.card, styles.notesCard]}>
                <View style={[styles.notesBadge, { backgroundColor: '#f3f4f6' }]}>
                  <Ionicons name="lock-closed" size={14} color="#6b7280" />
                  <Text style={[styles.notesBadgeText, { color: '#6b7280' }]}>Admin Only</Text>
                </View>
                <Text style={styles.notesText}>{site.internal_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={styles.deleteButtonText}>Delete Site</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  editButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f1f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  siteName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  refBadgeLarge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  refBadgeTextLarge: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: '#d4e5f4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 13,
    color: '#3a6d94',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  address: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  coordinates: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  accessField: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  accessFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  accessFieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  accessFieldValue: {
    fontSize: 15,
    color: '#111827',
    marginLeft: 26,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 26,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  phoneButtonText: {
    fontSize: 15,
    color: '#10b981',
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  serviceCost: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    gap: 6,
  },
  serviceDetailLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  serviceDetailValue: {
    fontSize: 13,
    color: '#111827',
    textTransform: 'capitalize',
  },
  serviceNotes: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  notesCard: {
    marginBottom: 12,
  },
  notesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  notesBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
  },
  notesText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 22,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
});
