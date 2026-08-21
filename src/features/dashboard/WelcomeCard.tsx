"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "@/types";
import { MOOD_BG_COLORS, MOOD_LABELS } from "@/types/mood.types";
import { ROUTES, MOOD_EMOJIS } from "@/constants";
import { formatDate } from "@/lib/utils";

interface WelcomeCardProps {
  data: DashboardData;
}

export function WelcomeCard({ data }: WelcomeCardProps) {
  const todayEntry = data.todayCheckIn;
  const mood = todayEntry?.mood;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            {todayEntry ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{mood ? MOOD_EMOJIS[mood] : "😐"}</span>
                  <Badge
                    variant={`mood-${mood}` as "mood-1" | "mood-2" | "mood-3" | "mood-4" | "mood-5"}
                  >
                    {mood ? MOOD_LABELS[mood] : "Checked in"}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-text mb-1">Today&apos;s check-in complete</p>
                <p className="text-sm text-muted">{formatDate(todayEntry.createdAt, "EEEE, MMMM d")}</p>

                {todayEntry.aiInsight && (
                  <div className="mt-4 flex gap-2 p-3 bg-primary-50 rounded-xl border border-primary-100">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm text-primary-800">{todayEntry.aiInsight}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-text mb-1">How are you feeling today?</p>
                <p className="text-sm text-muted mb-4">Take 2 minutes to check in with yourself.</p>
                <Button asChild className="gap-2 group">
                  <Link href={ROUTES.CHECKIN}>
                    Start check-in
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mood indicator visual */}
          {mood && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="shrink-0"
            >
              <div
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center"
                style={{ backgroundColor: MOOD_BG_COLORS[mood] + "20", border: `2px solid ${MOOD_BG_COLORS[mood]}30` }}
              >
                <span className="text-3xl">{MOOD_EMOJIS[mood]}</span>
                <span className="text-xs font-medium mt-1" style={{ color: MOOD_BG_COLORS[mood] }}>
                  {MOOD_LABELS[mood]}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Today's reflection */}
        {data.todayReflection && (
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Today&apos;s Reflection
            </p>
            <p className="text-sm text-text italic leading-relaxed">&quot;{data.todayReflection}&quot;</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
