"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MoodStreakCardProps {
  streak: number;
}

export function MoodStreakCard({ streak }: MoodStreakCardProps) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const checkedDays = Math.min(streak, 7);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-muted mb-1">Current Streak</p>
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-4xl font-bold text-text"
              >
                {streak}
              </motion.span>
              <span className="text-muted font-medium">days</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Flame className="h-6 w-6 text-orange-500" aria-hidden="true" />
          </div>
        </div>

        {/* Day indicators */}
        <div className="flex gap-1.5 mb-4">
          {days.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-8 rounded-lg flex items-center justify-center transition-colors ${
                  i < checkedDays
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-300"
                }`}
              >
                {i < checkedDays && "✓"}
              </div>
              <span className="text-xs text-muted">{day}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 rounded-xl px-3 py-2">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          <p className="text-xs font-medium">Mood trending up this week</p>
        </div>
      </CardContent>
    </Card>
  );
}
