"use client";

import { useState, useEffect } from "react";
import { doctorService } from "@/services/doctor.service";
import type { DoctorWithProfile, DoctorFilterParams } from "@/types";
import { DoctorCard } from "./DoctorCard";
import { DoctorFilters } from "./DoctorFilters";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Stethoscope, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function DoctorsView() {
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<DoctorFilterParams>({
    page: 1,
    limit: 12,
  });
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, [filters]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const { doctors: data, total: totalCount } = await doctorService.getDoctors(filters);
      
      if (filters.page === 1) {
        setDoctors(data);
      } else {
        setDoctors(prev => [...prev, ...data]);
      }
      
      setTotal(totalCount);
      setHasMore(doctors.length + data.length < totalCount);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handleFilterChange = (newFilters: Partial<DoctorFilterParams>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const handleLoadMore = () => {
    setFilters(prev => ({
      ...prev,
      page: (prev.page || 1) + 1,
    }));
  };

  if (loading && filters.page === 1) {
    return <PageLoader message="Loading doctors..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Find a Doctor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover verified mental health professionals
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, specialization, or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>

        {/* Filters */}
        <DoctorFilters
          currentFilters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'doctor' : 'doctors'} found
          </p>
        </div>

        {/* Doctors Grid */}
        {doctors.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Stethoscope className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No doctors found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map(doctor => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Doctors'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
