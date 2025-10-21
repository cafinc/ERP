import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import WebAdminLayout from '../../components/WebAdminLayout';
import { Platform } from 'react-native';

interface ConsumableAnalytics {
  period_days: number;
  start_date: string;
  end_date: string;
  total_cost: number;
  total_usages: number;
  usage_by_consumable: Array<{
    consumable_id: string;
    consumable_name: string;
    total_quantity: number;
    total_cost: number;
    usage_count: number;
    unit: string;
  }>;
  low_stock_items: Array<{
    id: string;
    name: string;
    quantity_available: number;
    reorder_level: number;
    unit: string;
  }>;
}

export default function ConsumablesAnalyticsScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isWeb = Platform.OS === 'web';
  
  const [analytics, setAnalytics] = useState<ConsumableAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [periodDays]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/consumable-usage/analytics?days=${periodDays}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Usage Analytics</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {[7, 30, 90].map((days) => (
            <TouchableOpacity
              key={days}
              style={[styles.periodButton, periodDays === days && styles.periodButtonActive]}
              onPress={() => setPeriodDays(days)}
            >
              <Text
                style={[styles.periodButtonText, periodDays === days && styles.periodButtonTextActive]}
              >
                {days} Days
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="stats-chart" size={32} color="#3b82f6" />
            <Text style={styles.summaryValue}>{analytics?.total_usages || 0}</Text>
            <Text style={styles.summaryLabel}>Total Usages</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="cash" size={32} color="#10b981" />
            <Text style={styles.summaryValue}>${(analytics?.total_cost || 0).toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Cost</Text>
          </View>
        </View>

        {/* Low Stock Alert */}
        {analytics?.low_stock_items && analytics.low_stock_items.length > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color="#f59e0b" />
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
            </View>
            {analytics.low_stock_items.map((item) => (
              <View key={item.id} style={styles.alertItem}>
                <Text style={styles.alertItemName}>{item.name}</Text>
                <Text style={styles.alertItemText}>
                  {item.quantity_available} {item.unit} (reorder at {item.reorder_level})
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Usage by Consumable */}
        <Text style={styles.sectionTitle}>Usage by Consumable</Text>
        {analytics?.usage_by_consumable && analytics.usage_by_consumable.length > 0 ? (
          analytics.usage_by_consumable.map((item, index) => (
            <View key={item.consumable_id} style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#fef3c7' : '#e5e7eb' }]}>
                  <Text style={[styles.rankText, { color: index === 0 ? '#d97706' : '#6b7280' }]}>
                    #{index + 1}
                  </Text>
                </View>
                <Text style={styles.usageName}>{item.consumable_name}</Text>
              </View>
              <View style={styles.usageStats}>
                <View style={styles.usageStat}>
                  <Text style={styles.usageStatLabel}>Quantity Used</Text>
                  <Text style={styles.usageStatValue}>
                    {item.total_quantity.toFixed(2)} {item.unit}
                  </Text>
                </View>
                <View style={styles.usageStat}>
                  <Text style={styles.usageStatLabel}>Times Used</Text>
                  <Text style={styles.usageStatValue}>{item.usage_count}</Text>
                </View>
                <View style={styles.usageStat}>
                  <Text style={styles.usageStatLabel}>Total Cost</Text>
                  <Text style={[styles.usageStatValue, { color: '#10b981' }]}>
                    ${item.total_cost.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No usage data for this period</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Wrap with WebAdminLayout for web admin users
  if (isWeb && isAdmin) {
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: Colors.white,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d97706',
  },
  alertItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#fde68a',
  },
  alertItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  alertItemText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  usageCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  usageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  usageStats: {
    flexDirection: 'row',
    gap: 12,
  },
  usageStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  usageStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  usageStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
