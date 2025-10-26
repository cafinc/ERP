'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Briefcase, FileText, DollarSign, MessageSquare, Package, Wrench, Users } from 'lucide-react';

interface RelatedRecord {
  type: 'sites' | 'work_orders' | 'invoices' | 'messages' | 'equipment' | 'consumables' | 'employees' | 'projects';
  count: number;
  label?: string;
  url?: string;
}

interface RelatedRecordsQuickLinksProps {
  entityType: 'customer' | 'site' | 'equipment' | 'service' | 'employee';
  entityId: string;
  records: RelatedRecord[];
  title?: string;
  columns?: 2 | 3 | 4;
}

export default function RelatedRecordsQuickLinks({
  entityType,
  entityId,
  records,
  title = 'Related Records',
  columns = 4,
}: RelatedRecordsQuickLinksProps) {
  const router = useRouter();

  const getRecordConfig = (type: RelatedRecord['type']) => {
    switch (type) {
      case 'sites':
        return {
          icon: MapPin,
          color: 'purple',
          bgColor: 'bg-purple-50',
          iconColor: 'text-purple-500',
          hoverBg: 'hover:bg-purple-100',
          borderColor: 'border-purple-200',
          label: 'Sites',
          defaultUrl: `/sites?${entityType}_id=${entityId}`,
        };
      case 'work_orders':
        return {
          icon: Briefcase,
          color: 'blue',
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-500',
          hoverBg: 'hover:bg-blue-100',
          borderColor: 'border-blue-200',
          label: 'Work Orders',
          defaultUrl: `/work-orders?${entityType}_id=${entityId}`,
        };
      case 'invoices':
        return {
          icon: DollarSign,
          color: 'green',
          bgColor: 'bg-green-50',
          iconColor: 'text-green-500',
          hoverBg: 'hover:bg-green-100',
          borderColor: 'border-green-200',
          label: 'Invoices',
          defaultUrl: `/invoices?${entityType}_id=${entityId}`,
        };
      case 'messages':
        return {
          icon: MessageSquare,
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          iconColor: 'text-yellow-600',
          hoverBg: 'hover:bg-yellow-100',
          borderColor: 'border-yellow-200',
          label: 'Messages',
          defaultUrl: `/communication?${entityType}_id=${entityId}`,
        };
      case 'equipment':
        return {
          icon: Wrench,
          color: 'indigo',
          bgColor: 'bg-indigo-50',
          iconColor: 'text-indigo-500',
          hoverBg: 'hover:bg-indigo-100',
          borderColor: 'border-indigo-200',
          label: 'Equipment',
          defaultUrl: `/inventory?type=equipment&${entityType}_id=${entityId}`,
        };
      case 'consumables':
        return {
          icon: Package,
          color: 'pink',
          bgColor: 'bg-pink-50',
          iconColor: 'text-pink-500',
          hoverBg: 'hover:bg-pink-100',
          borderColor: 'border-pink-200',
          label: 'Consumables',
          defaultUrl: `/consumables?${entityType}_id=${entityId}`,
        };
      case 'employees':
        return {
          icon: Users,
          color: 'teal',
          bgColor: 'bg-teal-50',
          iconColor: 'text-teal-500',
          hoverBg: 'hover:bg-teal-100',
          borderColor: 'border-teal-200',
          label: 'Employees',
          defaultUrl: `/hr/employees?${entityType}_id=${entityId}`,
        };
      case 'projects':
        return {
          icon: FileText,
          color: 'orange',
          bgColor: 'bg-orange-50',
          iconColor: 'text-orange-500',
          hoverBg: 'hover:bg-orange-100',
          borderColor: 'border-orange-200',
          label: 'Projects',
          defaultUrl: `/projects?${entityType}_id=${entityId}`,
        };
      default:
        return {
          icon: FileText,
          color: 'gray',
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-500',
          hoverBg: 'hover:bg-gray-100',
          borderColor: 'border-gray-200',
          label: type,
          defaultUrl: `/${type}?${entityType}_id=${entityId}`,
        };
    }
  };

  const handleClick = (record: RelatedRecord) => {
    const config = getRecordConfig(record.type);
    const url = record.url || config.defaultUrl;
    router.push(url);
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {records.map((record) => {
          const config = getRecordConfig(record.type);
          const Icon = config.icon;
          const label = record.label || config.label;

          return (
            <button
              key={record.type}
              onClick={() => handleClick(record)}
              className={`${config.bgColor} rounded-xl p-4 border-2 ${config.borderColor} ${config.hoverBg} transition-all hover:shadow-md transform hover:scale-105 cursor-pointer text-left`}
            >
              <div className="flex flex-col items-start">
                <Icon className={`w-6 h-6 ${config.iconColor} mb-2`} />
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {record.count}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
