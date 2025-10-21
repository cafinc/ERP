'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';

interface AvatarPickerProps {
  currentAvatar?: string;
  onSelect: (avatarUrl: string) => void;
  onClose: () => void;
}

type AvatarStyle = 'adventurer' | 'adventurer-neutral' | 'avataaars' | 'avataaars-neutral' | 'big-ears' | 'big-ears-neutral' | 'big-smile' | 'bottts' | 'croodles' | 'croodles-neutral' | 'fun-emoji' | 'icons' | 'identicon' | 'initials' | 'lorelei' | 'lorelei-neutral' | 'micah' | 'miniavs' | 'notionists' | 'notionists-neutral' | 'open-peeps' | 'personas' | 'pixel-art' | 'pixel-art-neutral' | 'rings' | 'shapes' | 'thumbs';

const AVATAR_STYLES: { name: string; value: AvatarStyle; description: string }[] = [
  { name: 'Adventurer', value: 'adventurer', description: 'Diverse, modern characters' },
  { name: 'Avataaars', value: 'avataaars', description: 'Classic avatar style' },
  { name: 'Big Smile', value: 'big-smile', description: 'Happy & friendly' },
  { name: 'Micah', value: 'micah', description: 'Professional illustrations' },
  { name: 'Lorelei', value: 'lorelei', description: 'Artistic portraits' },
  { name: 'Notionists', value: 'notionists', description: 'Modern 3D style' },
  { name: 'Open Peeps', value: 'open-peeps', description: 'Colorful & diverse' },
  { name: 'Personas', value: 'personas', description: 'Professional personas' },
  { name: 'Fun Emoji', value: 'fun-emoji', description: 'Expressive emojis' },
  { name: 'Pixel Art', value: 'pixel-art', description: 'Retro pixel style' },
];

export default function AvatarPicker({ currentAvatar, onSelect, onClose }: AvatarPickerProps) {
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>('adventurer');
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '');

  // Generate random seeds for avatar variations
  const generateAvatarOptions = (style: AvatarStyle) => {
    const seeds = [];
    for (let i = 0; i < 12; i++) {
      const seed = Math.random().toString(36).substring(7);
      const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      seeds.push(url);
    }
    setAvatarOptions(seeds);
  };

  useEffect(() => {
    generateAvatarOptions(selectedStyle);
  }, [selectedStyle]);

  const handleStyleChange = (style: AvatarStyle) => {
    setSelectedStyle(style);
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3f72af] to-[#5a8fd4] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Choose Your Avatar</h2>
            <p className="text-sm text-blue-100">Select a style and pick your avatar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Style Selector */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Avatar Style</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => handleStyleChange(style.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedStyle === style.value
                      ? 'border-[#3f72af] bg-[#3f72af] bg-opacity-5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{style.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Grid */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Pick Your Avatar</h3>
              <button
                onClick={() => generateAvatarOptions(selectedStyle)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Generate New
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
              {avatarOptions.map((avatarUrl, index) => (
                <button
                  key={index}
                  onClick={() => handleAvatarSelect(avatarUrl)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all ${
                    selectedAvatar === avatarUrl
                      ? 'border-[#3f72af] shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={avatarUrl}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover bg-white"
                  />
                  {selectedAvatar === avatarUrl && (
                    <div className="absolute inset-0 bg-[#3f72af] bg-opacity-20 flex items-center justify-center">
                      <div className="bg-[#3f72af] rounded-full p-1">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selectedAvatar && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Preview</h3>
              <div className="flex items-center gap-4">
                <img
                  src={selectedAvatar}
                  alt="Selected avatar"
                  className="w-16 h-16 rounded-full border-2 border-white shadow-md"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Your new avatar</p>
                  <p className="text-xs text-gray-500">This will appear in your profile and header</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAvatar}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedAvatar
                ? 'bg-[#3f72af] text-white hover:bg-[#2f5a8f]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}
