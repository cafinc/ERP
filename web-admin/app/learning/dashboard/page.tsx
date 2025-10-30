'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import {
  BookOpen,
  FileText,
  Video,
  LayoutDashboard,
  Plus,
} from 'lucide-react';

export default function LearningDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    videos: 0,
    guides: 0,
  });

  const statCards = [
    {
      label: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'bg-[#5b8ec4]',
      href: '/learning-documents',
    },
    {
      label: 'Video Tutorials',
      value: stats.videos,
      icon: Video,
      color: 'bg-purple-500',
      href: '/learning-documents',
    },
    {
      label: 'Training Guides',
      value: stats.guides,
      icon: BookOpen,
      color: 'bg-green-500',
      href: '/learning-documents',
    },
  ];

  return (
    <PageHeader>
      <div className="p-4 space-y-6">
        <PageHeader
        title="Dashboard"
        subtitle="Manage dashboard"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Learning", href: "/learning" }, { label: "Dashboard" }]}
        title="Learning Centre Dashboard"
          icon={LayoutDashboard}
          badges={[
            { label: `${stats.totalDocuments} Documents`, color: 'blue' },
          ]}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              onClick={() => router.push(stat.href)}
              className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div></div></button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/learning-documents/create')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Upload Document</span>
            </button>
            <button
              onClick={() => router.push('/learning-documents')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <BookOpen className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">View All</span>
            </button>
            <button
              onClick={() => router.push('/learning-documents')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <Video className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Video Tutorials</span>
            </button></div></div></div>
    </PageHeader>
  );
}
