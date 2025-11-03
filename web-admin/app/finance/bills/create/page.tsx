'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  Calculator,
  Upload,
  X
} from 'lucide-react';

interface Vendor {
  _id: string;
  vendor_name: string;
  vendor_code: string;
  payment_terms: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax: number;
  total: number;
  gl_account: string;
}

export default function CreateBillPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  
  // Bill form data
  const [billData, setBillData] = useState({
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    reference_number: '',
    memo: ''
  });

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unit_price: 0,
      tax: 0,
      total: 0,
      gl_account: ''
    }
  ]);

  const [taxRate, setTaxRate] = useState(13); // Default tax rate (HST in Ontario)

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    // Calculate due date based on payment terms
    if (billData.bill_date && billData.payment_terms) {
      const billDate = new Date(billData.bill_date);
      let daysToAdd = 30;

      if (billData.payment_terms === 'Net 15') daysToAdd = 15;
      else if (billData.payment_terms === 'Net 30') daysToAdd = 30;
      else if (billData.payment_terms === 'Net 45') daysToAdd = 45;
      else if (billData.payment_terms === 'Net 60') daysToAdd = 60;
      else if (billData.payment_terms === 'Due on Receipt') daysToAdd = 0;

      const dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);

      setBillData(prev => ({
        ...prev,
        due_date: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [billData.bill_date, billData.payment_terms]);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/api/vendors?status_filter=active');
      if (response.data.success) {
        setVendors(response.data.vendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const calculateLineTotal = (quantity: number, unitPrice: number, taxRate: number) => {
    const subtotal = quantity * unitPrice;
    const tax = (subtotal * taxRate) / 100;
    return subtotal + tax;
  };

  const handleLineItemChange = (id: string, field: string, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Recalculate if quantity, unit_price, or tax changed
        if (field === 'quantity' || field === 'unit_price') {
          const subtotal = updated.quantity * updated.unit_price;
          updated.tax = (subtotal * taxRate) / 100;
          updated.total = subtotal + updated.tax;
        }
        
        return updated;
      }
      return item;
    }));
  };

  const addLineItem = () => {
    const newId = (lineItems.length + 1).toString();
    setLineItems([...lineItems, {
      id: newId,
      description: '',
      quantity: 1,
      unit_price: 0,
      tax: 0,
      total: 0,
      gl_account: ''
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    
    const taxTotal = lineItems.reduce((sum, item) => sum + item.tax, 0);
    const total = subtotal + taxTotal;

    return { subtotal, taxTotal, total };
  };

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendor(vendorId);
    const vendor = vendors.find(v => v._id === vendorId);
    if (vendor) {
      setBillData(prev => ({
        ...prev,
        payment_terms: vendor.payment_terms
      }));
    }
  };

  const handleSubmit = async (isDraft: boolean) => {
    try {
      // Validation
      if (!selectedVendor) {
        alert('Please select a vendor');
        return;
      }

      if (lineItems.some(item => !item.description || item.quantity <= 0 || item.unit_price < 0)) {
        alert('Please fill in all line items correctly');
        return;
      }

      setLoading(true);

      const payload = {
        vendor_id: selectedVendor,
        bill_date: new Date(billData.bill_date).toISOString(),
        due_date: new Date(billData.due_date).toISOString(),
        payment_terms: billData.payment_terms,
        reference_number: billData.reference_number,
        memo: billData.memo,
        line_items: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax: item.tax,
          total: item.total,
          gl_account: item.gl_account || null
        }))
      };

      const response = await api.post('/api/bills', payload);

      if (response.data.success) {
        const billId = response.data.bill._id;
        
        // If not draft, submit for approval
        if (!isDraft) {
          await api.post(`/api/bills/${billId}/submit`);
        }

        alert(isDraft ? 'Bill saved as draft' : 'Bill submitted for approval');
        router.push('/finance/bills');
      }
    } catch (error: any) {
      console.error('Error creating bill:', error);
      alert(error.response?.data?.detail || 'Error creating bill');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxTotal, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Create Bill"
        subtitle="Create a new vendor bill"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Finance", href: "/finance" },
          { label: "Bills", href: "/finance/bills" },
          { label: "Create" }
        ]}
      />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header Actions */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/finance/bills')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Bills
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  Submit for Approval
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Vendor Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor *
                </label>
                <select
                  value={selectedVendor}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  required
                >
                  <option value="">Select a vendor...</option>
                  {vendors.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.vendor_name} ({vendor.vendor_code})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => router.push('/vendors/create')}
                  className="mt-2 text-sm text-[#3f72af] hover:text-[#2c5282]"
                >
                  + Create New Vendor
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={billData.reference_number}
                  onChange={(e) => setBillData({ ...billData, reference_number: e.target.value })}
                  placeholder="Invoice #, PO #, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                />
              </div>
            </div>

            {/* Dates and Terms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill Date *
                </label>
                <input
                  type="date"
                  value={billData.bill_date}
                  onChange={(e) => setBillData({ ...billData, bill_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms *
                </label>
                <select
                  value={billData.payment_terms}
                  onChange={(e) => setBillData({ ...billData, payment_terms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={billData.due_date}
                  onChange={(e) => setBillData({ ...billData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Tax Rate (%):</label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <button
                    onClick={addLineItem}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Tax</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lineItems.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                              placeholder="Item description..."
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(item.id, 'quantity', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                              min="0"
                              step="1"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => handleLineItemChange(item.id, 'unit_price', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              ${item.tax.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              ${item.total.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {lineItems.length > 1 && (
                              <button
                                onClick={() => removeLineItem(item.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full md:w-96 space-y-3 bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span className="font-medium text-gray-900">${taxTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Memo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memo / Notes
              </label>
              <textarea
                value={billData.memo}
                onChange={(e) => setBillData({ ...billData, memo: e.target.value })}
                rows={3}
                placeholder="Add any additional notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
