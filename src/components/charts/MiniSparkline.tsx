"use client";

/**
 * MiniSparkline — tiny inline trend chart for dashboard cards.
 */

import React from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function MiniSparkline({
  data,
  color = "#E97C5A",
  height = 40,
}: MiniSparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-white border border-border rounded-lg px-2 py-1 text-xs shadow-sm">
                {payload[0]?.value}
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
