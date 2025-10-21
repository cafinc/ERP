import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
  color: string;
}

export default function DispatchHubScreen() {
  const router = useRouter();
  const { isAdmin, isCrew } = useAuth();

  const menuItems: MenuItem[] = [
    {
      title: 'Active Dispatches',
      icon: 'snow',
      route: '/(tabs)/dispatch',
      description: 'View and manage active dispatches',
      color: Colors.primary,
    },
    {
      title: 'Sites',
      icon: 'location',
      route: '/sites',
      description: 'Manage customer sites and locations',
      color: '#10b981',
    },
    {
      title: 'Routes',
      icon: 'map',
      route: '/routes',
      description: 'Create and manage route templates',
      color: '#f59e0b',
    },
    {
      title: 'Route Optimization',
      icon: 'navigate',
      route: '/routes/optimize',
      description: 'Optimize routes for efficiency',
      color: '#8b5cf6',
    },
    {
      title: 'Geofence Management',
      icon: 'radio-button-on',
      route: '/geofence',
      description: 'Configure site entry/exit detection',
      color: '#06b6d4',
    },
    {
      title: 'Crew Members',
      icon: 'people',
      route: '/crew',
      description: 'Manage crew members and assignments',
      color: '#3b82f6',
    },
    {
      title: 'Equipment',
      icon: 'construct',
      route: '/equipment',
      description: 'Track equipment and maintenance',
      color: '#ef4444',
    },
    {
      title: 'Consumables',
      icon: 'cube',
      route: '/consumables',
      description: 'Manage salt, sand, and supplies',
      color: '#ec4899',
    },
    {
      title: 'Shift History',
      icon: 'time',
      route: '/settings/shift-history',
      description: 'View crew shift records',
      color: '#64748b',
    },
  ];

  // Filter menu items based on user role
  const visibleItems = menuItems.filter((item) => {
    if (item.route === '/routes/optimize' || item.route === '/geofence') {
      return isAdmin; // Only admin can access these
    }
    return true;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dispatch Management</Text>
        <Text style={styles.subtitle}>
          Access all dispatch and operations tools
        </Text>
      </View>

      <View style={styles.grid}>
        {visibleItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={32} color={item.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      {isAdmin && (
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/(tabs)/dispatch')}
          >
            <Ionicons name="add-circle" size={24} color={Colors.white} />
            <Text style={styles.quickActionText}>Create New Dispatch</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  grid: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickActions: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
