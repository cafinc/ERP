'use client';

import PageHeader from '@/components/PageHeader';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setSuccess(true);
      setSubmitting(false);
    }, 1500);
  };

  if (success) {
    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Forgot Password"
        subtitle="Manage forgot password"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Forgot Password" }]}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-4">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-[#3f72af] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5282]"
          >
            Back to Login
          </button></div></div></div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-600 mt-2">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div></div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#3f72af] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5282] disabled:opacity-50"
          >
            {submitting ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Reset Link
              </>
            )}
          </button></form>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-[#3f72af] hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div></div></div>
  );
}
