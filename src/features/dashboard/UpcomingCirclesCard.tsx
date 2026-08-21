"use client";

import React from "react";
import Link from "next/link";
import { Circle, Users, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ListeningCircle } from "@/types";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";

interface UpcomingCirclesCardProps {
  circles: ListeningCircle[];
}

export function UpcomingCirclesCard({ circles }: UpcomingCirclesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Upcoming Circles</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.CIRCLES} className="text-primary text-xs">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {circles.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">No upcoming circles.</p>
        ) : (
          circles.slice(0, 2).map((circle) => (
            <div key={circle.id} className="p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Circle className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-text truncate">{circle.title}</p>
                  </div>
                  <p className="text-xs text-muted ml-5">{circle.hostName}</p>
                </div>
                {circle.isJoined ? (
                  <Badge variant="success" className="shrink-0">Joined</Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">Open</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 ml-5">
                <div className="flex items-center gap-1 text-muted text-xs">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatDate(circle.scheduledAt, "MMM d, h:mm a")}
                </div>
                <div className="flex items-center gap-1 text-muted text-xs">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  {circle.currentParticipants}/{circle.maxParticipants}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
