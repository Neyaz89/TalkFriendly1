"use client";

/**
 * WeeklyBarChart — reusable bar chart for weekly metrics.
 */

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface WeeklyBarChartProps {
  data: DataPoint[];
  height?: number;
  barColor?: string;
  dataKey?: string;
}

interface TooltipPayload {
  value: number;
  payload: DataPoint;
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
      <p className="font-semibold text-text">{label}</p>
      <p className="text-muted mt-1">Value: <strong>{payload[0]?.value}</strong></p>
    </div>
  );
}

export function WeeklyBarChart({
  data,
  height = 180,
  barColor = "#E97C5A",
}: WeeklyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || barColor}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
