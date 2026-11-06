"use client";

import React from "react";
import Link from "next/link";
import { Activity, Calendar, ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentActivityProps {
  appointments: any[];
}

export function RecentActivity({ appointments }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500 mt-1">Latest appointments</p>
        </div>
        <div className="p-2 bg-purple-100 rounded-lg">
          <Activity className="h-5 w-5 text-purple-600" />
        </div>
      </div>

      {appointments.length > 0 ? (
        <>
          <div className="space-y-3 mb-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Video className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        px-2 py-0.5 text-xs font-medium rounded-full
                        ${getStatusColor(appointment.status)}
                      `}>
                        {formatStatus(appointment.status)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {appointment.user?.full_name || appointment.user?.username || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      with {appointment.listener?.full_name || appointment.listener?.username || 'Unknown Listener'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(appointment.scheduled_start_time || appointment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/admin/appointments">
            <Button variant="outline" className="w-full">
              View All Appointments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No recent activity</p>
          <p className="text-sm text-gray-400 mt-1">Appointments will appear here</p>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
