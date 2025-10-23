'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Camera,
  Upload,
  Trash2,
  Smile,
} from 'lucide-react';

// People avatar options
const AVATAR_EMOJIS = [
  '👨', '👩', '🧑', '👦', '👧', '👴', '👵', '🧓', '👶', '🧒',
  '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩‍🦰', '👩‍🦱', '👩‍🦳', '👩‍🦲', '🧑‍🦰', '🧑‍🦱',
  '🧑‍🦳', '🧑‍🦲', '👱‍♂️', '👱‍♀️', '👱', '🧔', '🧔‍♂️', '🧔‍♀️', '👨‍💼', '👩‍💼',
  '🧑‍💼', '👨‍🔧', '👩‍🔧', '🧑‍🔧', '👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '👨‍🎓', '👩‍🎓', '🧑‍🎓',
  '👨‍🏫', '👩‍🏫', '🧑‍🏫', '👨‍⚖️', '👩‍⚖️', '🧑‍⚖️', '👨‍🌾', '👩‍🌾', '🧑‍🌾', '👨‍🍳',
  '👩‍🍳', '🧑‍🍳', '👨‍🔬', '👩‍🔬', '🧑‍🔬', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎤', '👩‍🎤',
  '🧑‍🎤', '👨‍🎨', '👩‍🎨', '🧑‍🎨', '👨‍✈️', '👩‍✈️', '🧑‍✈️', '👨‍🚀', '👩‍🚀', '🧑‍🚀',
  '👨‍🚒', '👩‍🚒', '🧑‍🚒', '👮‍♂️', '👮‍♀️', '👮', '🕵️‍♂️', '🕵️‍♀️', '🕵️', '💂‍♂️',
  '💂‍♀️', '💂', '🥷', '👷‍♂️', '👷‍♀️', '👷', '🤴', '👸', '👳‍♂️', '👳‍♀️',
];

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.full_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setErrorMessage('');

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);

        // Upload to server
        await api.post('/users/upload-avatar', {
          avatar: base64String
        });

        // Refresh user data
        if (refreshUser) {
          await refreshUser();
        }

        setSuccessMessage('Profile photo updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setErrorMessage(error.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    try {
      setUploadingAvatar(true);
      setErrorMessage('');

      await api.delete('/users/delete-avatar');
      
      setAvatarPreview(null);

      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }

      setSuccessMessage('Profile photo removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      setErrorMessage(error.response?.data?.detail || 'Failed to remove photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = () => {
    if (!formData.name) return 'U';
    return formData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleUpdateProfile = async () => {
    try {
      // Validation
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        setErrorMessage('Please fill in all required fields');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setErrorMessage('Please enter a valid email address');
        return;
      }

      // Phone validation (basic)
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        setErrorMessage('Please enter a valid phone number');
        return;
      }

      // If changing email or phone, require current password
      const emailChanged = formData.email !== user?.email;
      const phoneChanged = formData.phone !== user?.phone;

      if ((emailChanged || phoneChanged) && !formData.currentPassword) {
        setErrorMessage('Please enter your current password to change email or phone');
        return;
      }

      // If setting new password, validate
      if (formData.newPassword) {
        if (formData.newPassword.length < 6) {
          setErrorMessage('New password must be at least 6 characters');
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          setErrorMessage('Passwords do not match');
          return;
        }

        if (!formData.currentPassword) {
          setErrorMessage('Please enter your current password to change password');
          return;
        }
      }

      setLoading(true);

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      if (formData.currentPassword) {
        updateData.current_password = formData.currentPassword;
      }

      if (formData.newPassword) {
        updateData.new_password = formData.newPassword;
      }

      if (!user?.id) {
        throw new Error('User not found');
      }

      const response = await api.put(`/users/${user.id}/profile`, updateData);

      setSuccessMessage('Profile updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrorMessage(
        error.response?.data?.detail || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <HybridNavigationTopBar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="max-w-3xl">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Avatar/Profile Photo Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Profile Photo</span>
            </h2>

            <div className="flex items-center space-x-6">
              {/* Avatar Display */}
              <div className="relative">
                {avatarPreview ? (
                  // Check if avatar is emoji or image
                  avatarPreview.length <= 4 ? (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#3f72af] to-blue-600 flex items-center justify-center border-4 border-gray-200">
                      <span className="text-6xl">{avatarPreview}</span>
                    </div>
                  ) : (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                  )
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#3f72af] to-blue-600 flex items-center justify-center border-4 border-gray-200">
                    <span className="text-4xl font-bold text-white">{getInitials()}</span>
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {avatarPreview ? 'Update your avatar' : 'Add an avatar'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose an avatar or upload a photo. Photos max size: 5MB
                </p>
                
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </button>
                  
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={uploadingAvatar}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Smile className="w-4 h-4" />
                    <span>Choose Avatar</span>
                  </button>

                  {avatarPreview && (
                    <button
                      onClick={handleDeleteAvatar}
                      disabled={uploadingAvatar}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                
                {/* Avatar Picker */}
                {showEmojiPicker && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Choose Your Avatar</h4>
                    <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto">
                      {AVATAR_EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={async () => {
                            try {
                              setUploadingAvatar(true);
                              const response = await api.post('/users/upload-avatar', { avatar: emoji });
                              setAvatarPreview(emoji);
                              setShowEmojiPicker(false);
                              setSuccessMessage('Avatar updated successfully!');
                              // Reload page to refresh user context
                              setTimeout(() => {
                                window.location.reload();
                              }, 1000);
                            } catch (error) {
                              console.error('Error updating avatar:', error);
                              setErrorMessage('Failed to update avatar');
                            } finally {
                              setUploadingAvatar(false);
                            }
                          }}
                          className="text-4xl hover:bg-white rounded-lg p-2 transition-all hover:scale-110"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile Information</span>
            </h2>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                {formData.email !== user?.email && (
                  <p className="mt-1 text-xs text-yellow-600">
                    Changing email requires current password
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {formData.phone !== user?.phone && (
                  <p className="mt-1 text-xs text-yellow-600">
                    Changing phone requires current password
                  </p>
                )}
              </div>

              {/* Role (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Contact admin to change your role</p>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Change Password</span>
            </h2>

            <div className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <strong>Note:</strong> Leave password fields empty if you don't want to change your password
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
