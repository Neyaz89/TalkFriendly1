"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { DailyGoal } from "@/types";

interface DailyGoalsCardProps {
  goals: DailyGoal[];
}

export function DailyGoalsCard({ goals }: DailyGoalsCardProps) {
  const completedCount = goals.filter((g) => g.isCompleted).length;
  const progress = Math.round((completedCount / goals.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Daily Goals</CardTitle>
          <span className="text-sm font-semibold text-primary">
            {completedCount}/{goals.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-primary-500 rounded-full"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              goal.isCompleted ? "bg-green-50" : "hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                goal.isCompleted ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              {goal.isCompleted ? "✅" : goal.icon}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${goal.isCompleted ? "line-through text-muted" : "text-text"}`}>
                {goal.title}
              </p>
            </div>
            <span className="text-xs text-muted font-medium">+{goal.xp} XP</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
