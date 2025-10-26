'use client';

import { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface ServiceCostItem {
  name: string;
  quantity: number;
  rate: number;
  type: 'equipment' | 'consumable' | 'labor' | 'other';
}

interface ServiceCostCalculatorProps {
  baseRate?: number;
  equipment?: ServiceCostItem[];
  consumables?: ServiceCostItem[];
  laborHours?: number;
  laborRate?: number;
  markup?: number; // percentage
  showProfit?: boolean;
  compact?: boolean;
}

export default function ServiceCostCalculator({
  baseRate = 0,
  equipment = [],
  consumables = [],
  laborHours = 0,
  laborRate = 50,
  markup = 20,
  showProfit = true,
  compact = false,
}: ServiceCostCalculatorProps) {
  const [totals, setTotals] = useState({
    equipmentCost: 0,
    consumablesCost: 0,
    laborCost: 0,
    subtotal: 0,
    markupAmount: 0,
    total: 0,
    profitMargin: 0,
  });

  useEffect(() => {
    calculateTotals();
  }, [baseRate, equipment, consumables, laborHours, laborRate, markup]);

  const calculateTotals = () => {
    // Calculate equipment costs
    const equipmentCost = equipment.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);

    // Calculate consumables costs
    const consumablesCost = consumables.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);

    // Calculate labor costs
    const laborCost = laborHours * laborRate;

    // Calculate subtotal (base + all costs)
    const subtotal = baseRate + equipmentCost + consumablesCost + laborCost;

    // Calculate markup
    const markupAmount = subtotal * (markup / 100);

    // Calculate total with markup
    const total = subtotal + markupAmount;

    // Calculate profit margin
    const profitMargin = total > 0 ? ((markupAmount / total) * 100) : 0;

    setTotals({
      equipmentCost,
      consumablesCost,
      laborCost,
      subtotal,
      markupAmount,
      total,
      profitMargin,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">Estimated Total</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(totals.total)}
            </div>
            {showProfit && totals.profitMargin > 0 && (
              <div className="text-xs text-gray-600">
                {totals.profitMargin.toFixed(1)}% margin
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border-2 border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100 p-4">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 rounded-full p-2">
            <Calculator className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Cost Breakdown</h3>
            <p className="text-xs text-gray-600">Real-time service cost calculation</p>
          </div>
        </div>
      </div>

      {/* Cost Items */}
      <div className="p-4 space-y-3">
        {/* Base Service Rate */}
        {baseRate > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Base Service Rate</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(baseRate)}
            </span>
          </div>
        )}

        {/* Equipment Costs */}
        {equipment.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">
                Equipment ({equipment.length} items)
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(totals.equipmentCost)}
              </span>
            </div>
            <div className="pl-4 space-y-1">
              {equipment.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                  <span>• {item.name} ({item.quantity}x)</span>
                  <span>{formatCurrency(item.quantity * item.rate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consumables Costs */}
        {consumables.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">
                Consumables ({consumables.length} items)
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(totals.consumablesCost)}
              </span>
            </div>
            <div className="pl-4 space-y-1">
              {consumables.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                  <span>• {item.name} ({item.quantity}x)</span>
                  <span>{formatCurrency(item.quantity * item.rate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Labor Costs */}
        {laborHours > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">
              Labor ({laborHours}h @ {formatCurrency(laborRate)}/h)
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(totals.laborCost)}
            </span>
          </div>
        )}

        {/* Subtotal */}
        <div className="flex items-center justify-between py-2 border-t-2 border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Subtotal (Cost)</span>
          <span className="text-sm font-bold text-gray-900">
            {formatCurrency(totals.subtotal)}
          </span>
        </div>

        {/* Markup */}
        {markup > 0 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700">Markup ({markup}%)</span>
            <span className="text-sm font-semibold text-green-600">
              +{formatCurrency(totals.markupAmount)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-base font-bold text-gray-900">Total Price</span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>

        {/* Profit Margin */}
        {showProfit && totals.profitMargin > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Profit Margin</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {totals.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Warning if no profit */}
        {showProfit && totals.total > 0 && totals.profitMargin < 10 && (
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900">Low Profit Margin</p>
                <p className="text-xs text-amber-700 mt-1">
                  Consider increasing the markup to maintain profitability.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
