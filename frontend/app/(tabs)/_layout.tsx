import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform, AsyncStorage } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import EnhancedHeader from '../../components/EnhancedHeader';

// Messages Tab Icon with Notification Badge
function MessageTabIcon({ color, size }: { color: string; size: number }) {
  const { isAdmin, isCrew, currentUser } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isAdmin, isCrew, currentUser]);

  const fetchPendingCount = async () => {
    try {
      if (isAdmin) {
        const response = await api.get('/messages/pending-admin');
        setPendingCount(response.data.length);
      } else if (isCrew && currentUser?.id) {
        const response = await api.get(`/messages/pending-crew/${currentUser.id}`);
        setPendingCount(response.data.length);
      } else {
        // Customer - count pending messages from user
        const response = await api.get(`/messages?from_user_id=${currentUser?.id}&status=pending`);
        setPendingCount(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching pending count:', error);
      setPendingCount(0);
    }
  };

  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name="chatbubbles" size={size} color={color} />
      {pendingCount > 0 && (
        <View style={{
          position: 'absolute',
          top: -6,
          right: -6,
          backgroundColor: '#ef4444',
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#fff',
        }}>
          <Text style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
          }}>
            {pendingCount > 99 ? '99+' : pendingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

// Settings Header Button Component removed - using EnhancedHeader instead

export default function TabLayout() {
  const { isAdmin, isCrew, isCustomer, isLoading } = useAuth();
  const [tabBarCollapsed, setTabBarCollapsed] = useState(false);

  // Show loading spinner while AuthContext initializes
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  const isWeb = Platform.OS === 'web';
  const shouldHideBottomTabs = isWeb && isAdmin; // Only hide for admin on web

  const toggleTabBar = () => {
    setTabBarCollapsed(!tabBarCollapsed);
  };

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: true, // Always show header
        header: () => <EnhancedHeader />,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarStyle: {
          display: shouldHideBottomTabs ? 'none' : 'flex', // Only hide tabs for admin on web
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: tabBarCollapsed ? 4 : 8,
          paddingTop: tabBarCollapsed ? 4 : 8,
          paddingHorizontal: 16,
          height: tabBarCollapsed ? 40 : 70,
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarLabelStyle: {
          display: tabBarCollapsed ? 'none' : 'flex',
        },
        tabBarIconStyle: {
          marginTop: tabBarCollapsed ? -4 : 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTintColor: Colors.textPrimary,
      }}
    >
      {/* Dashboard - Everyone sees */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      
      {/* Dispatch - Admin and Crew only */}
      {!isCustomer && (
        <Tabs.Screen
          name="dispatch"
          options={{
            title: 'Dispatch',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="send" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Forms - Everyone sees */}
      <Tabs.Screen
        name="forms"
        options={{
          title: 'Forms',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      
      {/* Messages - Everyone sees */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageTabIcon color={color} size={size} />,
        }}
      />

      {/* CRM - Admin only */}
      {isAdmin && (
        <Tabs.Screen
          name="crm"
          options={{
            title: 'CRM',
            headerShown: false, // Hide tab header, WebAdminLayout provides its own
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Sites - Admin and Crew only */}
      {!isCustomer && (
        <Tabs.Screen
          name="sites"
          options={{
            title: 'Sites',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* GPS - Admin and Crew only */}
      {!isCustomer && (
        <Tabs.Screen
          name="tracking"
          options={{
            title: 'GPS',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="location" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Customers and Live Tracking completely removed as requested */}
      {/* Settings moved to header - no longer in bottom navigation */}
      
      {/* Settings moved to header - no longer in tabs */}
    </Tabs>
    {!shouldHideBottomTabs && (
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: tabBarCollapsed ? 48 : 78,
          left: '50%',
          marginLeft: -20,
          width: 40,
          height: 20,
          backgroundColor: Colors.white,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: Colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
          zIndex: 1000,
        }}
        onPress={toggleTabBar}
      >
        <Ionicons 
          name={tabBarCollapsed ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={Colors.gray600} 
        />
      </TouchableOpacity>
    )}
  </View>
  );
}
