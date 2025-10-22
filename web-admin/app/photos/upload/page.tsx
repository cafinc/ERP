'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Upload,
  Image as ImageIcon,
  X,
  ArrowLeft,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

export default function PhotoUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('general');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        // Convert to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Upload photo
        await api.post('/photos', {
          image_data: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
          category,
          notes: notes || undefined,
          metadata: {
            filename: file.name,
            size: file.size,
            type: file.type,
          },
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/photos');
      }, 2000);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload some photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <HybridNavigationTopBar>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Photos</h1>
            <p className="text-gray-600 mt-1">Document your work with photos</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">Click to upload photos</p>
              <p className="text-sm text-gray-600">or drag and drop files here</p>
              <p className="text-xs text-gray-500 mt-2">Supports: JPG, PNG, HEIC (Max 10MB each)</p>
            </div>
          </label>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Files ({files.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Photo Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="general">General</option>
              <option value="before">Before Work</option>
              <option value="after">After Work</option>
              <option value="plowing">Plowing</option>
              <option value="salting">Salting</option>
              <option value="equipment">Equipment</option>
              <option value="damage">Damage</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about these photos..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold transition-colors ${
            uploading || files.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#3f72af] text-white hover:bg-[#2c5282]'
          }`}
        >
          {uploading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Uploading {files.length} photos...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload {files.length} Photo{files.length !== 1 ? 's' : ''}
            </>
          )}
        </button>

        {/* Success Modal */}
        {success && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-4 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Photos Uploaded!</h2>
              <p className="text-gray-600">{files.length} photo{files.length !== 1 ? 's' : ''} uploaded successfully</p>
            </div>
          </div>
        )}
      </div>
    </HybridNavigationTopBar>
  );
}
