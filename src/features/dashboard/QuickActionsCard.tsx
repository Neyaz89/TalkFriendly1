"use client";

import React from "react";
import Link from "next/link";
import { Activity, BookOpen, Sparkles, Headphones } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { QuickAction } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  Activity, BookOpen, Sparkles, Headphones,
};

interface QuickActionsCardProps {
  actions: QuickAction[];
}

export function QuickActionsCard({ actions }: QuickActionsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = ICON_MAP[action.icon] || Activity;
          return (
            <Link
              key={action.id}
              href={action.href}
              className={`flex flex-col gap-2 p-3.5 rounded-xl border border-transparent hover:border-border transition-all duration-150 hover:shadow-card group ${action.color}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold leading-tight">{action.label}</p>
                <p className="text-xs opacity-70 leading-tight mt-0.5">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
