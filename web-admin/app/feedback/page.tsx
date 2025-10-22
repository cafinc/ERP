'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import api from '@/lib/api';
import {
  Star,
  Send,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  MessageSquare,
  User,
  Mail,
} from 'lucide-react';

export default function FeedbackFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRating = parseInt(searchParams.get('rating') || '3');
  
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      alert('Please provide your feedback before submitting.');
      return;
    }

    if (rating <= 2 && !customerEmail.trim()) {
      alert('For negative feedback, please provide your email so we can follow up with you.');
      return;
    }

    setSubmitting(true);

    try {
      const feedbackData = {
        rating,
        feedback: feedback.trim(),
        customer_name: customerName.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
      };

      await api.post('/feedback', feedbackData);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('We encountered an error while submitting your feedback. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Very Poor';
      case 2: return 'Poor';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  const getRatingColor = () => {
    if (rating <= 2) return 'text-red-600';
    if (rating === 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Share Your Feedback</h1>
            <p className="text-gray-600 mt-1">Help us improve our snow removal service</p>
          </div>
        </div>

        <form onSubmit={handleSubmitFeedback} className="space-y-6">
          {/* Rating Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              How would you rate our service?
            </h2>
            
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <p className={`text-center text-lg font-semibold ${getRatingColor()}`}>
              {getRatingText()}
            </p>
          </div>

          {/* Feedback Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <span className="text-lg font-semibold text-gray-900">
                  Tell us about your experience
                </span>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please describe your experience with our snow removal service. Your feedback helps us improve."
                rows={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </label>
          </div>

          {/* Contact Information (for low ratings) */}
          {rating <= 2 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Contact Information (Required for follow-up)
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                We'd like to make this right. Please provide your contact details so we can follow up.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Your Name</span>
                    </div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </label>
                </div>

                <div>
                  <label className="block">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Your Email Address *</span>
                    </div>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required={rating <= 2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !feedback.trim()}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold transition-colors ${
              submitting || !feedback.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-[#2c5282]'
            }`}
          >
            {submitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback
              </>
            )}
          </button>

          {/* Footer Note */}
          <div className="text-center">
            <p className="text-sm text-gray-500 italic">
              Your feedback is important to us. Thank you for helping us provide better service.
            </p>
          </div>
        </form>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-gray-600 mb-6">
                  Your feedback has been submitted successfully. We appreciate you taking the time to share your experience with us.
                </p>
                <button
                  onClick={() => router.back()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-[#2c5282]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
