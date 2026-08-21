"use client";

/**
 * Listening Circles view — upcoming group support sessions.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Calendar, Mic, Video, Bell, BellOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { eventService } from "@/services/event.service";
import type { ListeningCircle } from "@/types";
import { formatDate } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";

const CATEGORY_COLORS: Record<string, string> = {
  anxiety: "bg-red-50 text-red-600",
  stress: "bg-orange-50 text-orange-600",
  grief: "bg-gray-50 text-gray-600",
  reflection: "bg-blue-50 text-blue-600",
  meditation: "bg-teal-50 text-teal-600",
};

export function CirclesView() {
  const [circles, setCircles] = useState<ListeningCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    eventService.getCircles().then((data) => {
      setCircles(data);
      setIsLoading(false);
    });
  }, []);

  const handleJoin = async (circleId: string) => {
    const updated = await eventService.joinCircle(circleId);
    setCircles((prev) => prev.map((c) => (c.id === circleId ? updated : c)));
  };

  const handleReminder = async (circleId: string) => {
    const updated = await eventService.toggleReminder(circleId);
    setCircles((prev) => prev.map((c) => (c.id === circleId ? updated : c)));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Listening Circles</h1>
        <p className="text-muted mt-1">
          Join small-group support sessions hosted by trained listeners. Real voices, real connection.
        </p>
      </div>

      {/* What is a circle? */}
      <Card className="mb-8 bg-primary-50 border-primary-100">
        <CardContent className="p-5">
          <div className="flex gap-4">
            <div className="text-3xl">🌿</div>
            <div>
              <p className="font-semibold text-text mb-1">What is a Listening Circle?</p>
              <p className="text-sm text-muted leading-relaxed">
                Small groups of 3–10 people, guided by a trained listener. A safe space to share, be heard, and feel less alone — no advice, no judgment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Circles list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {circles.map((circle, i) => (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <CircleCard circle={circle} onJoin={handleJoin} onReminder={handleReminder} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function CircleCard({
  circle,
  onJoin,
  onReminder,
}: {
  circle: ListeningCircle;
  onJoin: (id: string) => void;
  onReminder: (id: string) => void;
}) {
  const spotsLeft = circle.maxParticipants - circle.currentParticipants;
  const isFull = spotsLeft <= 0;
  const isLive = circle.status === "live";

  return (
    <Card className={isLive ? "border-green-300 bg-green-50/30" : ""}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Host avatar */}
          <Avatar
            src={circle.hostAvatar}
            name={circle.hostName}
            size="md"
            className="shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                {isLive && (
                  <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold mb-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
                    LIVE NOW
                  </div>
                )}
                <h3 className="font-semibold text-text">{circle.title}</h3>
                <p className="text-xs text-muted mt-0.5">Hosted by {circle.hostName}</p>
              </div>
              {circle.isJoined && (
                <Badge variant="success" className="shrink-0 gap-1">
                  <CheckCircle2 className="h-3 w-3" />Joined
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted leading-relaxed mb-3">{circle.description}</p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-muted">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDate(circle.scheduledAt, "EEE, MMM d · h:mm a")}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {circle.duration} min
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                {circle.currentParticipants}/{circle.maxParticipants}
                {!isFull && <span className="text-green-600 font-medium">&nbsp;·&nbsp;{spotsLeft} spots left</span>}
                {isFull && <span className="text-red-500 font-medium">&nbsp;·&nbsp;Full</span>}
              </div>
              <div className="flex items-center gap-1">
                {circle.sessionType === "video" ? (
                  <Video className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="capitalize">{circle.sessionType}</span>
              </div>
            </div>

            {/* Category tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {circle.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[tag] || "bg-gray-50 text-gray-600"}`}
                >
                  {tag}
                </span>
              ))}
              {circle.isRecurring && (
                <Badge variant="secondary" className="text-xs">
                  🔄 {circle.recurringSchedule}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={circle.isJoined ? "outline" : "default"}
                onClick={() => onJoin(circle.id)}
                disabled={isFull && !circle.isJoined}
                className="gap-1.5"
              >
                {isLive ? "Join Now" : circle.isJoined ? "Leave Circle" : "Join Circle"}
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onReminder(circle.id)}
                aria-label={circle.hasReminder ? "Remove reminder" : "Set reminder"}
                title={circle.hasReminder ? "Remove reminder" : "Set reminder"}
              >
                {circle.hasReminder ? (
                  <Bell className="h-4 w-4 text-primary fill-primary/20" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
