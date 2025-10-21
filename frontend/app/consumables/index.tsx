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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';

interface Consumable {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  cost_per_unit: number;
  active: boolean;
}

export default function ConsumablesListScreen() {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchConsumables();
  }, []);

  const fetchConsumables = async () => {
    try {
      const response = await api.get('/consumables');
      setConsumables(response.data);
    } catch (error) {
      console.error('Error fetching consumables:', error);
      Alert.alert('Error', 'Failed to load consumables');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'salt':
        return 'snow';
      case 'sand':
        return 'cube';
      case 'fuel':
        return 'flame';
      case 'equipment':
        return 'construct';
      default:
        return 'cube-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'salt':
        return '#3b82f6';
      case 'sand':
        return '#f59e0b';
      case 'fuel':
        return '#ef4444';
      case 'equipment':
        return '#10b981';
      default:
        return Colors.primary;
    }
  };

  const isLowStock = (quantity: number, reorderLevel: number) => {
    return quantity <= reorderLevel;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading consumables...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Consumables</Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push('/settings/consumables-list')}
              style={styles.settingsButton}
            >
              <Ionicons name="settings" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Consumables List */}
      <ScrollView style={styles.list}>
        {consumables.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No consumables found</Text>
          </View>
        ) : (
          consumables.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.consumableCard}
              onPress={() =>
                Alert.alert(
                  item.name,
                  `Quantity: ${item.quantity} ${item.unit}\nCost: $${item.cost_per_unit}/${item.unit}\nReorder Level: ${item.reorder_level}`
                )
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.consumableIcon,
                  { backgroundColor: getCategoryColor(item.category) + '20' },
                ]}
              >
                <Ionicons
                  name={getCategoryIcon(item.category)}
                  size={24}
                  color={getCategoryColor(item.category)}
                />
              </View>

              <View style={styles.consumableInfo}>
                <View style={styles.consumableHeader}>
                  <Text style={styles.consumableName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isLowStock(item.quantity, item.reorder_level) && (
                    <View style={styles.lowStockBadge}>
                      <Ionicons name="warning" size={12} color="#dc2626" />
                      <Text style={styles.lowStockText}>Low</Text>
                    </View>
                  )}
                </View>

                <View style={styles.consumableDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantity:</Text>
                    <Text style={styles.detailValue}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cost:</Text>
                    <Text style={styles.detailValue}>
                      ${item.cost_per_unit}/{item.unit}
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryBadge}>
                  <Text
                    style={[
                      styles.categoryText,
                      { color: getCategoryColor(item.category) },
                    ]}
                  >
                    {item.category}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))
        )}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  consumableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  consumableIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  consumableInfo: {
    flex: 1,
  },
  consumableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consumableName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fecaca',
    borderRadius: 12,
    gap: 4,
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2626',
  },
  consumableDetails: {
    gap: 4,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.background,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
