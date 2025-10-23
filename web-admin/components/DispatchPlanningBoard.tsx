"use client";

import React, { useState, useEffect } from 'react';
import { useWebSocketEvent, EventType } from '@/lib/WebSocketContext';

interface WorkOrder {
  id: string;
  customer_name: string;
  site_address: string;
  service_type: string;
  status: string;
  priority: string;
  assigned_crew_id?: string;
  assigned_crew_name?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_duration_hours: number;
  weather_triggered: boolean;
}

interface Crew {
  id: string;
  name: string;
  status: string;
  assigned_work_orders: number;
  availability: string;
}

interface DispatchBoardData {
  work_orders: {
    unassigned: WorkOrder[];
    assigned: WorkOrder[];
    in_progress: WorkOrder[];
    completed: WorkOrder[];
  };
  crews: Crew[];
  summary: {
    total_work_orders: number;
    unassigned: number;
    assigned: number;
    in_progress: number;
    completed: number;
    available_crews: number;
  };
}

export default function DispatchPlanningBoard() {
  const [boardData, setBoardData] = useState<DispatchBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [draggedWorkOrder, setDraggedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);

  // Subscribe to real-time work order updates
  useWebSocketEvent(EventType.WORK_ORDER_ASSIGNED, () => {
    fetchBoardData();
  });

  useWebSocketEvent(EventType.WORK_ORDER_UPDATED, () => {
    fetchBoardData();
  });

  useEffect(() => {
    fetchBoardData();
  }, [selectedDate, view]);

  const fetchBoardData = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(
        `${backendUrl}/api/dispatch-board/board?date=${selectedDate}&view=${view}`
      );
      const data = await response.json();
      if (data.success) {
        setBoardData(data);
      }
    } catch (error) {
      console.error('Error fetching dispatch board:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignCrew = async (workOrderId: string, crewId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      
      // Default to 8 AM today if not scheduled
      const scheduledStart = new Date();
      scheduledStart.setHours(8, 0, 0, 0);

      const response = await fetch(`${backendUrl}/api/dispatch-board/assign-crew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_order_id: workOrderId,
          crew_id: crewId,
          scheduled_start: scheduledStart.toISOString(),
          estimated_duration_hours: 2.0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchBoardData();
        if (data.conflicts > 0) {
          alert(`Warning: Crew has ${data.conflicts} conflicting assignments`);
        }
      } else {
        alert('Failed to assign crew');
      }
    } catch (error) {
      console.error('Error assigning crew:', error);
      alert('Error assigning crew');
    }
  };

  const unassignCrew = async (workOrderId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(
        `${backendUrl}/api/dispatch-board/unassign-crew/${workOrderId}`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (data.success) {
        fetchBoardData();
      }
    } catch (error) {
      console.error('Error unassigning crew:', error);
    }
  };

  const optimizeSchedule = async () => {
    if (!confirm('Auto-optimize today\'s schedule? This will assign unassigned work orders.')) {
      return;
    }

    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(
        `${backendUrl}/api/dispatch-board/optimize?date=${selectedDate}`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchBoardData();
      }
    } catch (error) {
      console.error('Error optimizing schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (workOrder: WorkOrder) => {
    setDraggedWorkOrder(workOrder);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (crewId: string) => {
    if (draggedWorkOrder) {
      assignCrew(draggedWorkOrder.id, crewId);
      setDraggedWorkOrder(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'normal': return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'low': return 'bg-gray-100 border-gray-500 text-gray-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const WorkOrderCard = ({ workOrder }: { workOrder: WorkOrder }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(workOrder)}
      onClick={() => setSelectedWorkOrder(workOrder)}
      className={`p-3 mb-2 rounded-lg border-l-4 cursor-move hover:shadow-md transition-shadow ${getPriorityColor(
        workOrder.priority
      )}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{workOrder.customer_name}</h4>
          <p className="text-xs text-gray-600 mt-1">{workOrder.site_address}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-white px-2 py-1 rounded">
              {workOrder.service_type}
            </span>
            {workOrder.weather_triggered && (
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                ❄️ Weather
              </span>
            )}
            <span className="text-xs text-gray-500">
              {workOrder.estimated_duration_hours}h
            </span>
          </div>
        </div>
        {workOrder.assigned_crew_id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              unassignCrew(workOrder.id);
            }}
            className="text-red-600 hover:text-red-800 text-xs"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading dispatch board...</div>
      </div>
    );
  }

  if (!boardData) {
    return <div>No data available</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispatch Planning Board</h1>
        <p className="text-gray-600">
          Drag and drop work orders to assign crews. Real-time updates enabled.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-3 py-2"
            />

            {/* View Toggle */}
            <div className="flex gap-2">
              {(['day', 'week', 'month'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded ${
                    view === v
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={fetchBoardData}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              🔄 Refresh
            </button>
            <button
              onClick={optimizeSchedule}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              🤖 Auto-Optimize
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold">{boardData.summary.total_work_orders}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-700">{boardData.summary.unassigned}</div>
            <div className="text-xs text-gray-600">Unassigned</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-700">{boardData.summary.assigned}</div>
            <div className="text-xs text-gray-600">Assigned</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded">
            <div className="text-2xl font-bold text-purple-700">{boardData.summary.in_progress}</div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-700">{boardData.summary.available_crews}</div>
            <div className="text-xs text-gray-600">Available Crews</div>
          </div>
        </div>
      </div>

      {/* Main Board */}
      <div className="grid grid-cols-12 gap-6">
        {/* Unassigned Column */}
        <div className="col-span-3 bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
            📋 Unassigned
            <span className="text-sm font-normal bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              {boardData.work_orders.unassigned.length}
            </span>
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {boardData.work_orders.unassigned.map((wo) => (
              <WorkOrderCard key={wo.id} workOrder={wo} />
            ))}
            {boardData.work_orders.unassigned.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">
                No unassigned work orders
              </p>
            )}
          </div>
        </div>

        {/* Crews Columns */}
        <div className="col-span-9 grid grid-cols-3 gap-4">
          {boardData.crews.slice(0, 6).map((crew) => (
            <div
              key={crew.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(crew.id)}
              className={`bg-white rounded-lg shadow p-4 ${
                crew.availability === 'available' ? 'border-2 border-green-300' : 'border-2 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">{crew.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    crew.availability === 'available'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {crew.availability}
                </span>
              </div>

              <div className="text-xs text-gray-600 mb-4">
                {crew.assigned_work_orders} work order(s)
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {boardData.work_orders.assigned
                  .filter((wo) => wo.assigned_crew_id === crew.id)
                  .map((wo) => (
                    <WorkOrderCard key={wo.id} workOrder={wo} />
                  ))}
                {boardData.work_orders.in_progress
                  .filter((wo) => wo.assigned_crew_id === crew.id)
                  .map((wo) => (
                    <WorkOrderCard key={wo.id} workOrder={wo} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Order Detail Modal */}
      {selectedWorkOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedWorkOrder(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Work Order Details</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Customer:</strong> {selectedWorkOrder.customer_name}</p>
              <p><strong>Address:</strong> {selectedWorkOrder.site_address}</p>
              <p><strong>Service:</strong> {selectedWorkOrder.service_type}</p>
              <p><strong>Priority:</strong> {selectedWorkOrder.priority}</p>
              <p><strong>Status:</strong> {selectedWorkOrder.status}</p>
              {selectedWorkOrder.assigned_crew_name && (
                <p><strong>Assigned to:</strong> {selectedWorkOrder.assigned_crew_name}</p>
              )}
              {selectedWorkOrder.scheduled_start && (
                <p><strong>Scheduled:</strong> {new Date(selectedWorkOrder.scheduled_start).toLocaleString()}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedWorkOrder(null)}
              className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
