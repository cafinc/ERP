import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { Colors } from '../utils/theme';

interface AnalyticsWidgetProps {
  type: 'consumables' | 'equipment';
  onPress?: () => void;
}

export default function AnalyticsWidget({ type, onPress }: AnalyticsWidgetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      const endpoint = type === 'consumables' 
        ? '/consumable-usage/analytics?days=30'
        : '/equipment/analytics?days=30';
      const response = await api.get(endpoint);
      setData(response.data);
    } catch (error) {
      console.error(`Error fetching ${type} analytics:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (type === 'consumables') {
      router.push('/settings/consumables-analytics');
    }
  };

  if (loading) {
    return (
      <TouchableOpacity style={styles.widget} onPress={handlePress}>
        <View style={styles.header}>
          <Ionicons 
            name={type === 'consumables' ? 'cube' : 'construct'} 
            size={24} 
            color={type === 'consumables' ? '#8b5cf6' : '#3b82f6'} 
          />
          <Text style={styles.title}>
            {type === 'consumables' ? 'Consumables' : 'Equipment'}
          </Text>
        </View>
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />
      </TouchableOpacity>
    );
  }

  if (type === 'consumables') {
    const topItem = data?.usage_by_consumable?.[0];
    const lowStockCount = data?.low_stock_items?.length || 0;

    return (
      <TouchableOpacity style={styles.widget} onPress={handlePress}>
        <View style={styles.header}>
          <Ionicons name="cube" size={24} color="#8b5cf6" />
          <Text style={styles.title}>Consumables</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data?.total_usages || 0}</Text>
            <Text style={styles.statLabel}>Usages</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              ${(data?.total_cost || 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Total Cost</Text>
          </View>
        </View>

        {lowStockCount > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.alertText}>{lowStockCount} items low stock</Text>
          </View>
        )}

        {topItem && (
          <View style={styles.topItem}>
            <Text style={styles.topItemLabel}>Most Used:</Text>
            <Text style={styles.topItemValue}>{topItem.consumable_name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Equipment widget
  const summary = data?.summary;
  const needsInspection = data?.needs_inspection?.length || 0;
  const mostUsed = data?.most_used_equipment?.[0];

  return (
    <TouchableOpacity style={styles.widget} onPress={handlePress}>
      <View style={styles.header}>
        <Ionicons name="construct" size={24} color="#3b82f6" />
        <Text style={styles.title}>Equipment</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary?.total_equipment || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {summary?.total_dispatches || 0}
          </Text>
          <Text style={styles.statLabel}>Dispatches</Text>
        </View>
      </View>

      {needsInspection > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.alertText}>{needsInspection} need inspection</Text>
        </View>
      )}

      {mostUsed && (
        <View style={styles.topItem}>
          <Text style={styles.topItemLabel}>Most Used:</Text>
          <Text style={styles.topItemValue}>{mostUsed.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  widget: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d97706',
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topItemLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  topItemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
});
