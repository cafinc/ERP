'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface FormResponse {
  id: string;
  template_name: string;
  submitted_at: string;
  crew_name: string;
  responses: { [key: string]: any };
}

interface Equipment {
  id: string;
  name: string;
  unit_number: string;
  equipment_type: string;
  status: string;
}

export default function EquipmentHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = params.id as string;
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (equipmentId) {
      loadData();
    }
  }, [equipmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, responsesRes] = await Promise.all([
        api.get(`/equipment/${equipmentId}`),
        api.get('/form-responses'),
      ]);

      setEquipment(equipmentRes.data);
      
      // Filter responses for this equipment and sort by date
      const equipmentForms = responsesRes.data
        .filter((response: any) => response.equipment_id === equipmentId)
        .sort((a: any, b: any) => 
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        );
      
      setFormResponses(equipmentForms);
    } catch (error) {
      console.error('Error fetching equipment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormStatus = (response: FormResponse) => {
    // Check if any field has "Fail" value
    const hasFails = Object.values(response.responses).some(
      (value: any) => value === 'Fail'
    );
    return hasFails ? 'Issues Found' : 'Passed';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const passedCount = formResponses.filter(r => getFormStatus(r) === 'Passed').length;
  const issuesCount = formResponses.filter(r => getFormStatus(r) === 'Issues Found').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="History"
        subtitle="Manage history"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Equipment", href: "/equipment" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    </div>
  );
  }

  return (
          <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspection History</h1>
            <p className="text-gray-600 mt-1">Complete inspection timeline for equipment</p>
          </div>

        {/* Equipment Info Card */}
        {equipment && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{equipment.name || equipment.unit_number}</h2>
                <p className="text-gray-600 capitalize">{equipment.equipment_type?.replace('_', ' ')}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  equipment.status === 'available' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {equipment.status}
                </span>
              </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-[#3f72af]" />
                <p className="text-3xl font-bold text-blue-900">{formResponses.length}</p>
                <p className="text-sm text-blue-700 mt-1">Total Inspections</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold text-green-900">{passedCount}</p>
                <p className="text-sm text-green-700 mt-1">Passed</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="text-3xl font-bold text-red-900">{issuesCount}</p>
                <p className="text-sm text-red-700 mt-1">Issues Found</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Inspection History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Inspection Timeline</h2>

          {formResponses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No Inspections Yet</p>
              <p className="text-sm text-gray-600 mt-2">
                Inspection forms submitted for this equipment will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formResponses.map((response) => {
                const status = getFormStatus(response);
                const isPassed = status === 'Passed';
                
                return (
                  <div
                    key={response.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/forms/${response.id}/view-response`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {isPassed ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{response.template_name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(response.submitted_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {response.crew_name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isPassed 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {status}
                      </span>
                    </div>

                    <div className="flex items-center justify-end text-sm text-[#3f72af] hover:text-blue-700 font-medium">
                      View Details →
                    </div>
                  </div>
  );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
