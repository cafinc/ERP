import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UserStatus } from '../types';

interface StatusIndicatorProps {
  status: UserStatus;
  size?: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status = 'offline', 
  size = 10 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'on_shift':
        return '#10b981'; // Green
      case 'busy':
        return '#f59e0b'; // Yellow/Orange
      case 'off_shift':
        return '#ef4444'; // Red
      case 'offline':
      default:
        return '#9ca3af'; // Gray
    }
  };

  return (
    <View
      style={[
        styles.indicator,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getStatusColor(),
        }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});

export default StatusIndicator;
