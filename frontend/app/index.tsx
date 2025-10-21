import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    console.log('Index: isLoading=', isLoading, 'currentUser=', currentUser ? 'exists' : 'null');
    
    if (!isLoading) {
      console.log('Index: Auth loaded, redirecting...');
      
      // Simple redirect - no complex logic
      if (currentUser) {
        console.log('Index: User exists, going to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('Index: No user, going to login');
        router.replace('/login');
      }
    }
  }, [isLoading, currentUser]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  text: {
    marginTop: 16,
    color: '#666',
  },
});
