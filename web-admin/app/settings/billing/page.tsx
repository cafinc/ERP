'use client';

import { useState } from 'react';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import { CreditCard, Download, Calendar } from 'lucide-react';

export default function BillingPage() {
  const invoices = [
    { id: 1, date: '2024-10-01', amount: 99.00, status: 'paid' },
    { id: 2, date: '2024-09-01', amount: 99.00, status: 'paid' },
  ];

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <CompactHeader
            title="Billing & Subscription"
            subtitle="Manage your subscription and billing information"
            icon={CreditCard}
            backUrl="/settings"
          />

          {/* Current Plan */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Current Plan</h2>
                <p className="text-sm text-gray-500">Your subscription details</p>
              </div>
              <span className="px-4 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-sm font-semibold">Professional</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Monthly Price</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">$99</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Billing</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">Nov 1</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-2xl font-bold text-green-600 mt-1">Active</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-600">Expires 12/2025</p>
                </div>
              </div>
              <button className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm">
                Update
              </button>
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing History</h2>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">${invoice.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{invoice.date}</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 text-[#3f72af] hover:bg-blue-50 rounded-lg transition-all">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
