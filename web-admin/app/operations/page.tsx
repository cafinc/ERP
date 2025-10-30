'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import SimpleNavigationTopBar from '@/components/SimpleNavigationTopBar';
import {
  ClipboardList,
  Plus,
  User,
  Calendar,
  Clock,
  AlertCircle,
  Package,
  ShoppingCart,
  FolderOpen,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  items: PipelineItem[];
}

interface PipelineItem {
  id: string;
  title: string;
  type: 'work_order' | 'purchase_order' | 'project';
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  customer?: string;
}

export default function OperationsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<PipelineItem | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    try {
      setLoading(true);
      // Mock pipeline data
      const mockStages: PipelineStage[] = [
        {
          id: 'pending',
          name: 'Pending',
          color: 'bg-yellow-100 border-yellow-300',
          items: [
            {
              id: 'wo-1',
              title: 'Snow Removal - Parking Lot A',
              type: 'work_order',
              assignee: 'John Doe',
              priority: 'high',
              due_date: '2024-01-15',
              customer: 'ABC Corp',
            },
            {
              id: 'po-1',
              title: 'Rock Salt Purchase',
              type: 'purchase_order',
              assignee: 'Jane Smith',
              priority: 'medium',
              due_date: '2024-01-17',
            },
          ],
        },
        {
          id: 'in_progress',
          name: 'In Progress',
          color: 'bg-blue-100 border-blue-300',
          items: [
            {
              id: 'wo-2',
              title: 'Ice Melting - Front Entrance',
              type: 'work_order',
              assignee: 'Mike Johnson',
              priority: 'urgent',
              due_date: '2024-01-14',
              customer: 'XYZ Industries',
            },
            {
              id: 'proj-1',
              title: 'Winter Maintenance Contract',
              type: 'project',
              assignee: 'Sarah Williams',
              priority: 'high',
              due_date: '2024-02-28',
              customer: 'City Plaza',
            },
          ],
        },
        {
          id: 'review',
          name: 'Review',
          color: 'bg-purple-100 border-purple-300',
          items: [
            {
              id: 'wo-3',
              title: 'Equipment Inspection',
              type: 'work_order',
              assignee: 'Tom Davis',
              priority: 'medium',
              due_date: '2024-01-16',
            },
          ],
        },
        {
          id: 'completed',
          name: 'Completed',
          color: 'bg-green-100 border-green-300',
          items: [
            {
              id: 'wo-4',
              title: 'Emergency Snow Clearing',
              type: 'work_order',
              assignee: 'John Doe',
              priority: 'urgent',
              due_date: '2024-01-13',
              customer: 'Mall Central',
            },
            {
              id: 'po-2',
              title: 'Safety Equipment Order',
              type: 'purchase_order',
              assignee: 'Jane Smith',
              priority: 'low',
              due_date: '2024-01-12',
            },
          ],
        },
      ];
      setStages(mockStages);
    } catch (error) {
      console.error('Error loading pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (item: PipelineItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: string) => {
    if (!draggedItem) return;

    setStages(prevStages => {
      const newStages = prevStages.map(stage => ({
        ...stage,
        items: stage.items.filter(item => item.id !== draggedItem.id),
      }));

      const targetStage = newStages.find(s => s.id === stageId);
      if (targetStage) {
        targetStage.items.push(draggedItem);
      }

      return newStages;
    });

    setDraggedItem(null);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'work_order':
        return <ClipboardList className="w-4 h-4" />;
      case 'purchase_order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'project':
        return <FolderOpen className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getTotalStats = () => {
    const totalItems = stages.reduce((sum, stage) => sum + stage.items.length, 0);
    const workOrders = stages.reduce((sum, stage) => 
      sum + stage.items.filter(item => item.type === 'work_order').length, 0);
    const purchaseOrders = stages.reduce((sum, stage) => 
      sum + stage.items.filter(item => item.type === 'purchase_order').length, 0);
    const projects = stages.reduce((sum, stage) => 
      sum + stage.items.filter(item => item.type === 'project').length, 0);

    return { totalItems, workOrders, purchaseOrders, projects };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <PageHeader>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <PageHeader
            title="Operations Dashboard"
            subtitle="Manage operations pipeline"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Operations" },
            ]}
          />
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
          </div></div>
      </PageHeader>
    );
  }

  return (
    <PageHeader>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader
          title="Operations Dashboard"
          subtitle="Visual pipeline for all operations"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Operations" },
          ]}
          actions={[
            {
              label: "Work Orders",
              icon: <ClipboardList className="w-4 h-4 mr-2" />,
              variant: "secondary",
              onClick: () => router.push('/work-orders'),
            },
            {
              label: "Purchase Orders",
              icon: <ShoppingCart className="w-4 h-4 mr-2" />,
              variant: "secondary",
              onClick: () => router.push('/purchase-orders'),
            },
            {
              label: "Projects",
              icon: <FolderOpen className="w-4 h-4 mr-2" />,
              variant: "secondary",
              onClick: () => router.push('/projects'),
            },
          ]}
        />

        {/* Stats Cards */}
        <div className="p-6 pb-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-[#3f72af]" />
              </div></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Work Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.workOrders}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-blue-600" />
              </div></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Purchase Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.purchaseOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.projects}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-purple-600" />
              </div></div></div></div>

        {/* Pipeline Board */}
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Stage Header */}
                <div className={`rounded-t-lg border-2 ${stage.color} p-3 mb-2`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-gray-700">
                      {stage.items.length}
                    </span>
                  </div></div>

                {/* Stage Items */}
                <div className="space-y-3">
                  {stage.items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
                    >
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          {getItemIcon(item.type)}
                          <span className="text-xs uppercase font-medium">
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>

                      {/* Item Title */}
                      <h4 className="font-medium text-gray-900 mb-3 line-clamp-2">
                        {item.title}
                      </h4>

                      {/* Item Details */}
                      <div className="space-y-2 text-sm text-gray-600">
                        {item.customer && (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span className="truncate">{item.customer}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span>{item.assignee}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.due_date)}</span>
                        </div></div></div>
                  ))}

                  {/* Add New Button */}
                  <button
                    onClick={() => {
                      if (stage.id === 'pending') {
                        alert('Add new item - functionality to be implemented');
                      }
                    }}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#3f72af] hover:text-[#3f72af] transition-colors"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button></div></div>
            ))}
          </div></div></div>
    </PageHeader>
  );
}
