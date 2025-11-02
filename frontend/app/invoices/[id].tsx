import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  line_items: any[];
  subtotal: number;
  discount_amount: number;
  pre_tax_total: number;
  tax_amount: number;
  total_amount: number;
  payment_terms: string;
  early_payment_discount: number;
  deposit_required: boolean;
  deposit_amount: number;
  deposit_paid: boolean;
  payments: Payment[];
  amount_paid: number;
  amount_due: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes?: string;
}

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'helcim_card',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invoices/${id}`);
      setInvoice(response.data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      Alert.alert('Error', 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (amount > (invoice?.amount_due || 0)) {
      Alert.alert('Error', 'Payment amount cannot exceed amount due');
      return;
    }
    
    try {
      setSaving(true);
      await api.post(`/invoices/${id}/payments`, {
        amount,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      });
      
      Alert.alert('Success', 'Payment recorded successfully!');
      setPaymentForm({ amount: '', payment_method: 'helcim_card', notes: '' });
      setShowAddPayment(false);
      fetchInvoice();
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return Colors.warning;
      case 'partially_paid': return '#3b82f6';
      case 'paid': return Colors.success;
      case 'overdue': return Colors.error;
      default: return Colors.gray400;
    }
  };

  const isOverdue = () => {
    if (!invoice || invoice.status === 'paid') return false;
    return new Date(invoice.due_date) < new Date();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invoice not found</Text>
      </View>
    );
  }

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{invoice.invoice_number}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(invoice.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(invoice.status) },
              ]}
            >
              {invoice.status.replace('_', ' ').charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Payment Status Card */}
        <View style={[styles.paymentStatusCard, isOverdue() && styles.overdueCard]}>
          <View style={styles.paymentStatusHeader}>
            <Text style={styles.paymentStatusTitle}>
              {isOverdue() ? '⚠️ Overdue' : invoice.status === 'paid' ? '✅ Paid in Full' : '💰 Payment Due'}
            </Text>
            <Text style={styles.amountDue}>${invoice.amount_due.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentProgress}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(invoice.amount_paid / invoice.total_amount) * 100}%`,
                    backgroundColor: invoice.status === 'paid' ? Colors.success : Colors.primary
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              ${invoice.amount_paid.toFixed(2)} of ${invoice.total_amount.toFixed(2)} paid
            </Text>
          </View>
          {invoice.amount_due > 0 && (
            <TouchableOpacity
              style={styles.recordPaymentButton}
              onPress={() => setShowAddPayment(!showAddPayment)}
            >
              <Ionicons name="add-circle" size={20} color={Colors.white} />
              <Text style={styles.recordPaymentButtonText}>Record Payment</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add Payment Form */}
        {showAddPayment && (
          <View style={styles.addPaymentCard}>
            <Text style={styles.formTitle}>Record Payment</Text>
            
            <Text style={styles.inputLabel}>Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={paymentForm.amount}
              onChangeText={(text) => setPaymentForm({ ...paymentForm, amount: text })}
            />

            <Text style={styles.inputLabel}>Payment Method *</Text>
            <View style={styles.pickerContainer}>
              <select
                style={styles.picker as any}
                value={paymentForm.payment_method}
                onChange={(e: any) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              >
                <option value="helcim_card">Credit Card (Helcim)</option>
                <option value="helcim_ach">ACH Transfer (Helcim)</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </View>

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Payment notes..."
              value={paymentForm.notes}
              onChangeText={(text) => setPaymentForm({ ...paymentForm, notes: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddPayment(false);
                  setPaymentForm({ amount: '', payment_method: 'helcim_card', notes: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddPayment}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Record Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <Text style={styles.customerName}>{invoice.customer_name}</Text>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          {invoice.line_items.map((item, index) => (
            <View key={index} style={styles.lineItemCard}>
              <Text style={styles.lineItemDescription}>{item.description}</Text>
              <View style={styles.lineItemDetails}>
                <Text style={styles.lineItemText}>Qty: {item.quantity}</Text>
                <Text style={styles.lineItemText}>@ ${item.unit_price.toFixed(2)}</Text>
                <Text style={styles.lineItemTotal}>${item.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${invoice.subtotal.toFixed(2)}</Text>
            </View>
            {invoice.discount_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={[styles.totalValue, { color: Colors.error }]}>
                  -${invoice.discount_amount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Pre-Tax Total:</Text>
              <Text style={styles.totalValue}>${invoice.pre_tax_total.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (5%):</Text>
              <Text style={styles.totalValue}>${invoice.tax_amount.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={styles.totalLabelFinal}>Total:</Text>
              <Text style={styles.totalValueFinal}>${invoice.total_amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History ({invoice.payments.length})</Text>
            {invoice.payments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View>
                    <Text style={styles.paymentAmount}>${payment.amount.toFixed(2)}</Text>
                    <Text style={styles.paymentMethod}>{payment.payment_method.replace('_', ' ')}</Text>
                  </View>
                  <Text style={styles.paymentDate}>
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </Text>
                </View>
                {payment.notes && (
                  <Text style={styles.paymentNotes}>{payment.notes}</Text>
                )}
                {payment.transaction_id && (
                  <Text style={styles.transactionId}>Txn: {payment.transaction_id}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Terms & Deposit Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Terms</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Terms:</Text>
              <Text style={styles.infoValue}>
                {invoice.payment_terms.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            {invoice.payment_terms === 'net_15' && (
              <View style={styles.infoRow}>
                <Ionicons name="trending-down" size={16} color={Colors.success} />
                <Text style={[styles.infoValue, { color: Colors.success }]}>
                  {invoice.early_payment_discount}% discount if paid within 15 days
                </Text>
              </View>
            )}
            {invoice.deposit_required && (
              <View style={styles.infoRow}>
                <Ionicons
                  name={invoice.deposit_paid ? 'checkmark-circle' : 'time'}
                  size={16}
                  color={invoice.deposit_paid ? Colors.success : Colors.warning}
                />
                <Text style={styles.infoLabel}>Deposit:</Text>
                <Text style={styles.infoValue}>
                  ${invoice.deposit_amount.toFixed(2)} ({invoice.deposit_paid ? 'Paid' : 'Required'})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issue Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(invoice.issue_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={[styles.infoValue, isOverdue() && { color: Colors.error }]}>
                {new Date(invoice.due_date).toLocaleDateString()}
                {isOverdue() && ' (Overdue)'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  if (isWeb) {
    return <WebAdminLayout>{content}</WebAdminLayout>;
  }

  return content;
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
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  paymentStatusCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  overdueCard: {
    borderColor: Colors.error,
    backgroundColor: '#fef2f2',
  },
  paymentStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  amountDue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentProgress: {
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: Colors.gray200,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recordPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  recordPaymentButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  addPaymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  picker: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: 'transparent',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  lineItemCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lineItemDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  lineItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  lineItemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  totalsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalRowFinal: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValueFinal: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  paymentDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paymentNotes: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  transactionId: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
});