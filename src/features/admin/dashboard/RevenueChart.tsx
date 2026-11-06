"use client";

import React from "react";
import { DollarSign } from "lucide-react";

interface RevenueChartProps {
  data: Array<{ total_amount: number; created_at: string }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Group revenue by day
  const revenueByDay = groupRevenueByDay(data);
  const maxRevenue = Math.max(...revenueByDay.map(d => d.amount), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
        </div>
        <div className="p-2 bg-emerald-100 rounded-lg">
          <DollarSign className="h-5 w-5 text-emerald-600" />
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-4">
        {revenueByDay.map((day, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-gray-900 font-semibold">
                ${(day.amount / 100).toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(day.amount / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {revenueByDay.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No revenue data available</p>
        </div>
      )}
    </div>
  );
}

function groupRevenueByDay(data: Array<{ total_amount: number; created_at: string }>) {
  const result: { date: string; amount: number }[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayRevenue = data
      .filter(item => {
        const itemDate = new Date(item.created_at).toISOString().split('T')[0];
        return itemDate === dateStr;
      })
      .reduce((sum, item) => sum + item.total_amount, 0);

    result.push({ date: dateStr, amount: dayRevenue });
  }

  return result;
}
