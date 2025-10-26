'use client';

import { Circle } from 'lucide-react';

interface EquipmentAvailabilityBadgeProps {
  status: 'available' | 'in_use' | 'maintenance';
  availableIn?: string | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function EquipmentAvailabilityBadge({
  status,
  availableIn,
  showLabel = true,
  size = 'md',
}: EquipmentAvailabilityBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'available':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Available',
          dotColor: 'fill-green-500',
        };
      case 'in_use':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'In Use',
          dotColor: 'fill-yellow-600',
        };
      case 'maintenance':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Maintenance',
          dotColor: 'fill-red-500',
        };
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          dotColor: 'fill-gray-500',
        };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    sm: {
      dot: 'w-2 h-2',
      text: 'text-xs',
      padding: 'px-2 py-0.5',
    },
    md: {
      dot: 'w-2.5 h-2.5',
      text: 'text-sm',
      padding: 'px-2.5 py-1',
    },
    lg: {
      dot: 'w-3 h-3',
      text: 'text-base',
      padding: 'px-3 py-1.5',
    },
  };

  const sizes = sizeClasses[size];

  if (!showLabel) {
    // Just show the dot
    return (
      <div className="inline-flex items-center" title={`${config.label}${availableIn ? ` (available in ${availableIn})` : ''}`}>
        <Circle className={`${sizes.dot} ${config.dotColor}`} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${sizes.padding} rounded-full ${config.bgColor} border ${config.borderColor}`}
      title={availableIn ? `Available in ${availableIn}` : undefined}
    >
      <Circle className={`${sizes.dot} ${config.dotColor} animate-pulse`} />
      <span className={`font-medium ${config.color} ${sizes.text}`}>
        {config.label}
      </span>
      {availableIn && (
        <span className={`${sizes.text} ${config.color} opacity-75`}>
          ({availableIn})
        </span>
      )}
    </div>
  );
}
