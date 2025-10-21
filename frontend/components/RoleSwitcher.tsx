import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../utils/theme';

export default function RoleSwitcher() {
  const { currentUser, setUser } = useAuth();

  const switchToAdmin = () => {
    const adminUser = {
      id: 'admin-temp',
      name: 'Admin User',
      email: 'admin@fproperty.com',
      phone: '555-0100',
      role: 'admin' as const,
      active: true,
      created_at: new Date().toISOString(),
    };
    setUser(adminUser);
  };

  const switchToCrew = () => {
    const crewUser = {
      id: 'crew-temp',
      name: 'Crew Member',
      email: 'crew@fproperty.com',
      phone: '555-0200',
      role: 'crew' as const,
      active: true,
      created_at: new Date().toISOString(),
    };
    setUser(crewUser);
  };

  const switchToCustomer = () => {
    const customerUser = {
      id: 'customer-temp',
      name: 'Customer User',
      email: 'customer@example.com',
      phone: '555-0300',
      role: 'customer' as const,
      active: true,
      created_at: new Date().toISOString(),
    };
    setUser(customerUser);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔄 Role Switcher (Testing)</Text>
      <Text style={styles.currentRole}>Current: {currentUser?.role || 'None'}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.adminButton]} 
          onPress={switchToAdmin}
        >
          <Text style={styles.buttonText}>👑 Switch to Admin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.crewButton]} 
          onPress={switchToCrew}
        >
          <Text style={styles.buttonText}>👷 Switch to Crew</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.customerButton]} 
          onPress={switchToCustomer}
        >
          <Text style={styles.buttonText}>👤 Switch to Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  currentRole: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: Colors.error,
  },
  crewButton: {
    backgroundColor: Colors.warning,
  },
  customerButton: {
    backgroundColor: Colors.success,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});