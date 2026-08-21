"use client";

/**
 * Mood analytics view.
 * Displays detailed mood history, charts, trends, and individual entries.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { moodService } from "@/services/mood.service";
import type { MoodHistory, MoodEntry } from "@/types";
import { MOOD_BG_COLORS, MOOD_LABELS } from "@/types/mood.types";
import { ROUTES, CHART_COLORS, MOOD_EMOJIS } from "@/constants";
import { formatDate, smartDate } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";

type TabKey = "weekly" | "monthly";

export function MoodsView() {
  const [history, setHistory] = useState<MoodHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("weekly");

  useEffect(() => {
    moodService.getMoods().then((data) => {
      setHistory(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (!history) return null;

  const chartData = history.weeklyData.map((d) => ({
    date: formatDate(d.date, "EEE"),
    Mood: d.mood,
    Energy: d.energy,
    Stress: d.stress,
    Sleep: d.sleep,
    Anxiety: d.anxiety,
  }));

  const TrendIcon = history.moodTrend === "improving"
    ? TrendingUp
    : history.moodTrend === "declining"
      ? TrendingDown
      : Minus;

  const trendColor = history.moodTrend === "improving"
    ? "text-green-600 bg-green-50"
    : history.moodTrend === "declining"
      ? "text-red-600 bg-red-50"
      : "text-amber-600 bg-amber-50";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">Mood Analytics</h1>
          <p className="text-sm text-muted mt-0.5">Track your emotional patterns over time.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href={ROUTES.CHECKIN}><Plus className="h-4 w-4" />Check in</Link>
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Avg Mood", value: history.averageMood.toFixed(1) + "/5", icon: "😊" },
          { label: "Avg Energy", value: history.averageEnergy.toFixed(1) + "/10", icon: "⚡" },
          { label: "Avg Stress", value: history.averageStress.toFixed(1) + "/10", icon: "😤" },
          { label: "Entries", value: history.entries.length.toString(), icon: "📊" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <span className="text-2xl block mb-1">{stat.icon}</span>
              <p className="text-xl font-bold text-text">{stat.value}</p>
              <p className="text-xs text-muted mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium mb-6 ${trendColor}`}>
        <TrendIcon className="h-4 w-4" aria-hidden="true" />
        Mood is{" "}
        {history.moodTrend === "improving"
          ? "improving this week"
          : history.moodTrend === "declining"
            ? "declining this week"
            : "stable this week"}
      </div>

      {/* Chart tabs */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Mood & Energy Chart</CardTitle>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(["weekly", "monthly"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${activeTab === tab ? "bg-white shadow-sm text-text" : "text-muted"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {Object.entries(CHART_COLORS).map(([key, color]) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: "1px solid #E5E7EB", borderRadius: "12px", fontSize: "12px" }}
                itemStyle={{ color: "#1E1E1E" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Area type="monotone" dataKey="Mood" stroke={CHART_COLORS.mood} strokeWidth={2} fill={`url(#grad-mood)`} dot={{ r: 3 }} />
              <Area type="monotone" dataKey="Energy" stroke={CHART_COLORS.energy} strokeWidth={2} fill={`url(#grad-energy)`} dot={{ r: 3 }} />
              <Area type="monotone" dataKey="Stress" stroke={CHART_COLORS.stress} strokeWidth={2} fill={`url(#grad-stress)`} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sleep & Anxiety bar chart */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sleep & Anxiety</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: "12px", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar dataKey="Sleep" fill={CHART_COLORS.sleep} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Anxiety" fill={CHART_COLORS.anxiety} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent entries */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Check-in History</h2>
        <div className="space-y-3">
          {history.entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <MoodEntryRow entry={entry} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoodEntryRow({ entry }: { entry: MoodEntry }) {
  const moodColor = MOOD_BG_COLORS[entry.mood];

  return (
    <Card className="hover:shadow-card transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Mood indicator */}
          <div
            className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
            style={{ backgroundColor: moodColor + "20", border: `2px solid ${moodColor}30` }}
          >
            <span className="text-xl">{MOOD_EMOJIS[entry.mood]}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-text">{MOOD_LABELS[entry.mood]}</p>
              <p className="text-xs text-muted shrink-0">{smartDate(entry.createdAt)}</p>
            </div>

            {/* Metric pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: "Energy", value: entry.energy, color: "bg-green-50 text-green-700" },
                { label: "Stress", value: entry.stress, color: "bg-red-50 text-red-700" },
                { label: "Sleep", value: entry.sleep, color: "bg-blue-50 text-blue-700" },
                { label: "Anxiety", value: entry.anxiety, color: "bg-amber-50 text-amber-700" },
              ].map((m) => (
                <span key={m.label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.color}`}>
                  {m.label} {m.value}/10
                </span>
              ))}
            </div>

            {entry.notes && (
              <p className="text-xs text-muted mt-2 italic line-clamp-1">&ldquo;{entry.notes}&rdquo;</p>
            )}

            {entry.aiInsight && (
              <p className="text-xs text-primary-700 mt-2 bg-primary-50 px-2 py-1 rounded-lg">
                ✨ {entry.aiInsight}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
