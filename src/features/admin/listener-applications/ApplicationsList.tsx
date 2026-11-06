"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ListenerApplication } from "@/types/listener-application.types";

interface ApplicationsListProps {
  applications: ListenerApplication[];
  totalCount: number;
  currentPage: number;
  currentStatus: string;
  statusCounts: Record<string, number>;
  limit: number;
}

export function ApplicationsList({
  applications,
  totalCount,
  currentPage,
  currentStatus,
  statusCounts,
  limit,
}: ApplicationsListProps) {
  const router = useRouter();

  const statuses = [
    { key: 'all', label: 'All Applications', count: Object.values(statusCounts).reduce((a, b) => a + b, 0) },
    { key: 'pending_review', label: 'Pending Review', count: statusCounts.pending_review || 0 },
    { key: 'additional_info_required', label: 'Info Required', count: statusCounts.additional_info_required || 0 },
    { key: 'approved', label: 'Approved', count: statusCounts.approved || 0 },
    { key: 'rejected', label: 'Rejected', count: statusCounts.rejected || 0 },
  ];

  const totalPages = Math.ceil(totalCount / limit);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (currentStatus !== 'all') params.set('status', currentStatus);
    params.set('page', newPage.toString());
    router.push(`/admin/listener-applications?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    router.push(`/admin/listener-applications?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Status Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2">
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status.key}
              onClick={() => handleStatusChange(status.key)}
              className={`
                px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${
                  currentStatus === status.key
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {status.label}
              <span className={`
                ml-2 px-2 py-0.5 rounded-full text-xs
                ${
                  currentStatus === status.key
                    ? 'bg-white/20'
                    : 'bg-gray-200'
                }
              `}>
                {status.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {applications.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Professional Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => {
                    const statusConfig = getStatusConfig(app.status);
                    
                    return (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-gray-900">{app.full_legal_name}</p>
                            <p className="text-sm text-gray-500">{app.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{app.professional_title}</p>
                          <p className="text-xs text-gray-500">{app.educational_institution}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{app.years_of_experience} years</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`
                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                            ${statusConfig.bgColor} ${statusConfig.textColor}
                          `}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.submitted_at
                            ? new Date(app.submitted_at).toLocaleDateString()
                            : 'Draft'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/admin/listener-applications/${app.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1.5" />
                              Review
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} applications
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, i, arr) => (
                        <React.Fragment key={p}>
                          {i > 0 && arr[i - 1] !== p - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(p)}
                            className={`
                              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                              ${
                                currentPage === p
                                  ? 'bg-primary text-white'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }
                            `}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-500">
              {currentStatus === 'all'
                ? 'No listener applications have been submitted yet.'
                : `No applications with status "${currentStatus}".`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, any> = {
    draft: {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: 'Draft',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
    },
    pending_review: {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: 'Pending Review',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    },
    additional_info_required: {
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      label: 'Info Required',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    },
    approved: {
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      label: 'Approved',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    rejected: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: 'Rejected',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
  };

  return configs[status] || configs.draft;
}
