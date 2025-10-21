import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';

interface Site {
  id: string;
  name: string;
  address: string;
  customer_id: string;
  customer_name?: string;
  site_type: string;
  active: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function SitesListScreen() {
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(true);
  
  const router = useRouter();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    filterSites();
  }, [searchQuery, filterActive, sites]);

  const fetchSites = async () => {
    try {
      const response = await api.get('/sites');
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      Alert.alert('Error', 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const filterSites = () => {
    let filtered = [...sites];

    // Filter by active status
    if (filterActive !== null) {
      filtered = filtered.filter((site) => site.active === filterActive);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(query) ||
          site.address.toLowerCase().includes(query) ||
          site.customer_name?.toLowerCase().includes(query)
      );
    }

    setFilteredSites(filtered);
  };

  const getSiteTypeIcon = (type: string) => {
    switch (type) {
      case 'commercial':
        return 'business';
      case 'residential':
        return 'home';
      case 'industrial':
        return 'construct';
      case 'municipal':
        return 'ribbon';
      default:
        return 'location';
    }
  };

  const getSiteTypeColor = (type: string) => {
    switch (type) {
      case 'commercial':
        return '#3b82f6';
      case 'residential':
        return '#10b981';
      case 'industrial':
        return '#f59e0b';
      case 'municipal':
        return '#8b5cf6';
      default:
        return Colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading sites...</Text>
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
          <Text style={styles.title}>Sites</Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push('/sites/create')}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sites..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterActive === null && styles.filterButtonActive,
            ]}
            onPress={() => setFilterActive(null)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterActive === null && styles.filterButtonTextActive,
              ]}
            >
              All ({sites.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterActive === true && styles.filterButtonActive,
            ]}
            onPress={() => setFilterActive(true)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterActive === true && styles.filterButtonTextActive,
              ]}
            >
              Active ({sites.filter((s) => s.active).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterActive === false && styles.filterButtonActive,
            ]}
            onPress={() => setFilterActive(false)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterActive === false && styles.filterButtonTextActive,
              ]}
            >
              Inactive ({sites.filter((s) => !s.active).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sites List */}
      <ScrollView style={styles.list}>
        {filteredSites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No sites found</Text>
            {isAdmin && searchQuery === '' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/sites/create')}
              >
                <Text style={styles.emptyButtonText}>Create First Site</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredSites.map((site) => (
            <TouchableOpacity
              key={site.id}
              style={styles.siteCard}
              onPress={() => router.push(`/sites/${site.id}`)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.siteIcon,
                  { backgroundColor: getSiteTypeColor(site.site_type) + '20' },
                ]}
              >
                <Ionicons
                  name={getSiteTypeIcon(site.site_type)}
                  size={24}
                  color={getSiteTypeColor(site.site_type)}
                />
              </View>

              <View style={styles.siteInfo}>
                <View style={styles.siteHeader}>
                  <Text style={styles.siteName} numberOfLines={1}>
                    {site.name}
                  </Text>
                  {!site.active && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>Inactive</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.siteAddress} numberOfLines={1}>
                  {site.address}
                </Text>

                {site.customer_name && (
                  <Text style={styles.siteCustomer} numberOfLines={1}>
                    <Ionicons name="person" size={12} color={Colors.textSecondary} />{' '}
                    {site.customer_name}
                  </Text>
                )}

                <View style={styles.siteFooter}>
                  <View style={styles.siteType}>
                    <Text style={[styles.siteTypeText, { color: getSiteTypeColor(site.site_type) }]}>
                      {site.site_type}
                    </Text>
                  </View>
                  {site.location && (
                    <View style={styles.locationIndicator}>
                      <Ionicons name="navigate" size={12} color={Colors.primary} />
                      <Text style={styles.locationText}>GPS</Text>
                    </View>
                  )}
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
    marginBottom: 16,
  },
  backButton: {
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  list: {
    flex: 1,
  },
  siteCard: {
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
  siteIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteInfo: {
    flex: 1,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#fecaca',
    borderRadius: 4,
    marginLeft: 8,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2626',
  },
  siteAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  siteCustomer: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  siteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  siteType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.background,
    borderRadius: 6,
  },
  siteTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
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
});
