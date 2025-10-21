import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import WebAdminLayout from '../../components/WebAdminLayout';
import GmailSettings from '../../components/GmailSettings';
import { Platform } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { currentUser, isAdmin, isCrew, isCustomer, setUser, logout } = useAuth();
  const isWeb = Platform.OS === 'web';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Redirect to login page after logout
            router.replace('/login');
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      icon: '👥',
      title: 'Team Members',
      subtitle: 'Manage crew & subcontractors',
      route: '/team-members',
      color: Colors.primary,
      bgColor: '#e8f1f8',
    },
    {
      icon: '🚜',
      title: 'Equipment',
      subtitle: 'Trucks, plows, spreaders & more',
      route: '/equipment-list',
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      icon: '⏰',
      title: 'My Shifts',
      subtitle: 'View past shifts & hours',
      route: '/shift-history',
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    {
      icon: '❄️',
      title: 'Services',
      subtitle: 'Plowing, salting & pricing',
      route: '/services-list',
      color: '#06b6d4',
      bgColor: '#cffafe',
    },
    {
      icon: '📦',
      title: 'Consumables',
      subtitle: 'Salt, sand & supplies',
      route: '/consumables-list',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
    {
      icon: '⚙️',
      title: 'App Settings',
      subtitle: 'Configure customer features & documents',
      route: '/app-settings',
      color: '#ef4444',
      bgColor: '#fef2f2',
    },
  ];

  // Role switcher for testing
  const switchRole = (role: UserRole) => {
    const newUser = { ...currentUser!, role };
    setUser(newUser);
    Alert.alert('Role Changed', `Switched to ${role}. App will reload tabs.`);
  };

  // Admin sees Team Members, Equipment, Services, and Consumables (not My Shifts)
  const adminSections = settingsSections.filter(s => s.title !== 'My Shifts');
  
  // Crew/Subcontractor sees Team Members, Equipment, and My Shifts
  const crewSections = settingsSections.filter(s => 
    s.title === 'Team Members' || s.title === 'Equipment' || s.title === 'My Shifts'
  );
  
  // Customer sees none (different settings)
  const customerSections: typeof settingsSections = [];

  const visibleSections = isAdmin ? adminSections : isCrew ? crewSections : customerSections;

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>⚙️ Settings</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>
          {isAdmin ? 'Manage your business resources' : 
           isCrew ? 'View your team and equipment' :
           'Your account settings'}
        </Text>
      </View>

      {/* Role Switcher for Testing */}
      <View style={styles.roleSwitcher}>
        <Text style={styles.roleSwitcherTitle}>Current Role: {currentUser?.role?.toUpperCase()}</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity 
            style={[styles.roleButton, isAdmin && styles.roleButtonActive]}
            onPress={() => switchRole('admin')}
          >
            <Text style={[styles.roleButtonText, isAdmin && styles.roleButtonTextActive]}>
              👔 Admin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, isCrew && styles.roleButtonActive]}
            onPress={() => switchRole('crew')}
          >
            <Text style={[styles.roleButtonText, isCrew && styles.roleButtonTextActive]}>
              👷 Crew
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, isCustomer && styles.roleButtonActive]}
            onPress={() => switchRole('customer')}
          >
            <Text style={[styles.roleButtonText, isCustomer && styles.roleButtonTextActive]}>
              👤 Customer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gmail Integration - Admin Only */}
      {isAdmin && (
        <GmailSettings />
      )}

      {/* Google Workspace Integrations - Admin Only */}
      {isAdmin && (
        <View style={styles.sectionsContainer}>
          <TouchableOpacity
            style={[styles.sectionCard, { backgroundColor: '#e8f5ff' }]}
            onPress={() => router.push('/settings/google-integrations')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#4285F4' }]}>
              <Ionicons name="logo-google" size={24} color={Colors.white} />
            </View>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: '#4285F4' }]}>
                Google Workspace
              </Text>
              <Text style={styles.sectionSubtitle}>
                Gmail, Tasks, Drive, Calendar & more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>
      )}

      {/* My Profile - Available to All Users */}
      <View style={styles.sectionsContainer}>
        <TouchableOpacity
          style={[styles.sectionCard, { backgroundColor: '#e8f1f8' }]}
          onPress={() => router.push('/settings/profile')}
        >
          <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
            <Ionicons name="person" size={24} color={Colors.white} />
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>My Profile</Text>
            <Text style={styles.sectionSubtitle}>Update email, phone & password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>

      {/* Admin & Crew Sections */}
      {visibleSections.length > 0 && (
        <View style={styles.sectionsContainer}>
          {visibleSections.map((section, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.sectionCard, { backgroundColor: section.bgColor }]}
              onPress={() => {
                if (section.title === 'Team Members') {
                  router.push('/settings/team-members');
                } else if (section.title === 'Equipment') {
                  router.push('/settings/equipment-list');
                } else if (section.title === 'My Shifts') {
                  router.push('/settings/shift-history');
                } else if (section.title === 'Services') {
                  router.push('/settings/services-list');
                } else if (section.title === 'Consumables') {
                  router.push('/settings/consumables-list');
                } else if (section.title === 'App Settings') {
                  router.push('/settings/app-settings');
                }
              }}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.iconEmoji}>{section.icon}</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={[styles.sectionTitle, { color: section.color }]}>
                  {section.title}
                </Text>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
              <View style={styles.chevronContainer}>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Customer-Specific Options */}
      {isCustomer && (
        <View style={styles.sectionsContainer}>
          <View style={[styles.sectionCard, { backgroundColor: '#e8f1f8' }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>📍</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
                My Sites
              </Text>
              <Text style={styles.sectionSubtitle}>View your properties</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Text style={styles.chevron}>›</Text>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: '#d1fae5' }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>📋</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: '#10b981' }]}>
                Service History
              </Text>
              <Text style={styles.sectionSubtitle}>View past services</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Text style={styles.chevron}>›</Text>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: '#fef3c7' }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>💳</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: '#f59e0b' }]}>
                Billing
              </Text>
              <Text style={styles.sectionSubtitle}>Invoices and payments</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Text style={styles.chevron}>›</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
        <Image
          source={require('../../assets/logo.png')}
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
    </View>
  );

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
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pageHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionsContainer: {
    gap: 16,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconEmoji: {
    fontSize: 40,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chevronContainer: {
    marginLeft: 12,
  },
  chevron: {
    fontSize: 28,
    color: Colors.textTertiary,
    fontWeight: '300',
  },
  roleSwitcher: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleSwitcherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.gray100,
    borderWidth: 2,
    borderColor: Colors.gray200,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleButtonTextActive: {
    color: Colors.white,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
    paddingBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    marginBottom: 24,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  footerLogo: {
    width: 250,
    height: 120,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
