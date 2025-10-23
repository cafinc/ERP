import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { SmartFillProvider } from '../contexts/SmartFillContext';
import { MessagingProvider } from '../contexts/MessagingContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import FloatingChatContainer from '../components/FloatingChatContainer';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SmartFillProvider>
          <MessagingProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            {/* Floating Chat Container - Visible on all pages */}
            <FloatingChatContainer />
          </MessagingProvider>
        </SmartFillProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}