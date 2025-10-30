"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import PageHeader from '@/components/PageHeader';

export default function SiteMapsListPage() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await fetch("/api/sites");
      const data = await response.json();
      if (data.success) {
        setSites(data.sites || []);
      }
    } catch (error) {
      console.error("Error loading sites:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Maps"
        subtitle="Manage maps"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sites", href: "/sites" }, { label: "Maps" }]}
      />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Maps</h1>
            <p className="text-gray-600">Select a site to view or edit its map annotations</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading sites...</p>
            </div>
          ) : sites.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sites Yet</h3>
              <p className="text-gray-600 mb-4">Create a site first to add map annotations</p>
              <button
                onClick={() => router.push("/sites/create")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5b8ec4] text-white rounded-lg hover:bg-[#3f72af] transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Site
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map((site: any) => (
                <div
                  key={site.id}
                  onClick={() => router.push(`/sites/${site.id}/maps`)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <MapPin className="h-16 w-16 text-white opacity-50" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {site.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {site.address || "No address specified"}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {site.customer_name || "No customer"}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        View Map
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
