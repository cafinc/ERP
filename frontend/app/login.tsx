import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Colors } from '../utils/theme';
import * as WebBrowser from 'expo-web-browser';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  // Phone login
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [mockCode, setMockCode] = useState<string | null>(null);
  
  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 1) return cleaned ? `+${cleaned}` : '';
    if (cleaned.length <= 4) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1)}`;
    if (cleaned.length <= 7) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleSendOTP = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/send-otp', {
        phone_number: `+${cleanPhone}`,
        purpose: 'login'
      });

      if (response.data.mock_code) {
        setMockCode(response.data.mock_code);
        Alert.alert('Test Code', `Use this code: ${response.data.mock_code}`);
      }
      
      setStep('otp');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    console.log('🔴 NEW LOGIN CODE - WILL REDIRECT ADMIN TO DASHBOARD ON WEB');
    if (otp.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code');
      return;
    }

    try {
      setLoading(true);
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      const verifyResponse = await api.post('/auth/verify-otp', {
        phone_number: `+${cleanPhone}`,
        code: otp,
        purpose: 'login'
      });

      if (!verifyResponse.data.success) {
        Alert.alert('Invalid Code', 'The code you entered is incorrect');
        return;
      }

      const usersResponse = await api.get(`/users?phone=+${cleanPhone}`);
      
      let user;
      if (usersResponse.data && usersResponse.data.length > 0) {
        user = usersResponse.data[0];
      } else {
        const newUserResponse = await api.post('/users', {
          name: 'New User',
          phone: `+${cleanPhone}`,
          email: `user${Date.now()}@example.com`,
          role: 'customer'
        });
        user = newUserResponse.data;
      }

      await login(user, 'phone-otp-session');
      
      console.log('🔴 LOGIN DEBUG:', {
        platform: Platform.OS,
        userRole: user.role,
        isWeb: Platform.OS === 'web',
        isAdmin: user.role === 'admin',
        willRedirectToDashboard: Platform.OS === 'web' && user.role === 'admin'
      });
      
      // Redirect based on role and platform
      if (Platform.OS === 'web' && user.role === 'admin') {
        console.log('🔴 REDIRECTING TO ADMIN DASHBOARD (INDEX)');
        router.replace('/(tabs)/');
      } else {
        console.log('🔴 REDIRECTING TO DEFAULT TABS');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/login-email', {
        email: email.trim(),
        password,
      });

      await login(response.data.user, response.data.session_token);
      
      // Redirect based on role and platform
      if (Platform.OS === 'web' && response.data.user.role === 'admin') {
        router.replace('/(tabs)/');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Get authorization URL from backend
      const response = await api.get('/auth/google/signin');
      const authUrl = response.data.authorization_url;
      
      // Open the OAuth URL
      const supported = await WebBrowser.maybeCompleteAuthSession();
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        // The redirect URL will be handled by the backend
      );
      
      if (result.type === 'success') {
        // Backend will set the session cookie and redirect back
        // Check if we're logged in
        setTimeout(async () => {
          try {
            const userResponse = await api.get('/auth/me');
            if (userResponse.data.user) {
              await login(userResponse.data.user, userResponse.data.session_token);
              
              // Redirect based on role and platform
              if (Platform.OS === 'web' && userResponse.data.user.role === 'admin') {
                router.replace('/(tabs)/');
              } else {
                router.replace('/(tabs)');
              }
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to complete Google sign-in');
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo-white.svg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>CAF Property Services</Text>
          <Text style={styles.subtitle}>Snow Removal Management</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, loginMethod === 'phone' && styles.tabActive]}
            onPress={() => { setLoginMethod('phone'); setStep('phone'); }}
          >
            <Ionicons name="call-outline" size={20} color={loginMethod === 'phone' ? Colors.primary : Colors.gray500} />
            <Text style={[styles.tabText, loginMethod === 'phone' && styles.tabTextActive]}>Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, loginMethod === 'email' && styles.tabActive]}
            onPress={() => setLoginMethod('email')}
          >
            <Ionicons name="mail-outline" size={20} color={loginMethod === 'email' ? Colors.primary : Colors.gray500} />
            <Text style={[styles.tabText, loginMethod === 'email' && styles.tabTextActive]}>Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {loginMethod === 'phone' ? (
            step === 'phone' ? (
              <>
                <Text style={styles.formTitle}>Sign In with Phone</Text>
                <Text style={styles.formDescription}>Enter your phone number to receive a verification code</Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+1 (555) 123-4567"
                    placeholderTextColor={Colors.textSecondary}
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    maxLength={18}
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                </View>

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendOTP} disabled={loading}>
                  {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Send Code</Text>}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.testLoginButton} onPress={() => setPhoneNumber('+1 (587) 877-0293')}>
                  <Ionicons name="flash" size={18} color={Colors.primary} />
                  <Text style={styles.testLoginText}>Use Test Number</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.backButton} onPress={() => { setStep('phone'); setOtp(''); }}>
                  <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>

                <Text style={styles.formTitle}>Enter Code</Text>
                <Text style={styles.formDescription}>We sent a verification code to{' '}{phoneNumber}</Text>

                {mockCode && (
                  <View style={styles.mockCodeBanner}>
                    <Ionicons name="information-circle" size={20} color={Colors.primary} />
                    <Text style={styles.mockCodeText}>Test Code: {mockCode}</Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor={Colors.textSecondary}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                  />
                </View>

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerifyOTP} disabled={loading}>
                  {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Verify & Continue</Text>}
                </TouchableOpacity>
              </>
            )
          ) : (
            <>
              <Text style={styles.formTitle}>Sign In with Email</Text>
              <Text style={styles.formDescription}>Enter your email and password</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor={Colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleEmailLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign In</Text>}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logo: { width: 70, height: 70, tintColor: Colors.white },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  tabContainer: { flexDirection: 'row', marginBottom: 24, backgroundColor: Colors.gray100, borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8 },
  tabActive: { backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.gray500 },
  tabTextActive: { color: Colors.primary },
  formContainer: { backgroundColor: Colors.white, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  formDescription: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, backgroundColor: Colors.white },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: Colors.textPrimary },
  eyeIcon: { padding: 8 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotPasswordText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  button: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: Colors.textSecondary },
  testLoginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.white },
  testLoginText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  googleButtonText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  backButton: { alignSelf: 'flex-start', marginBottom: 16, padding: 8 },
  mockCodeBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryLight, padding: 12, borderRadius: 8, marginBottom: 16 },
  mockCodeText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});