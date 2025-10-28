'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Plus,
  BookOpen,
  FileText,
  Video,
  Image as ImageIcon,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  Search,
} from 'lucide-react';

interface LearningDocument {
  id: string;
  title: string;
  category: string;
  description?: string;
  file_type: string;
  file_url?: string;
  created_at: string;
  created_by?: string;
}

export default function LearningDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<LearningDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LearningDocument | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/learning-documents');
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/learning-documents/${id}`);
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleEdit = async () => {
    if (!editingDoc) return;

    try {
      await api.put(`/learning-documents/${editingDoc.id}`, {
        title: editingDoc.title,
        category: editingDoc.category,
        description: editingDoc.description
      });
      
      alert('Document updated successfully!');
      setShowEditModal(false);
      setEditingDoc(null);
      loadDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', (e.target as any).title.value);
    formData.append('category', (e.target as any).category.value);
    formData.append('description', (e.target as any).description.value);

    try {
      await api.post('/learning-documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Document uploaded successfully!');
      setShowCreateModal(false);
      setUploadFile(null);
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('video')) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Learning Documents"
        subtitle="Manage learning documents"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Learning Documents" }]}
      />
      <Video className="w-5 h-5" />;
    if (fileType.includes('image')) return <ImageIcon className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      safety: 'bg-red-100 text-red-700',
      training: 'bg-blue-100 text-blue-700',
      equipment: 'bg-purple-100 text-purple-700',
      procedures: 'bg-green-100 text-green-700',
      compliance: 'bg-yellow-100 text-yellow-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(documents.map(d => d.category)));

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Documents</h1>
            <p className="text-gray-600 mt-1">Training materials and company resources</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md rounded-lg hover:bg-[#2c5282]"
          >
            <Plus className="w-5 h-5" />
            Add Document
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <BookOpen className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                <p className="text-sm text-gray-600">Total Documents</p>
              </div>

          {categories.slice(0, 3).map((category) => {
            const count = documents.filter(d => d.category === category).length;
            return (
              <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-3 ${getCategoryColor(category)}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{category}</p>
                  </div>
            );
          })}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

        {/* Documents Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Documents ({filteredDocs.length})
            </h2>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No Documents Found</p>
              <p className="text-sm text-gray-600 mt-2">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first learning document to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc.file_type)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                        {doc.category}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingDoc(doc);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-[#3f72af] hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  <h3 className="font-semibold text-gray-900 mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    {doc.file_url && (
                      <button
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="flex items-center gap-1 text-[#3f72af] hover:text-blue-700"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                  </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Learning Document</h2>
              <p className="text-gray-600 mb-4">Document upload feature coming soon. You can add documents via API.</p>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full bg-[#3f72af] text-white py-2 rounded-lg hover:bg-[#2c5282]"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Document Modal */}
        {showEditModal && editingDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Document</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingDoc.title}
                    onChange={(e) => setEditingDoc({...editingDoc, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f72af]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editingDoc.category}
                    onChange={(e) => setEditingDoc({...editingDoc, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f72af]"
                  >
                    <option value="Training">Training</option>
                    <option value="Safety">Safety</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Process">Process</option>
                    <option value="Policy">Policy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingDoc.description || ''}
                    onChange={(e) => setEditingDoc({...editingDoc, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f72af]"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleEdit}
                    className="flex-1 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingDoc(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
