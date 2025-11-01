'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Plus, Download, Filter, Search } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ActionButton {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

interface Tab {
  label: string;
  value: string;
  count?: number;
}

interface StatBadge {
  label: string;
  value: number | string;
  trend?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionButton[];
  stats?: StatBadge[];
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  secondaryTabs?: Tab[];
  activeSecondaryTab?: string;
  onSecondaryTabChange?: (value: string) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showFilter?: boolean;
  onFilterClick?: () => void;
  filterDropdown?: React.ReactNode;
  showViewToggle?: boolean;
  viewMode?: 'list' | 'grid';
  onViewChange?: (mode: 'list' | 'grid') => void;
  customTabsRight?: React.ReactNode;
  variant?: 'default' | 'simple' | 'compact';
}

export default function PageHeader({
  title,
  icon,
  subtitle,
  breadcrumbs,
  actions,
  stats,
  tabs,
  activeTab,
  onTabChange,
  secondaryTabs,
  activeSecondaryTab,
  onSecondaryTabChange,
  showSearch = false,
  searchPlaceholder = 'Search...',
  onSearch,
  showFilter = false,
  onFilterClick,
  filterDropdown,
  showViewToggle = false,
  viewMode = 'list',
  onViewChange,
  customTabsRight,
  variant = 'default'
}: PageHeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-[#3f72af]">{icon}</div>}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {actions && actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                    action.variant === 'primary'
                      ? 'text-white bg-blue-600 hover:bg-blue-700'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Simple variant
  if (variant === 'simple') {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {actions && actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    action.variant === 'primary'
                      ? 'text-white bg-blue-600 hover:bg-blue-700'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant - Full Featured Header (white background)
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-5">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center text-sm text-gray-500 mb-3">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-gray-700">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-2" />
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title, Stats, and Actions Row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Stats Badges - Right side */}
            {stats && stats.length > 0 && (
              <div className="flex items-center gap-3">
                {stats.map((stat, index) => {
                  const colorClasses = {
                    blue: 'bg-blue-50 text-blue-600',
                    green: 'bg-green-50 text-green-600',
                    purple: 'bg-purple-50 text-purple-600',
                    orange: 'bg-orange-50 text-orange-600',
                    red: 'bg-red-50 text-red-600',
                    gray: 'bg-gray-50 text-gray-600',
                  };
                  const colorClass = colorClasses[stat.color || 'gray'];
                  const textColorClass = stat.color ? `text-${stat.color}-900` : 'text-gray-900';
                  
                  const StatContent = (
                    <>
                      {stat.icon && <div className={colorClass.split(' ')[1]}>{stat.icon}</div>}
                      <div className="flex flex-col">
                        <span className={`text-xs ${colorClass.split(' ')[1]} font-medium`}>{stat.label}</span>
                        <span className={`text-lg font-bold ${textColorClass}`}>{stat.value}</span>
                        {stat.trend && (
                          <span className="text-xs text-gray-500 mt-0.5">{stat.trend}</span>
                        )}
                      </div>
                    </>
                  );
                  
                  return stat.onClick ? (
                    <button
                      key={index}
                      onClick={stat.onClick}
                      className={`flex items-center gap-2 px-3 py-1.5 ${colorClass.split(' ')[0]} rounded-lg cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      {StatContent}
                    </button>
                  ) : (
                    <div key={index} className={`flex items-center gap-2 px-3 py-1.5 ${colorClass.split(' ')[0]} rounded-lg`}>
                      {StatContent}
                    </div>
                  );
                })}
              </div>
            )}
            
            {actions && actions.length > 0 && (
              <div className="flex gap-2">
                {actions.map((action, index) => {
                  if (action.href) {
                    return (
                      <Link
                        key={index}
                        href={action.href}
                        className={`px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center ${
                          action.variant === 'primary'
                            ? 'text-white bg-blue-600 hover:bg-blue-700'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {action.icon}
                        {action.label}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center ${
                        action.variant === 'primary'
                          ? 'text-white bg-[#3f72af] hover:bg-[#2c5282]'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Row */}
        {(showSearch || showFilter || showViewToggle) && (
          <div className="flex gap-3 mb-4">
            {showSearch && (
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent bg-white"
                />
              </div>
            )}
            {showViewToggle && onViewChange && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onViewChange('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => onViewChange('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
              </div>
            )}
            {showFilter && (
              <div className="relative">
                <button
                  onClick={onFilterClick}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
                {filterDropdown}
              </div>
            )}
          </div>
        )}

        {/* Tabs Row - Site Types */}
        {secondaryTabs && secondaryTabs.length > 0 && (
          <div className="flex items-center gap-3 border-b border-gray-200 -mb-5 pb-3 overflow-x-auto">
            {secondaryTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onSecondaryTabChange && onSecondaryTabChange(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeSecondaryTab === tab.value
                    ? 'bg-[#3f72af] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
