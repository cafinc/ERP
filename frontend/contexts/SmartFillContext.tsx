import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UsagePattern {
  value: string;
  count: number;
  lastUsed: string;
  context?: string; // e.g., 'dispatch', 'site', 'customer'
}

interface SmartFillData {
  crews: UsagePattern[];
  equipment: UsagePattern[];
  services: UsagePattern[];
  contacts: UsagePattern[];
  addresses: UsagePattern[];
}

interface SmartFillContextType {
  smartFillData: SmartFillData;
  recordUsage: (category: keyof SmartFillData, value: string, context?: string) => Promise<void>;
  getSuggestions: (category: keyof SmartFillData, limit?: number, context?: string) => UsagePattern[];
  getLastUsed: (category: keyof SmartFillData) => UsagePattern | null;
  clearHistory: (category?: keyof SmartFillData) => Promise<void>;
}

const SmartFillContext = createContext<SmartFillContextType | undefined>(undefined);

const STORAGE_KEY = '@smart_fill_data';

const initialData: SmartFillData = {
  crews: [],
  equipment: [],
  services: [],
  contacts: [],
  addresses: [],
};

export const SmartFillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [smartFillData, setSmartFillData] = useState<SmartFillData>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSmartFillData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading smart fill data:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveData = async (data: SmartFillData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving smart fill data:', error);
    }
  };

  /**
   * Record usage of a value for auto-suggest
   */
  const recordUsage = async (
    category: keyof SmartFillData,
    value: string,
    context?: string
  ) => {
    if (!value || value.trim() === '') return;

    setSmartFillData((prev) => {
      const categoryData = [...prev[category]];
      const existingIndex = categoryData.findIndex(
        (item) => item.value === value && item.context === context
      );

      if (existingIndex >= 0) {
        // Update existing entry
        categoryData[existingIndex] = {
          ...categoryData[existingIndex],
          count: categoryData[existingIndex].count + 1,
          lastUsed: new Date().toISOString(),
        };
      } else {
        // Add new entry
        categoryData.push({
          value,
          count: 1,
          lastUsed: new Date().toISOString(),
          context,
        });
      }

      // Keep only top 50 items per category (sorted by usage)
      const sorted = categoryData
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);

      const newData = {
        ...prev,
        [category]: sorted,
      };

      saveData(newData);
      return newData;
    });
  };

  /**
   * Get suggestions based on usage frequency
   */
  const getSuggestions = (
    category: keyof SmartFillData,
    limit: number = 5,
    context?: string
  ): UsagePattern[] => {
    let data = smartFillData[category] || [];

    // Filter by context if provided
    if (context) {
      data = data.filter((item) => !item.context || item.context === context);
    }

    // Sort by count (most used first), then by lastUsed (most recent first)
    return data
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      })
      .slice(0, limit);
  };

  /**
   * Get the last used value
   */
  const getLastUsed = (category: keyof SmartFillData): UsagePattern | null => {
    const data = smartFillData[category] || [];
    if (data.length === 0) return null;

    return data.reduce((latest, current) => {
      const latestTime = new Date(latest.lastUsed).getTime();
      const currentTime = new Date(current.lastUsed).getTime();
      return currentTime > latestTime ? current : latest;
    });
  };

  /**
   * Clear history for a category or all categories
   */
  const clearHistory = async (category?: keyof SmartFillData) => {
    if (category) {
      const newData = {
        ...smartFillData,
        [category]: [],
      };
      setSmartFillData(newData);
      await saveData(newData);
    } else {
      setSmartFillData(initialData);
      await saveData(initialData);
    }
  };

  return (
    <SmartFillContext.Provider
      value={{
        smartFillData,
        recordUsage,
        getSuggestions,
        getLastUsed,
        clearHistory,
      }}
    >
      {children}
    </SmartFillContext.Provider>
  );
};

export const useSmartFill = () => {
  const context = useContext(SmartFillContext);
  if (context === undefined) {
    throw new Error('useSmartFill must be used within a SmartFillProvider');
  }
  return context;
};
