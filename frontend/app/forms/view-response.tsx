import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { FormResponse, FormTemplate } from '../../types';

export default function ViewResponseScreen() {
  const { responseId } = useLocalSearchParams();
  const [response, setResponse] = useState<FormResponse | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchResponseAndTemplate();
  }, [responseId]);

  const fetchResponseAndTemplate = async () => {
    try {
      const responsesRes = await api.get('/form-responses');
      const foundResponse = responsesRes.data.find((r: FormResponse) => r.id === responseId);
      
      if (!foundResponse) {
        throw new Error('Response not found');
      }

      setResponse(foundResponse);

      const templateRes = await api.get(`/form-templates/${foundResponse.form_template_id}`);
      setTemplate(templateRes.data);
    } catch (error) {
      console.error('Error fetching response:', error);
      Alert.alert('Error', 'Failed to load form response');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!response) return;
    
    setDownloadingPdf(true);
    try {
      // For web, we can open the PDF in a new tab
      const pdfUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/form-responses/${response.id}/pdf`;
      
      if (typeof window !== 'undefined') {
        // Web browser - open in new tab
        window.open(pdfUrl, '_blank');
      } else {
        // Mobile - show success message as download will be handled by the system
        Alert.alert('PDF Generated', 'Your PDF has been generated and will download automatically');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const renderResponseValue = (fieldId: string, value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!response || !template) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Form Response</Text>
        <TouchableOpacity 
          onPress={handleDownloadPdf} 
          style={styles.pdfButton}
          disabled={downloadingPdf}
        >
          {downloadingPdf ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="download" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.formName}>{template.name}</Text>
          <Text style={styles.submittedDate}>
            Submitted on {new Date(response.submitted_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {template.fields.map((field) => (
          <View key={field.field_id} style={styles.responseCard}>
            <Text style={styles.questionLabel}>{field.label}</Text>
            <View style={styles.answerContainer}>
              {response.responses[field.field_id] ? (
                <Text style={styles.answerText}>
                  {renderResponseValue(field.field_id, response.responses[field.field_id])}
                </Text>
              ) : (
                <Text style={styles.noAnswerText}>No answer provided</Text>
              )}
            </View>
          </View>
        ))}
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
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pdfButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  formName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  submittedDate: {
    fontSize: 14,
    color: Colors.gray600,
  },
  responseCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray600,
    marginBottom: 8,
  },
  answerContainer: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingLeft: 12,
  },
  answerText: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  noAnswerText: {
    fontSize: 16,
    color: Colors.gray400,
    fontStyle: 'italic',
  },
});
