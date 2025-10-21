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

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  issue_date: string;
  due_date: string;
  payment_terms: string;
}

export default function InvoicesListScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      Alert.alert('Error', 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return Colors.warning;
      case 'partially_paid': return '#3b82f6';
      case 'paid': return Colors.success;
      case 'overdue': return Colors.error;
      default: return Colors.gray400;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unpaid': return 'time';
      case 'partially_paid': return 'trending-up';
      case 'paid': return 'checkmark-circle';
      case 'overdue': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const filterInvoices = () => {
    if (filter === 'all') return invoices;
    return invoices.filter(inv => inv.status === filter);
  };

  const filteredInvoices = filterInvoices();
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.amount_due, 0);

  const content = (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="cash" size={28} color={Colors.white} />
            <Text style={[styles.statNumber, { color: Colors.white }]}>
              ${totalRevenue.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: Colors.white }]}>Revenue</Text>
          </View>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <Ionicons name="hourglass" size={28} color={Colors.white} />
            <Text style={[styles.statNumber, { color: Colors.white }]}>
              ${totalOutstanding.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: Colors.white }]}>Outstanding</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All' },
              { key: 'unpaid', label: 'Unpaid' },
              { key: 'partially_paid', label: 'Partial' },
              { key: 'paid', label: 'Paid' },
              { key: 'overdue', label: 'Overdue' },
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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Invoices ({filteredInvoices.length})</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              // TODO: Create invoice screen
              Alert.alert('Coming Soon', 'Invoice creation will be implemented');
            }}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.createButtonText}>New Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* Invoices List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredInvoices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptyText}>
              Create invoices from projects or add manually
            </Text>
          </View>
        ) : (
          filteredInvoices.map((invoice) => (
            <TouchableOpacity
              key={invoice.id}
              style={styles.invoiceCard}
              onPress={() => router.push(`/invoices/${invoice.id}`)}
            >
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceLeft}>
                  <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                  <Text style={styles.customerName}>{invoice.customer_name}</Text>
                </View>
                <View style={styles.invoiceRight}>
                  <Text style={styles.totalAmount}>${invoice.total_amount.toFixed(2)}</Text>
                  {invoice.amount_paid > 0 && (
                    <Text style={styles.paidAmount}>Paid: ${invoice.amount_paid.toFixed(2)}</Text>
                  )}
                </View>
              </View>

              <View style={styles.invoiceFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(invoice.status) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(invoice.status)}
                    size={14}
                    color={getStatusColor(invoice.status)}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(invoice.status) },
                    ]}
                  >
                    {invoice.status.replace('_', ' ').charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Text>
                </View>
                <View style={styles.dates}>
                  <Text style={styles.dateLabel}>Due: </Text>
                  <Text style={styles.dateValue}>
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </Text>
                </View>
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
  statCardPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statCardWarning: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
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
  },
  invoiceCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  paidAmount: {
    fontSize: 12,
    color: Colors.success,
  },
  invoiceFooter: {
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
  dates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dateValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});