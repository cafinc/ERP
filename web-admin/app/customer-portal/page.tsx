'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Home,
  MapPin,
  FileText,
  Receipt,
  FolderOpen,
  MessageSquare,
  Star,
  ClipboardList,
  LogOut,
  Bell,
  User,
} from 'lucide-react';

export default function CustomerPortalLoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already logged in as customer, redirect to dashboard
    if (user && user.role === 'customer') {
      router.push('/customer-portal/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Implement customer login API
      // const response = await api.post('/auth/customer/login', { email, password });
      // Store token and redirect
      router.push('/customer-portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3f72af] rounded-full mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Portal</h1>
          <p className="text-gray-600">Access your snow removal services</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3f72af] hover:bg-[#3f72af]/90 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New customer?{' '}
              <a href="#" className="text-blue-600 hover:underline font-medium">
                Contact us for access
              </a>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">View Sites</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Track Services</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Receipt className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">View Invoices</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Message Us</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
