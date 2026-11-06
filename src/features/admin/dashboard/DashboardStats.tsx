"use client";

import React from "react";
import { Users, UserCheck, Calendar, DollarSign, Clock, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
  totalUsers: number;
  totalListeners: number;
  totalAppointments: number;
  totalRevenue: number;
  pendingApplications: number;
  newUsersThisWeek: number;
}

export function DashboardStats({
  totalUsers,
  totalListeners,
  totalAppointments,
  totalRevenue,
  pendingApplications,
  newUsersThisWeek,
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
      subtext: `+${newUsersThisWeek} this week`,
    },
    {
      label: "Verified Listeners",
      value: totalListeners.toLocaleString(),
      icon: UserCheck,
      color: "bg-green-500",
      subtext: pendingApplications > 0 ? `${pendingApplications} pending` : "All reviewed",
    },
    {
      label: "Total Appointments",
      value: totalAppointments.toLocaleString(),
      icon: Calendar,
      color: "bg-purple-500",
      subtext: "All time",
    },
    {
      label: "Total Revenue",
      value: `$${(totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "bg-emerald-500",
      subtext: "Last 30 days",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-xl`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
