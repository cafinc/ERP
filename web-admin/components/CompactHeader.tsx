'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface Badge {
  label: string;
  color: 'green' | 'blue' | 'gray' | 'red' | 'yellow' | 'purple' | 'orange';
}

interface Action {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'purple';
  disabled?: boolean;
}

interface CompactHeaderProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
  badges?: Badge[];
  actions?: Action[] | ReactNode;
  icon?: LucideIcon;
  children?: ReactNode;
  centerContent?: ReactNode;
}

const badgeColors = {
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
};

const buttonVariants = {
  primary: 'bg-[#3f72af] hover:bg-[#3f72af]/90 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
};

export default function CompactHeader({
  title,
  subtitle,
  backUrl,
  badges = [],
  actions = [],
  icon: Icon,
  children,
  centerContent,
}: CompactHeaderProps) {
  const router = useRouter();

  // Check if actions is a ReactNode or Action array
  const isActionsArray = Array.isArray(actions);

  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: Back button + Title + Badges */}
        <div className="flex items-center space-x-3 min-w-0">
          {backUrl && (
            <button
              onClick={() => router.push(backUrl)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          <div className="flex items-center space-x-2 min-w-0">
            {Icon && <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />}
            <div>
              <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
            
            {badges.length > 0 && (
              <div className="flex items-center space-x-2 flex-shrink-0">
                {badges.map((badge, index) => (
                  <span
                    key={index}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[badge.color]}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Optional center content (e.g., filter buttons) */}
        {centerContent && (
          <div className="flex items-center flex-shrink-0">
            {centerContent}
          </div>
        )}

        {/* Right: Action Buttons */}
        {isActionsArray && (actions as Action[]).length > 0 && (
          <div className="flex items-center space-x-2 flex-shrink-0">
            {(actions as Action[]).map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    buttonVariants[action.variant || 'primary']
                  }`}
                >
                  {ActionIcon && <ActionIcon className="w-4 h-4" />}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
        {!isActionsArray && actions}
      </div>
      
      {/* Optional children for custom content below */}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
