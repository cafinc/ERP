import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function CreateEstimateScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [terms, setTerms] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [expirationDays, setExpirationDays] = useState<string>('30');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers?active=true');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }
    
    setLineItems(updated);
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    
    let discountAmount = 0;
    if (discountType === 'amount') {
      discountAmount = parseFloat(discountValue) || 0;
    } else {
      discountAmount = subtotal * (parseFloat(discountValue) || 0) / 100;
    }
    
    const preTaxTotal = subtotal - discountAmount;
    const taxAmount = preTaxTotal * 0.05; // 5% GST
    const total = preTaxTotal + taxAmount;
    
    return { subtotal, discountAmount, preTaxTotal, taxAmount, total };
  };

  const handleSave = async (asDraft: boolean) => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    
    if (lineItems.some(item => !item.description)) {
      Alert.alert('Error', 'All line items must have a description');
      return;
    }
    
    try {
      setSaving(true);
      
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays || '30'));
      
      const payload = {
        customer_id: selectedCustomer,
        line_items: lineItems,
        discount_amount: discountType === 'amount' ? parseFloat(discountValue) || 0 : 0,
        discount_percentage: discountType === 'percentage' ? parseFloat(discountValue) || 0 : 0,
        expiration_date: expirationDate.toISOString(),
        terms_and_conditions: terms,
        notes: notes,
        attachments: []
      };
      
      const response = await api.post('/estimates', payload);
      
      Alert.alert(
        'Success',
        `Estimate ${response.data.estimate_number} created successfully!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error creating estimate:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create estimate');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Estimate</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer *</Text>
          <View style={styles.pickerContainer}>
            <Ionicons name="person" size={20} color={Colors.gray400} />
            <Text style={styles.pickerLabel}>Select Customer:</Text>
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <select
                style={styles.picker as any}
                value={selectedCustomer}
                onChange={(e: any) => setSelectedCustomer(e.target.value)}
              >
                <option value="">-- Select Customer --</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            )}
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Line Items</Text>
            <TouchableOpacity style={styles.addButton} onPress={addLineItem}>
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          
          {lineItems.map((item, index) => (
            <View key={index} style={styles.lineItemCard}>
              <View style={styles.lineItemHeader}>
                <Text style={styles.lineItemLabel}>Item {index + 1}</Text>
                {lineItems.length > 1 && (
                  <TouchableOpacity onPress={() => removeLineItem(index)}>
                    <Ionicons name="trash" size={18} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={item.description}
                onChangeText={(text) => updateLineItem(index, 'description', text)}
              />
              
              <View style={styles.lineItemRow}>
                <View style={styles.lineItemSmallInput}>
                  <Text style={styles.inputLabel}>Qty</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    keyboardType="numeric"
                    value={item.quantity.toString()}
                    onChangeText={(text) => updateLineItem(index, 'quantity', parseFloat(text) || 0)}
                  />
                </View>
                
                <View style={styles.lineItemMediumInput}>
                  <Text style={styles.inputLabel}>Unit Price</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={item.unit_price.toString()}
                    onChangeText={(text) => updateLineItem(index, 'unit_price', parseFloat(text) || 0)}
                  />
                </View>
                
                <View style={styles.lineItemMediumInput}>
                  <Text style={styles.inputLabel}>Total</Text>
                  <View style={[styles.input, styles.totalDisplay]}>
                    <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Discount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discount (Optional)</Text>
          <View style={styles.discountRow}>
            <View style={styles.discountTypeButtons}>
              <TouchableOpacity
                style={[styles.discountTypeButton, discountType === 'amount' && styles.discountTypeButtonActive]}
                onPress={() => setDiscountType('amount')}
              >
                <Text style={[styles.discountTypeText, discountType === 'amount' && styles.discountTypeTextActive]}>$</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.discountTypeButton, discountType === 'percentage' && styles.discountTypeButtonActive]}
                onPress={() => setDiscountType('percentage')}
              >
                <Text style={[styles.discountTypeText, discountType === 'percentage' && styles.discountTypeTextActive]}>%</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.discountInput]}
              placeholder="0"
              keyboardType="numeric"
              value={discountValue}
              onChangeText={setDiscountValue}
            />
          </View>
        </View>

        {/* Totals Summary */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${totals.subtotal.toFixed(2)}</Text>
          </View>
          {totals.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={[styles.totalValue, { color: Colors.error }]}>-${totals.discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Pre-Tax Total:</Text>
            <Text style={styles.totalValue}>${totals.preTaxTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST (5%):</Text>
            <Text style={styles.totalValue}>${totals.taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelFinal}>Total:</Text>
            <Text style={styles.totalValueFinal}>${totals.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter terms and conditions..."
            value={terms}
            onChangeText={setTerms}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Internal notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Expiration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valid For (Days)</Text>
          <TextInput
            style={styles.input}
            placeholder="30"
            keyboardType="numeric"
            value={expirationDays}
            onChangeText={setExpirationDays}
          />
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary + '10',
    borderRadius: 6,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  pickerLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  picker: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
  },
  lineItemCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  lineItemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lineItemSmallInput: {
    flex: 1,
  },
  lineItemMediumInput: {
    flex: 2,
  },
  totalDisplay: {
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  discountRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  discountTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  discountTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  discountTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  discountTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  discountTypeTextActive: {
    color: Colors.white,
  },
  discountInput: {
    flex: 1,
    marginBottom: 0,
  },
  totalsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});