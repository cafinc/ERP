import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';

export default function ThemeSettings() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode } = useTheme();

  const themeOptions: { value: ThemeMode; label: string; description: string; icon: string }[] = [
    {
      value: 'light',
      label: 'Light Mode',
      description: 'Always use light theme',
      icon: 'sunny',
    },
    {
      value: 'dark',
      label: 'Dark Mode',
      description: 'Always use dark theme',
      icon: 'moon',
    },
    {
      value: 'auto',
      label: 'Auto',
      description: 'Follow system preference',
      icon: 'phone-portrait',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Theme Settings
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Theme Options */}
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            APPEARANCE
          </Text>

          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: themeMode === option.value ? theme.colors.primary : theme.colors.border,
                  borderWidth: themeMode === option.value ? 2 : 1,
                },
              ]}
              onPress={() => setThemeMode(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor:
                        themeMode === option.value
                          ? theme.colors.primary + '20'
                          : theme.colors.gray100,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={28}
                    color={
                      themeMode === option.value
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                </View>
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color:
                          themeMode === option.value
                            ? theme.colors.primary
                            : theme.colors.textPrimary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
              </View>
              {themeMode === option.value && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}

          {/* Preview Section */}
          <View style={[styles.previewSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.previewTitle, { color: theme.colors.textPrimary }]}>
              Preview
            </Text>
            <View style={styles.previewContent}>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <View style={styles.previewHeader}>
                  <Ionicons name="snow" size={24} color={theme.colors.primary} />
                  <Text style={[styles.previewCardTitle, { color: theme.colors.textPrimary }]}>
                    Sample Card
                  </Text>
                </View>
                <Text style={[styles.previewCardText, { color: theme.colors.textSecondary }]}>
                  This is how your app will look with the selected theme.
                </Text>
                <View style={styles.previewButtons}>
                  <View style={[styles.previewButton, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.previewButtonText, { color: theme.colors.textOnPrimary }]}>
                      Primary Button
                    </Text>
                  </View>
                  <View style={[styles.previewButton, { backgroundColor: 'transparent', borderColor: theme.colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.previewButtonText, { color: theme.colors.textPrimary }]}>
                      Secondary
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.textPrimary }]}>
              Your theme preference will be saved and applied across the entire app.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  previewSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  previewContent: {
    gap: 12,
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  previewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewCardText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
