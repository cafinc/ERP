import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  avatar?: string;
  status: 'lead' | 'prospect' | 'active' | 'inactive';
  lifetime_value?: number;
  last_contact?: string;
  sites_count?: number;
  active_deals?: number;
}

interface DashboardStats {
  total_customers: number;
  active_customers: number;
  leads: number;
  prospects: number;
  total_revenue: number;
  active_deals: number;
}

export default function CRMScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_customers: 0,
    active_customers: 0,
    leads: 0,
    prospects: 0,
    total_revenue: 0,
    active_deals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchCRMData();
  }, []);

  const fetchCRMData = async () => {
    try {
      setLoading(true);
      
      // Fetch customers
      const customersResponse = await api.get('/customers?active=true');
      const customersData = customersResponse.data || [];
      
      // Calculate stats from customer data
      const activeCustomers = customersData.filter((c: any) => (c.status || 'active') === 'active').length;
      const leads = customersData.filter((c: any) => (c.status || 'active') === 'lead').length;
      const prospects = customersData.filter((c: any) => (c.status || 'active') === 'prospect').length;
      
      setStats({
        total_customers: customersData.length,
        active_customers: activeCustomers,
        leads: leads,
        prospects: prospects,
        total_revenue: 0, // Will be calculated from deals
        active_deals: 0, // Will be calculated from deals
      });
      
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching CRM data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCRMData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead':
        return Colors.warning;
      case 'prospect':
        return '#3b82f6'; // Blue
      case 'active':
        return Colors.success;
      case 'inactive':
        return Colors.gray400;
      default:
        return Colors.gray400;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'lead':
        return 'person-add';
      case 'prospect':
        return 'people';
      case 'active':
        return 'checkmark-circle';
      case 'inactive':
        return 'pause-circle';
      default:
        return 'help-circle';
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(customer => (customer.status || 'active') === selectedStatus);
    }

    return filtered;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const filteredCustomers = filterCustomers();

  const content = (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dashboard Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <Ionicons name="people" size={28} color={Colors.white} />
              <Text style={styles.statNumber}>{stats.total_customers}</Text>
              <Text style={styles.statLabel}>Total Customers</Text>
            </View>
            <View style={[styles.statCard, styles.statCardSuccess]}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.white} />
              <Text style={styles.statNumber}>{stats.active_customers}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="person-add" size={24} color={Colors.warning} />
              <Text style={[styles.statNumber, { color: Colors.warning }]}>
                {stats.leads}
              </Text>
              <Text style={styles.statLabelSecondary}>Leads</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color={'#3b82f6'} />
              <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
                {stats.prospects}
              </Text>
              <Text style={styles.statLabelSecondary}>Prospects</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color={Colors.success} />
              <Text style={[styles.statNumber, { color: Colors.success }]}>
                {stats.active_deals}
              </Text>
              <Text style={styles.statLabelSecondary}>Active Deals</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray400}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filters */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All', count: customers.length },
              { key: 'active', label: 'Active', count: stats.active_customers },
              { key: 'lead', label: 'Leads', count: stats.leads },
              { key: 'prospect', label: 'Prospects', count: stats.prospects },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedStatus === filter.key && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStatus(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === filter.key && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Customers List */}
        <View style={styles.customersContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Customers ({filteredCustomers.length})
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/customers/create')}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          </View>

          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>No Customers Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Add your first customer to get started'}
              </Text>
            </View>
          ) : (
            filteredCustomers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={styles.customerCard}
                onPress={() => router.push(`/crm/${customer.id}`)}
              >
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerInitial}>
                    {customer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  {customer.company && (
                    <Text style={styles.customerCompany}>{customer.company}</Text>
                  )}
                  <View style={styles.customerMeta}>
                    {customer.email && (
                      <Text style={styles.customerMetaText} numberOfLines={1}>
                        📧 {customer.email}
                      </Text>
                    )}
                    {customer.phone && (
                      <Text style={styles.customerMetaText}>
                        📞 {customer.phone}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.customerRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(customer.status || 'active') + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getStatusIcon(customer.status || 'active')}
                      size={14}
                      color={getStatusColor(customer.status || 'active')}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(customer.status || 'active') },
                      ]}
                    >
                      {(customer.status || 'active').charAt(0).toUpperCase() + (customer.status || 'active').slice(1)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                </View>
              </TouchableOpacity>
            ))
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  statCardSuccess: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.white,
    marginTop: 4,
    textAlign: 'center',
  },
  statLabelSecondary: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  customersContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  customerCompany: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  customerMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  customerMetaText: {
    fontSize: 12,
    color: Colors.gray500,
  },
  customerRight: {
    alignItems: 'flex-end',
    gap: 8,
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
    maxWidth: 280,
  },
});
