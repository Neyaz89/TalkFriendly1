"use client";

import React from "react";
import Link from "next/link";
import { Clock, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ListenerApplication } from "@/types/listener-application.types";

interface PendingApplicationsProps {
  applications: ListenerApplication[];
}

export function PendingApplications({ applications }: PendingApplicationsProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pending Applications</h3>
          <p className="text-sm text-gray-500 mt-1">Listener applications awaiting review</p>
        </div>
        <div className="p-2 bg-orange-100 rounded-lg">
          <Clock className="h-5 w-5 text-orange-600" />
        </div>
      </div>

      {applications.length > 0 ? (
        <>
          <div className="space-y-3 mb-4">
            {applications.map((app) => (
              <Link
                key={app.id}
                href={`/admin/listener-applications/${app.id}`}
                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{app.full_legal_name}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{app.professional_title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted {new Date(app.submitted_at || '').toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>

          <Link href="/admin/listener-applications">
            <Button variant="outline" className="w-full">
              View All Applications
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No pending applications</p>
          <p className="text-sm text-gray-400 mt-1">All applications have been reviewed</p>
        </div>
      )}
    </div>
  );
}
