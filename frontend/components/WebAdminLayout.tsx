import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '../utils/theme';
import EnhancedHeader from './EnhancedHeader';

interface WebAdminLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean; // Allow hiding header for tab screens
  startCollapsed?: boolean; // Start with sidebar collapsed
}

export default function WebAdminLayout({ children, showHeader = true, startCollapsed = false }: WebAdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(startCollapsed);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['CRM', 'Dispatch']); // CRM and Dispatch expanded by default

  // Only use this layout on web
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const menuItems = [
    { icon: 'home', label: 'Dashboard', route: '/' },
    { 
      icon: 'briefcase', 
      label: 'CRM', 
      route: '/(tabs)/crm',
      submenu: [
        { icon: 'people', label: 'Customers', route: '/customers' },
        { icon: 'document-text', label: 'Estimates', route: '/estimates' },
        { icon: 'folder-open', label: 'Projects', route: '/projects' },
        { icon: 'receipt', label: 'Invoices', route: '/invoices' },
        { icon: 'clipboard', label: 'Forms', route: '/forms' },
      ]
    },
    { 
      icon: 'snow', 
      label: 'Dispatch',
      route: '/dispatch',
      submenu: [
        { icon: 'location', label: 'Sites', route: '/sites' },
        { icon: 'map', label: 'Routes', route: '/routes' },
        { icon: 'people-circle', label: 'Crew', route: '/settings/team-members' },
        { icon: 'construct', label: 'Equipment', route: '/settings/equipment-list' },
        { icon: 'cube', label: 'Consumables', route: '/settings/consumables-list' },
        { icon: 'clipboard', label: 'Forms', route: '/forms' },
      ]
    },
    { icon: 'checkmark-done', label: 'Tasks', route: '/tasks' },
    { icon: 'mail', label: 'Gmail', route: '/gmail' },
    { icon: 'stats-chart', label: 'Analytics', route: '/settings/consumables-analytics' },
    { 
      icon: 'settings', 
      label: 'Settings',
      route: '/settings',
      submenu: [
        { icon: 'logo-google', label: 'Google Workspace', route: '/settings/google-integrations' },
        { icon: 'person', label: 'My Profile', route: '/settings/profile' },
        { icon: 'notifications', label: 'Notifications', route: '/settings/notifications' },
      ]
    },
  ];

  const isActive = (route: string) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  };

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isSubmenuExpanded = (label: string) => expandedMenus.includes(label);

  return (
    <View style={styles.container}>
      {/* Enhanced Header - Only show if showHeader is true */}
      {showHeader && <EnhancedHeader />}
      
      <View style={styles.mainContent}>
        {/* Collapsible Sidebar */}
        <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
          <TouchableOpacity
            onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={styles.collapseButton}
          >
            <Ionicons 
              name={sidebarCollapsed ? "chevron-forward" : "chevron-back"} 
              size={20} 
              color={Colors.gray600} 
            />
          </TouchableOpacity>
          
          <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <View key={item.route}>
                {/* Main Menu Item */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    isActive(item.route) && !item.submenu && styles.menuItemActive,
                    sidebarCollapsed && styles.menuItemCollapsed,
                  ]}
                  onPress={() => {
                    if (item.submenu) {
                      toggleSubmenu(item.label);
                    } else {
                      router.push(item.route as any);
                    }
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={isActive(item.route) && !item.submenu ? Colors.primary : Colors.textSecondary}
                    style={styles.menuIcon}
                  />
                  {!sidebarCollapsed && (
                    <>
                      <Text
                        style={[
                          styles.menuLabel,
                          isActive(item.route) && !item.submenu && styles.menuLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.submenu && (
                        <Ionicons
                          name={isSubmenuExpanded(item.label) ? "chevron-down" : "chevron-forward"}
                          size={16}
                          color={Colors.gray400}
                        />
                      )}
                    </>
                  )}
                </TouchableOpacity>

                {/* Submenu Items */}
                {item.submenu && isSubmenuExpanded(item.label) && !sidebarCollapsed && (
                  <View style={styles.submenu}>
                    {item.submenu.map((subItem) => (
                      <TouchableOpacity
                        key={subItem.route}
                        style={[
                          styles.submenuItem,
                          isActive(subItem.route) && styles.submenuItemActive,
                        ]}
                        onPress={() => router.push(subItem.route as any)}
                      >
                        <Ionicons
                          name={subItem.icon as any}
                          size={18}
                          color={isActive(subItem.route) ? Colors.primary : Colors.gray500}
                          style={styles.submenuIcon}
                        />
                        <Text
                          style={[
                            styles.submenuLabel,
                            isActive(subItem.route) && styles.submenuLabelActive,
                          ]}
                        >
                          {subItem.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Collapse Toggle at Bottom */}
          <TouchableOpacity
            style={[styles.collapseButton, sidebarCollapsed && styles.collapseButtonCollapsed]}
            onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Ionicons
              name={sidebarCollapsed ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color={Colors.textSecondary}
            />
            {!sidebarCollapsed && (
              <Text style={styles.collapseText}>Collapse</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollInner}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 200,
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sidebarCollapsed: {
    width: 60,
  },
  sidebarScroll: {
    flex: 1,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    marginBottom: 4,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  menuItemActive: {
    backgroundColor: Colors.primary + '15',
  },
  menuItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  menuIcon: {
    width: 24,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: 12,
  },
  menuLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  submenu: {
    marginLeft: 16,
    marginBottom: 4,
    borderLeftWidth: 2,
    borderLeftColor: Colors.gray200,
    paddingLeft: 12,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 2,
    borderRadius: 6,
    cursor: 'pointer' as any,
  },
  submenuItemActive: {
    backgroundColor: Colors.primary + '10',
  },
  submenuIcon: {
    width: 20,
    marginRight: 10,
    textAlign: 'center',
  },
  submenuLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  submenuLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    cursor: 'pointer' as any,
  },
  collapseButtonCollapsed: {
    paddingHorizontal: 0,
  },
  collapseText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  contentArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    padding: 24,
    minHeight: '100%',
  },
});
