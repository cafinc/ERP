import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';

interface Estimate {
  id: string;
  estimate_number: string;
  customer_name: string;
  customer_email: string;
  line_items: any[];
  subtotal: number;
  discount_amount: number;
  pre_tax_total: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  sent_at?: string;
  accepted_at?: string;
  expiration_date?: string;
  terms_and_conditions?: string;
  notes?: string;
  project_id?: string;
}

export default function EstimateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchEstimate();
  }, [id]);

  const fetchEstimate = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/estimates/${id}`);
      setEstimate(response.data);
    } catch (error) {
      console.error('Error fetching estimate:', error);
      Alert.alert('Error', 'Failed to load estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEstimate = async () => {
    try {
      setSending(true);
      await api.post(`/estimates/${id}/send`);
      Alert.alert('Success', 'Estimate sent to customer!');
      fetchEstimate();
    } catch (error) {
      console.error('Error sending estimate:', error);
      Alert.alert('Error', 'Failed to send estimate');
    } finally {
      setSending(false);
    }
  };

  const handleConvertToProject = async () => {
    if (estimate?.status !== 'accepted') {
      Alert.alert('Cannot Convert', 'Only accepted estimates can be converted to projects');
      return;
    }
    
    try {
      setConverting(true);
      const response = await api.post(`/estimates/${id}/convert-to-project`);
      Alert.alert(
        'Success',
        `Project ${response.data.project_number} created!`,
        [
          { text: 'View Project', onPress: () => router.push(`/projects/${response.data.id}`) },
          { text: 'OK' }
        ]
      );
      fetchEstimate();
    } catch (error) {
      console.error('Error converting estimate:', error);
      Alert.alert('Error', 'Failed to convert estimate');
    } finally {
      setConverting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return Colors.gray400;
      case 'sent': return '#3b82f6';
      case 'viewed': return '#8b5cf6';
      case 'accepted': return Colors.success;
      case 'declined': return Colors.error;
      case 'expired': return Colors.gray500;
      case 'converted': return '#10b981';
      default: return Colors.gray400;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!estimate) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Estimate not found</Text>
      </View>
    );
  }

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{estimate.estimate_number}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(estimate.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(estimate.status) },
              ]}
            >
              {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {estimate.status === 'draft' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSendEstimate}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Send to Customer</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {estimate.status === 'accepted' && !estimate.project_id && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSuccess]}
              onPress={handleConvertToProject}
              disabled={converting}
            >
              {converting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="git-branch" size={18} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Convert to Project</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {estimate.project_id && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonInfo]}
              onPress={() => router.push(`/projects/${estimate.project_id}`)}
            >
              <Ionicons name="folder-open" size={18} color={Colors.white} />
              <Text style={styles.actionButtonText}>View Project</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <Text style={styles.customerName}>{estimate.customer_name}</Text>
            <Text style={styles.customerEmail}>{estimate.customer_email}</Text>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          {estimate.line_items.map((item, index) => (
            <View key={index} style={styles.lineItemCard}>
              <Text style={styles.lineItemDescription}>{item.description}</Text>
              <View style={styles.lineItemDetails}>
                <Text style={styles.lineItemText}>Qty: {item.quantity}</Text>
                <Text style={styles.lineItemText}>@ ${item.unit_price.toFixed(2)}</Text>
                <Text style={styles.lineItemTotal}>${item.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${estimate.subtotal.toFixed(2)}</Text>
            </View>
            {estimate.discount_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={[styles.totalValue, { color: Colors.error }]}>
                  -${estimate.discount_amount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Pre-Tax Total:</Text>
              <Text style={styles.totalValue}>${estimate.pre_tax_total.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (5%):</Text>
              <Text style={styles.totalValue}>${estimate.tax_amount.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={styles.totalLabelFinal}>Total:</Text>
              <Text style={styles.totalValueFinal}>${estimate.total_amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Terms & Conditions */}
        {estimate.terms_and_conditions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <View style={styles.card}>
              <Text style={styles.textContent}>{estimate.terms_and_conditions}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {estimate.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.textContent}>{estimate.notes}</Text>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Created:</Text>
              <Text style={styles.metadataValue}>
                {new Date(estimate.created_at).toLocaleString()}
              </Text>
            </View>
            {estimate.sent_at && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Sent:</Text>
                <Text style={styles.metadataValue}>
                  {new Date(estimate.sent_at).toLocaleString()}
                </Text>
              </View>
            )}
            {estimate.accepted_at && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Accepted:</Text>
                <Text style={styles.metadataValue}>
                  {new Date(estimate.accepted_at).toLocaleString()}
                </Text>
              </View>
            )}
            {estimate.expiration_date && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Expires:</Text>
                <Text style={styles.metadataValue}>
                  {new Date(estimate.expiration_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  if (isWeb) {
    return <WebAdminLayout>{content}</WebAdminLayout>;
  }

  return content;
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
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionButtonSuccess: {
    backgroundColor: Colors.success,
  },
  actionButtonInfo: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  lineItemCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lineItemDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  lineItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  lineItemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  totalsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalRowFinal: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValueFinal: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  textContent: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metadataLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
});