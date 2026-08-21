"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, BarChart2, Zap } from "lucide-react";
import { aiService } from "@/services/ai.service";
import type { AiInsight } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  mood: TrendingUp,
  pattern: BarChart2,
  streak: Zap,
  journal: TrendingUp,
};

const INSIGHT_COLORS: Record<string, string> = {
  mood: "bg-blue-50 text-blue-600",
  pattern: "bg-purple-50 text-purple-600",
  streak: "bg-orange-50 text-orange-600",
  journal: "bg-green-50 text-green-600",
};

export function AiInsightsPanel() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    aiService.getInsights().then((d) => { setInsights(d); setIsLoading(false); });
  }, []);

  return (
    <div className="p-4">
      <p className="text-sm font-semibold text-text mb-4">Your Insights</p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const Icon = INSIGHT_ICONS[insight.type] || TrendingUp;
            const colorClass = INSIGHT_COLORS[insight.type] || "bg-gray-50 text-gray-600";

            return (
              <div key={insight.id} className="p-3 rounded-xl border border-border bg-white hover:shadow-card transition-shadow">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium mb-2 ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} insight
                </div>
                <p className="text-xs font-semibold text-text mb-1">{insight.title}</p>
                <p className="text-xs text-muted leading-relaxed">{insight.description}</p>
                <p className="text-xs text-muted mt-2">{formatDate(insight.generatedAt, "MMM d")}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
