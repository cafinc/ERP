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

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionButton[];
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showFilter?: boolean;
  onFilterClick?: () => void;
  showViewToggle?: boolean;
  viewMode?: 'list' | 'grid';
  onViewChange?: (mode: 'list' | 'grid') => void;
  variant?: 'default' | 'simple' | 'compact';
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  tabs,
  activeTab,
  onTabChange,
  showSearch = false,
  searchPlaceholder = 'Search...',
  onSearch,
  showFilter = false,
  onFilterClick,
  showViewToggle = false,
  viewMode = 'list',
  onViewChange,
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
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
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

        {/* Title and Actions Row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
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
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
              <button
                onClick={onFilterClick}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="flex gap-6 border-b border-gray-200 -mb-5 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange && onTabChange(tab.value)}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 text-xs">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
