"use client";

import { useState, useEffect } from "react";
import CompactHeader from "@/components/CompactHeader";
import {
  DollarSign,
  Save,
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  Settings,
} from "lucide-react";

export default function PayrollSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    tax_id: "",
    pay_frequency: "bi_weekly",
    overtime_threshold_hours: "40",
    overtime_multiplier: "1.5",
    double_time_multiplier: "2.0",
    next_payroll_date: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/hr/payroll-settings");
      const data = await response.json();
      if (data.success) {
        const s = data.settings;
        setSettings(s);
        setFormData({
          company_name: s.company_name || "",
          tax_id: s.tax_id || "",
          pay_frequency: s.pay_frequency || "bi_weekly",
          overtime_threshold_hours: s.overtime_threshold_hours?.toString() || "40",
          overtime_multiplier: s.overtime_multiplier?.toString() || "1.5",
          double_time_multiplier: s.double_time_multiplier?.toString() || "2.0",
          next_payroll_date: s.next_payroll_date
            ? new Date(s.next_payroll_date).toISOString().split("T")[0]
            : "",
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch("/api/hr/payroll-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: formData.company_name,
          tax_id: formData.tax_id,
          pay_frequency: formData.pay_frequency,
          overtime_threshold_hours: parseFloat(formData.overtime_threshold_hours),
          overtime_multiplier: parseFloat(formData.overtime_multiplier),
          double_time_multiplier: parseFloat(formData.double_time_multiplier),
          next_payroll_date: formData.next_payroll_date
            ? new Date(formData.next_payroll_date).toISOString()
            : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSaved(true);
        loadSettings();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const getPayFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "weekly":
        return "Weekly (52 pay periods)";
      case "bi_weekly":
        return "Bi-Weekly (26 pay periods)";
      case "semi_monthly":
        return "Semi-Monthly (24 pay periods)";
      case "monthly":
        return "Monthly (12 pay periods)";
      default:
        return freq;
    }
  };

  const calculateNextPayDate = (frequency: string, lastPayDate?: string) => {
    if (!lastPayDate) return "Set initial pay date";

    const last = new Date(lastPayDate);
    let next = new Date(last);

    switch (frequency) {
      case "weekly":
        next.setDate(last.getDate() + 7);
        break;
      case "bi_weekly":
        next.setDate(last.getDate() + 14);
        break;
      case "semi_monthly":
        next.setDate(last.getDate() + 15);
        break;
      case "monthly":
        next.setMonth(last.getMonth() + 1);
        break;
    }

    return next.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CompactHeader title="Payroll Settings" backUrl="/hr" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading payroll settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CompactHeader title="Payroll Settings" backUrl="/hr" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {saved && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              Payroll settings saved successfully!
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#3f72af] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Payroll Configuration</p>
              <p>
                Configure your company's payroll settings, pay frequency, and wage
                calculation rules. These settings will be used to calculate employee
                wages and overtime pay.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Company Information
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID / EIN
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="XX-XXXXXXX"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Employer Identification Number
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pay Schedule */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Pay Schedule
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pay Frequency *
                  </label>
                  <select
                    required
                    value={formData.pay_frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, pay_frequency: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="weekly">Weekly (52 pay periods/year)</option>
                    <option value="bi_weekly">Bi-Weekly (26 pay periods/year)</option>
                    <option value="semi_monthly">
                      Semi-Monthly (24 pay periods/year)
                    </option>
                    <option value="monthly">Monthly (12 pay periods/year)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    How often employees are paid
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Payroll Date
                  </label>
                  <input
                    type="date"
                    value={formData.next_payroll_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        next_payroll_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    When is the next pay date?
                  </p>
                </div>
              </div>

              {/* Pay Schedule Info */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-[#3f72af] font-medium mb-1">
                    Current Frequency
                  </p>
                  <p className="text-sm text-blue-900 font-semibold">
                    {getPayFrequencyLabel(formData.pay_frequency)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    Next Pay Date
                  </p>
                  <p className="text-sm text-green-900 font-semibold">
                    {formData.next_payroll_date
                      ? new Date(formData.next_payroll_date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )
                      : "Not set"}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs text-purple-600 font-medium mb-1">
                    Following Pay Date
                  </p>
                  <p className="text-sm text-purple-900 font-semibold">
                    {calculateNextPayDate(
                      formData.pay_frequency,
                      formData.next_payroll_date
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wage Calculation Rules */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Wage Calculation Rules
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Threshold (hours) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.overtime_threshold_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overtime_threshold_hours: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Hours before overtime applies
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Multiplier *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.overtime_multiplier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overtime_multiplier: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Usually 1.5x (time and a half)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Double Time Multiplier *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.double_time_multiplier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        double_time_multiplier: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Usually 2.0x for holidays/weekends
                  </p>
                </div>
              </div>

              {/* Calculation Examples */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Wage Calculation Examples
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>
                      Regular Time (0-{formData.overtime_threshold_hours} hours):
                    </span>
                    <span className="font-semibold">$25.00/hr × 1.0 = $25.00/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Overtime ({formData.overtime_threshold_hours}+ hours):
                    </span>
                    <span className="font-semibold">
                      $25.00/hr × {formData.overtime_multiplier} = $
                      {(25 * parseFloat(formData.overtime_multiplier)).toFixed(2)}
                      /hr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Double Time (holidays/special):</span>
                    <span className="font-semibold">
                      $25.00/hr × {formData.double_time_multiplier} = $
                      {(25 * parseFloat(formData.double_time_multiplier)).toFixed(2)}
                      /hr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={loadSettings}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#5b8ec4] text-white rounded-lg hover:bg-[#3f72af] transition-colors disabled:bg-blue-300 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important Notes</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Changes to pay frequency affect future pay periods only</li>
                <li>Overtime calculations are based on hours per pay period</li>
                <li>
                  Consult with your accountant or HR specialist before making changes
                </li>
                <li>
                  Employee wage rates are configured individually in Employee Management
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Last Updated Info */}
        {settings?.updated_at && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Last updated:{" "}
            {new Date(settings.updated_at).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
