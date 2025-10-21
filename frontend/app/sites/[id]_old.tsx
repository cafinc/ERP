import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { Site, Customer, FormTemplate } from '../../types';
import AttachedForms from '../../components/AttachedForms';

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams();
  const [site, setSite] = useState<Site | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [showFormPicker, setShowFormPicker] = useState(false);

  useEffect(() => {
    fetchSiteDetails();
  }, [id]);

  const fetchSiteDetails = async () => {
    try {
      const [siteRes, templatesRes] = await Promise.all([
        api.get(`/sites/${id}`),
        api.get('/form-templates?form_type=service_tracking'),
      ]);
      
      const siteData: Site = siteRes.data;
      setSite(siteData);
      setFormTemplates(templatesRes.data);

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

  const handleAddForm = () => {
    if (formTemplates.length === 0) {
      Alert.alert('No Forms Available', 'No service tracking forms have been created yet.');
      return;
    }

    // Show form template picker
    const templateOptions = formTemplates.map(t => ({ text: t.name, onPress: () => navigateToForm(t.id!) }));
    templateOptions.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' } as any);

    Alert.alert('Select Form Type', 'Choose a form to fill out for this site', templateOptions as any);
  };

  const navigateToForm = (templateId: string) => {
    router.push({
      pathname: '/forms/fill-form',
      params: { 
        templateId, 
        siteId: id,
      },
    });
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
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Site Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>{site.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{customer?.name || 'Unknown'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{site.site_type.replace('_', ' ')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{site.location.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Coordinates:</Text>
            <Text style={styles.value}>
              {site.location.latitude.toFixed(6)}, {site.location.longitude.toFixed(6)}
            </Text>
          </View>

          {site.area_size && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Area:</Text>
              <Text style={styles.value}>{site.area_size} sq ft</Text>
            </View>
          )}

          {site.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{site.notes}</Text>
            </View>
          )}
        </View>

        {/* Attached Forms */}
        <AttachedForms
          entityType="site"
          entityId={site.id!}
          entityName={site.name}
          formType="service_tracking"
          onAddForm={handleAddForm}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray600,
    width: 100,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});
