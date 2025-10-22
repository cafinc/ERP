'use client';

import { useState } from 'react';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import { MapPin, Plus, Trash2 } from 'lucide-react';

export default function ServiceAreasPage() {
  const [areas, setAreas] = useState([
    { id: 1, name: 'Downtown Toronto', radius: 25, active: true },
    { id: 2, name: 'North York', radius: 30, active: true },
  ]);

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <CompactHeader
            title="Service Areas"
            subtitle="Define the areas where you provide services"
            icon={MapPin}
            backUrl="/settings"
            actions={[
              {
                label: 'Add Area',
                onClick: () => {},
                icon: Plus,
                variant: 'primary' as const,
              },
            ]}
          />

          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="space-y-4">
              {areas.map((area) => (
                <div key={area.id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{area.name}</p>
                      <p className="text-sm text-gray-600">Radius: {area.radius} km</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={area.active} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
