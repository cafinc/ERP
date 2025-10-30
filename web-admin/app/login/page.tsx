'use client';

import PageHeader from '@/components/PageHeader';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use the test-login endpoint (GET request)
      const response = await api.get('/auth/test-login');
      
      // Store the session token
      const token = response.data.session_token;
      localStorage.setItem('session_token', token);
      
      // Wait a tick for localStorage to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify token is accessible
      const storedToken = localStorage.getItem('session_token');
      if (!storedToken) {
        throw new Error('Failed to store session token');
      }
      
      // Force a full page reload to ensure auth context picks up the token
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
    // Don't set loading false on success - let the navigation happen
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_snowmsg-hub/artifacts/4h69gasr_Color%20logo%20-%20no%20background.png" 
              alt="Logo" 
              className="h-20 w-auto"
              style={{ maxWidth: '280px', objectFit: 'contain' }}
            />
          </div>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="admin@test.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="(any password works for demo)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3f72af] hover:bg-[#3f72af]/90 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button></form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p className="bg-yellow-50 border border-yellow-200 rounded p-2">
            🔓 Demo Mode: Click "Sign In" (no credentials needed)
          </p>
        </div></div></div>
  );
}
