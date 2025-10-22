'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Upload,
  Search,
  Image as ImageIcon,
  Download,
  Trash2,
  Eye,
  Filter,
  Calendar,
  MapPin,
  User,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Photo {
  id: string;
  filename: string;
  url: string;
  thumbnail_url?: string;
  uploaded_by: string;
  uploaded_at: string;
  category?: string;
  site_id?: string;
  project_id?: string;
  customer_id?: string;
  tags: string[];
  notes?: string;
}

export default function PhotoGalleryPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('photos', file);
      });

      await api.post('/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(`Successfully uploaded ${files.length} photo(s)!`);
      setShowUploadModal(false);
      loadPhotos(); // Refresh the photo list
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/photos?limit=500');
      const fetchedPhotos = response.data.map((photo: any) => ({
        id: photo.id,
        filename: photo.filename || 'unknown.jpg',
        url: photo.image_data ? `data:image/jpeg;base64,${photo.image_data}` : '',
        thumbnail_url: photo.thumbnail_data ? `data:image/jpeg;base64,${photo.thumbnail_data}` : '',
        uploaded_by: photo.crew_name || 'Unknown',
        uploaded_at: photo.timestamp,
        category: photo.category || 'uncategorized',
        site_id: photo.site_id !== 'gallery' ? photo.site_id : undefined,
        project_id: photo.project_id,
        customer_id: photo.customer_id,
        tags: photo.tags || [],
        notes: photo.notes
      }));
      setPhotos(fetchedPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
      // Fallback to empty array on error
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/photos/${id}`);
      setPhotos(photos.filter(p => p.id !== id));
      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = 
      photo.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      photo.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || photo.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
    if (currentIndex === -1) return;
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = filteredPhotos.length - 1;
    if (newIndex >= filteredPhotos.length) newIndex = 0;
    
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Photo Gallery</h1>
            <p className="text-gray-600 mt-1">Manage photos and documentation</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-[#3f72af] text-white px-4 py-2 rounded-lg hover:bg-[#2c5282] transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Photos
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="before_after">Before/After</option>
              <option value="equipment">Equipment</option>
              <option value="site_inspection">Site Inspection</option>
              <option value="damage">Damage</option>
              <option value="completed_work">Completed Work</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'grid'
                    ? 'bg-[#3f72af] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'list'
                    ? 'bg-[#3f72af] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <ImageIcon className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{photos.length}</p>
                <p className="text-sm text-gray-600">Total Photos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {photos.filter(p => {
                    const uploadDate = new Date(p.uploaded_at);
                    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return uploadDate > sevenDaysAgo;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-3">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {photos.filter(p => p.site_id).length}
                </p>
                <p className="text-sm text-gray-600">Linked to Sites</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-3">
                <Filter className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {photos.filter(p => p.category === 'before_after').length}
                </p>
                <p className="text-sm text-gray-600">Before/After</p>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900">No photos found</p>
                <p className="text-sm text-gray-600">Upload your first photo to get started</p>
              </div>
            ) : (
              filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="aspect-square relative">
                    <img 
                      src={photo.thumbnail_url || photo.url} 
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{photo.filename}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <User className="w-3 h-3" />
                      <span>{photo.uploaded_by}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {photo.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPhotos.map((photo) => (
                  <tr key={photo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <img src={photo.thumbnail_url || photo.url} alt={photo.filename} className="w-16 h-16 object-cover rounded" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{photo.filename}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{photo.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{photo.uploaded_by}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(photo.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPhoto(photo)}
                          className="text-[#3f72af] hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a href={photo.url} download className="text-green-600 hover:text-green-800">
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={() => navigatePhoto('prev')}
            className="absolute left-4 text-white hover:text-gray-300"
          >
            <ChevronLeft className="w-12 h-12" />
          </button>

          <button
            onClick={() => navigatePhoto('next')}
            className="absolute right-4 text-white hover:text-gray-300"
          >
            <ChevronRight className="w-12 h-12" />
          </button>

          <div className="max-w-6xl w-full max-h-screen flex flex-col">
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.filename}
              className="max-h-[80vh] object-contain rounded"
            />
            <div className="bg-white rounded-b-lg p-4 mt-2">
              <h3 className="font-semibold text-gray-900">{selectedPhoto.filename}</h3>
              {selectedPhoto.notes && (
                <p className="text-sm text-gray-600 mt-1">{selectedPhoto.notes}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Uploaded by: {selectedPhoto.uploaded_by}</span>
                <span>{new Date(selectedPhoto.uploaded_at).toLocaleString()}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPhoto.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal Placeholder */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Upload Photos</h2>
              <button onClick={() => setShowUploadModal(false)}>
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">Drag and drop photos here</p>
              <p className="text-sm text-gray-500">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button 
                onClick={handleFileSelect}
                disabled={uploading}
                className="mt-4 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Select Files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </HybridNavigationTopBar>
  );
}
