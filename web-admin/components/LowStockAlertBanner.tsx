'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X, Package, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

interface LowStockItem {
  id: string;
  name: string;
  current_stock: number;
  reorder_level: number;
  unit: string;
}

interface LowStockAlertBannerProps {
  onDismiss?: () => void;
  showDismissButton?: boolean;
}

export default function LowStockAlertBanner({ 
  onDismiss, 
  showDismissButton = true 
}: LowStockAlertBannerProps) {
  const router = useRouter();
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    loadLowStockItems();
  }, []);

  const loadLowStockItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consumables');
      const consumables = response.data || [];
      
      // Filter items that are at or below reorder level
      const lowStock = consumables.filter((item: any) => 
        item.current_stock <= (item.reorder_level || 0)
      );
      
      setLowStockItems(lowStock.map((item: any) => ({
        id: item.id || item._id,
        name: item.name,
        current_stock: item.current_stock,
        reorder_level: item.reorder_level || 0,
        unit: item.unit || 'units'
      })));
    } catch (error) {
      console.error('Error loading low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleViewInventory = () => {
    router.push('/consumables');
  };

  // Don't show if loading, dismissed, or no low stock items
  if (loading || isDismissed || lowStockItems.length === 0) {
    return null;
  }

  // Determine severity based on stock levels
  const criticalItems = lowStockItems.filter(item => item.current_stock === 0);
  const isCritical = criticalItems.length > 0;

  return (
    <div className={`${
      isCritical 
        ? 'bg-red-50 border-red-500' 
        : 'bg-yellow-50 border-yellow-500'
    } border-l-4 rounded-r-lg shadow-md mb-6 animate-slideDown`}>
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 ${
            isCritical ? 'text-red-500' : 'text-yellow-500'
          }`}>
            {isCritical ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Package className="w-6 h-6" />
            )}
          </div>
          
          {/* Content */}
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${
                isCritical ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {isCritical ? '⚠️ Critical Stock Alert' : '⚡ Low Stock Alert'}
              </h3>
              
              {/* Dismiss Button */}
              {showDismissButton && (
                <button
                  onClick={handleDismiss}
                  className={`ml-4 ${
                    isCritical 
                      ? 'text-red-400 hover:text-red-600' 
                      : 'text-yellow-400 hover:text-yellow-600'
                  } transition-colors`}
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className={`mt-2 text-sm ${
              isCritical ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {isCritical && criticalItems.length > 0 && (
                <p className="font-semibold mb-2">
                  🚨 {criticalItems.length} item{criticalItems.length > 1 ? 's' : ''} OUT OF STOCK
                </p>
              )}
              
              <p className="mb-2">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's need' : ' needs'} reordering:
              </p>
              
              {/* Item List */}
              <ul className="list-none space-y-1 mb-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-1">
                    <span className="font-medium">
                      • {item.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.current_stock === 0 
                        ? 'bg-red-600 text-white' 
                        : 'bg-yellow-600 text-white'
                    }`}>
                      {item.current_stock} {item.unit} 
                      {item.current_stock > 0 && ` (reorder at ${item.reorder_level})`}
                    </span>
                  </li>
                ))}
                {lowStockItems.length > 5 && (
                  <li className="text-xs italic">
                    +{lowStockItems.length - 5} more item{lowStockItems.length - 5 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>
              
              {/* Action Button */}
              <button
                onClick={handleViewInventory}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
                  isCritical
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                View Inventory & Reorder
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom warning for critical items */}
      {isCritical && (
        <div className="bg-red-600 px-4 py-2">
          <p className="text-xs text-white font-semibold text-center">
            ⚠️ Operations may be affected. Immediate action required.
          </p>
        </div>
      )}
    </div>
  );
}
