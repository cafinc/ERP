"use client";

import { useState, useEffect } from "react";
import CompactHeader from "@/components/CompactHeader";
import {
  TrendingUp,
  Plus,
  Star,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";

export default function PerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({
    employee_id: "",
    reviewer_id: "",
    review_type: "annual",
    review_period_start: "",
    review_period_end: "",
    scheduled_date: "",
  });
  const [updateForm, setUpdateForm] = useState({
    overall_rating: "",
    strengths: "",
    areas_for_improvement: "",
    goals: "",
    notes: "",
  });

  useEffect(() => {
    loadReviews();
    loadEmployees();
  }, [filterStatus]);

  const loadReviews = async () => {
    try {
      let url = "/api/hr/performance-reviews?";
      if (filterStatus !== "all") url += `status=${filterStatus}`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch("/api/hr/employees?status=active");
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/hr/performance-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        loadReviews();
        resetReviewForm();
      }
    } catch (error) {
      console.error("Error creating review:", error);
    }
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    try {
      const updateData = {
        ...updateForm,
        status: "completed",
        completed_date: new Date().toISOString(),
      };

      const response = await fetch(
        `/api/hr/performance-reviews/${selectedReview.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );
      const data = await response.json();
      if (data.success) {
        setShowDetailsModal(false);
        loadReviews();
        setSelectedReview(null);
        resetUpdateForm();
      }
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  const handleStartReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/hr/performance-reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
      const data = await response.json();
      if (data.success) {
        loadReviews();
      }
    } catch (error) {
      console.error("Error starting review:", error);
    }
  };

  const handleViewReview = (review: any) => {
    setSelectedReview(review);
    setUpdateForm({
      overall_rating: review.overall_rating?.toString() || "",
      strengths: review.strengths || "",
      areas_for_improvement: review.areas_for_improvement || "",
      goals: review.goals || "",
      notes: review.notes || "",
    });
    setShowDetailsModal(true);
  };

  const resetReviewForm = () => {
    setReviewForm({
      employee_id: "",
      reviewer_id: "",
      review_type: "annual",
      review_period_start: "",
      review_period_end: "",
      scheduled_date: "",
    });
  };

  const resetUpdateForm = () => {
    setUpdateForm({
      overall_rating: "",
      strengths: "",
      areas_for_improvement: "",
      goals: "",
      notes: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getReviewTypeColor = (type: string) => {
    switch (type) {
      case "annual":
        return "bg-purple-100 text-purple-800";
      case "quarterly":
        return "bg-blue-100 text-blue-800";
      case "probationary":
        return "bg-orange-100 text-orange-800";
      case "project":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const calculateStats = () => {
    const scheduled = reviews.filter((r: any) => r.status === "scheduled").length;
    const inProgress = reviews.filter((r: any) => r.status === "in_progress").length;
    const completed = reviews.filter((r: any) => r.status === "completed").length;
    const avgRating =
      reviews.length > 0
        ? reviews
            .filter((r: any) => r.overall_rating)
            .reduce((sum: number, r: any) => sum + (r.overall_rating || 0), 0) /
          reviews.filter((r: any) => r.overall_rating).length
        : 0;

    return { scheduled, inProgress, completed, avgRating };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <CompactHeader title="Performance Management" backUrl="/hr" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.scheduled}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-[#3f72af]">{stats.inProgress}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.avgRating.toFixed(1)}
                </p>
              </div>
              <Star className="h-12 w-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-[#3f72af]"
            >
              <Plus className="h-4 w-4" />
              Schedule Review
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Reviews
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading performance reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No performance reviews yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-blue-500 hover:text-[#3f72af]"
              >
                Schedule your first performance review
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reviews.map((review: any) => (
                <div key={review.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {review.employee_name?.charAt(0) || "?"}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {review.employee_name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getReviewTypeColor(
                              review.review_type
                            )}`}
                          >
                            {review.review_type.toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              review.status
                            )}`}
                          >
                            {review.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          <strong>Reviewer:</strong> {review.reviewer_name}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              <strong>Period:</strong>{" "}
                              {formatDate(review.review_period_start)} -{" "}
                              {formatDate(review.review_period_end)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              <strong>Scheduled:</strong>{" "}
                              {formatDate(review.scheduled_date)}
                            </span>
                          </div>
                          {review.completed_date && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              <span>
                                <strong>Completed:</strong>{" "}
                                {formatDate(review.completed_date)}
                              </span>
                            </div>
                          )}
                        </div>

                        {review.overall_rating && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Overall Rating:
                            </span>
                            {renderStars(review.overall_rating)}
                            <span className="text-sm text-gray-600">
                              ({review.overall_rating}/5)
                            </span>
                          </div>
                        )}

                        {review.status === "completed" && (
                          <div className="mt-3 space-y-2 text-sm">
                            {review.strengths && (
                              <div className="bg-green-50 p-3 rounded">
                                <strong className="text-green-900">Strengths:</strong>
                                <p className="text-green-800 mt-1">{review.strengths}</p>
                              </div>
                            )}
                            {review.areas_for_improvement && (
                              <div className="bg-orange-50 p-3 rounded">
                                <strong className="text-orange-900">
                                  Areas for Improvement:
                                </strong>
                                <p className="text-orange-800 mt-1">
                                  {review.areas_for_improvement}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {review.status === "scheduled" && (
                        <button
                          onClick={() => handleStartReview(review.id)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-[#3f72af] text-sm"
                        >
                          Start Review
                        </button>
                      )}
                      {(review.status === "in_progress" ||
                        review.status === "completed") && (
                        <button
                          onClick={() => handleViewReview(review)}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                        >
                          {review.status === "completed" ? "View Details" : "Complete Review"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Reviews Alert */}
        {stats.scheduled > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">{stats.scheduled}</span> performance
                review(s) scheduled
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Review Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Schedule Performance Review
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetReviewForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee *
                  </label>
                  <select
                    required
                    value={reviewForm.employee_id}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, employee_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.job_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reviewer *
                  </label>
                  <select
                    required
                    value={reviewForm.reviewer_id}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, reviewer_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Reviewer</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review Type *
                  </label>
                  <select
                    required
                    value={reviewForm.review_type}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, review_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="annual">Annual</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="probationary">Probationary</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={reviewForm.scheduled_date}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, scheduled_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review Period Start *
                  </label>
                  <input
                    type="date"
                    required
                    value={reviewForm.review_period_start}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        review_period_start: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review Period End *
                  </label>
                  <input
                    type="date"
                    required
                    value={reviewForm.review_period_end}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        review_period_end: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetReviewForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-[#3f72af]"
                >
                  Schedule Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Details/Complete Modal */}
      {showDetailsModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Review - {selectedReview.employee_name}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedReview(null);
                  resetUpdateForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateReview} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Rating (1-5) *
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      required
                      value={updateForm.overall_rating}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, overall_rating: e.target.value })
                      }
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={selectedReview.status === "completed"}
                    />
                    {updateForm.overall_rating &&
                      renderStars(parseFloat(updateForm.overall_rating))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strengths
                  </label>
                  <textarea
                    rows={4}
                    value={updateForm.strengths}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, strengths: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="What are this employee's key strengths?"
                    disabled={selectedReview.status === "completed"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Areas for Improvement
                  </label>
                  <textarea
                    rows={4}
                    value={updateForm.areas_for_improvement}
                    onChange={(e) =>
                      setUpdateForm({
                        ...updateForm,
                        areas_for_improvement: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="What areas need development?"
                    disabled={selectedReview.status === "completed"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goals for Next Period
                  </label>
                  <textarea
                    rows={4}
                    value={updateForm.goals}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, goals: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="What are the goals for the next review period?"
                    disabled={selectedReview.status === "completed"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={updateForm.notes}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={selectedReview.status === "completed"}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedReview(null);
                    resetUpdateForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedReview.status !== "completed" && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Complete Review
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
