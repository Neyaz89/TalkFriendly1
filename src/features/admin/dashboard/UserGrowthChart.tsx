"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

interface UserGrowthChartProps {
  data: Array<{ date: string; count: number }>;
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalNewUsers = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
          <p className="text-sm text-gray-500 mt-1">New registrations (7 days)</p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      {/* Total Badge */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-600 font-medium">Total New Users</p>
        <p className="text-3xl font-bold text-blue-700 mt-1">{totalNewUsers}</p>
      </div>

      {/* Simple Line Chart Visualization */}
      <div className="space-y-3">
        {data.map((day, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-gray-900 font-semibold">{day.count} users</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(day.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No user growth data available</p>
        </div>
      )}
    </div>
  );
}
