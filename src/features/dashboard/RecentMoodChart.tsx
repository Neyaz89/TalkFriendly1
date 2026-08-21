"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { MoodEntry } from "@/types";
import { CHART_COLORS } from "@/constants";
import { formatDate } from "@/lib/utils";

interface RecentMoodChartProps {
  moods: MoodEntry[];
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl p-3 shadow-medium text-xs">
      <p className="font-medium text-text mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted capitalize">{p.name}:</span>
          <span className="font-semibold text-text">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function RecentMoodChart({ moods }: RecentMoodChartProps) {
  const chartData = [...moods]
    .reverse()
    .map((entry) => ({
      date: formatDate(entry.createdAt, "EEE"),
      mood: entry.mood,
      energy: entry.energy,
      stress: entry.stress,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">7-Day Mood Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.mood} stopOpacity={0.2} />
                <stop offset="95%" stopColor={CHART_COLORS.mood} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.energy} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.energy} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis domain={[1, 10]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="mood" stroke={CHART_COLORS.mood} strokeWidth={2} fill="url(#moodGrad)" dot={{ fill: CHART_COLORS.mood, strokeWidth: 2, r: 3 }} />
            <Area type="monotone" dataKey="energy" stroke={CHART_COLORS.energy} strokeWidth={2} fill="url(#energyGrad)" dot={{ fill: CHART_COLORS.energy, strokeWidth: 2, r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-4 mt-2">
          {[{ label: "Mood", color: CHART_COLORS.mood }, { label: "Energy", color: CHART_COLORS.energy }].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-xs text-muted">{l.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
