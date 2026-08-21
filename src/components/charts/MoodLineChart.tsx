"use client";

/**
 * MoodLineChart — reusable mood trend line chart.
 * Wraps Recharts AreaChart for consistent styling.
 */

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { CHART_COLORS } from "@/constants";

interface DataPoint {
  label: string;
  mood: number;
  energy?: number;
  stress?: number;
}

interface MoodLineChartProps {
  data: DataPoint[];
  height?: number;
  showEnergy?: boolean;
  showStress?: boolean;
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl p-3 shadow-medium text-xs">
      <p className="font-semibold text-text mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 capitalize">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted">{p.name}:</span>
          <span className="font-semibold text-text">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function MoodLineChart({
  data,
  height = 200,
  showEnergy = false,
  showStress = false,
}: MoodLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.mood} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.mood} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.energy} stopOpacity={0.15} />
            <stop offset="95%" stopColor={CHART_COLORS.energy} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.stress} stopOpacity={0.15} />
            <stop offset="95%" stopColor={CHART_COLORS.stress} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="mood"
          stroke={CHART_COLORS.mood}
          strokeWidth={2.5}
          fill="url(#moodFill)"
          dot={{ fill: CHART_COLORS.mood, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          name="Mood"
        />
        {showEnergy && (
          <Area
            type="monotone"
            dataKey="energy"
            stroke={CHART_COLORS.energy}
            strokeWidth={2}
            fill="url(#energyFill)"
            dot={{ fill: CHART_COLORS.energy, strokeWidth: 0, r: 3 }}
            name="Energy"
          />
        )}
        {showStress && (
          <Area
            type="monotone"
            dataKey="stress"
            stroke={CHART_COLORS.stress}
            strokeWidth={2}
            fill="url(#stressFill)"
            dot={{ fill: CHART_COLORS.stress, strokeWidth: 0, r: 3 }}
            name="Stress"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
