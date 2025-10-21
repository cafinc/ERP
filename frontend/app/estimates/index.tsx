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
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';

interface Estimate {
  id: string;
  estimate_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  expiration_date?: string;
}

export default function EstimatesListScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/estimates');
      setEstimates(response.data);
    } catch (error) {
      console.error('Error fetching estimates:', error);
      Alert.alert('Error', 'Failed to load estimates');
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return 'document-outline';
      case 'sent': return 'send';
      case 'viewed': return 'eye';
      case 'accepted': return 'checkmark-circle';
      case 'declined': return 'close-circle';
      case 'expired': return 'time';
      case 'converted': return 'git-branch';
      default: return 'document';
    }
  };

  const filterEstimates = () => {
    if (filter === 'all') return estimates;
    return estimates.filter(est => est.status === filter);
  };

  const filteredEstimates = filterEstimates();

  const content = (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{estimates.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {estimates.filter(e => e.status === 'sent').length}
            </Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {estimates.filter(e => e.status === 'accepted').length}
            </Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All' },
              { key: 'draft', label: 'Draft' },
              { key: 'sent', label: 'Sent' },
              { key: 'accepted', label: 'Accepted' },
              { key: 'declined', label: 'Declined' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
                onPress={() => setFilter(tab.key)}
              >
                <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Header with Create Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estimates ({filteredEstimates.length})</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/estimates/create')}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.createButtonText}>New Estimate</Text>
          </TouchableOpacity>
        </View>

        {/* Estimates List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredEstimates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No Estimates Found</Text>
            <Text style={styles.emptyText}>
              Create your first estimate to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/estimates/create')}
            >
              <Text style={styles.emptyButtonText}>Create Estimate</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredEstimates.map((estimate) => (
            <TouchableOpacity
              key={estimate.id}
              style={styles.estimateCard}
              onPress={() => router.push(`/estimates/${estimate.id}`)}
            >
              <View style={styles.estimateHeader}>
                <View>
                  <Text style={styles.estimateNumber}>{estimate.estimate_number}</Text>
                  <Text style={styles.customerName}>{estimate.customer_name}</Text>
                </View>
                <View style={styles.estimateRight}>
                  <Text style={styles.amount}>
                    ${estimate.total_amount.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.estimateFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(estimate.status) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(estimate.status)}
                    size={14}
                    color={getStatusColor(estimate.status)}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(estimate.status) },
                    ]}
                  >
                    {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.date}>
                  {new Date(estimate.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  estimateCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  estimateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  estimateRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  estimateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
