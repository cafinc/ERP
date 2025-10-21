import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../utils/theme';

export default function RoleDebugger() {
  const { currentUser, userRole, isAdmin, isCrew, isCustomer } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Role Debug Info</Text>
      <Text style={styles.info}>Current User: {currentUser?.name || 'None'}</Text>
      <Text style={styles.info}>User Role: {userRole || 'None'}</Text>
      <Text style={styles.info}>Is Admin: {isAdmin ? '✅' : '❌'}</Text>
      <Text style={styles.info}>Is Crew: {isCrew ? '✅' : '❌'}</Text>
      <Text style={styles.info}>Is Customer: {isCustomer ? '✅' : '❌'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.warningLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warning,
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  info: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
});