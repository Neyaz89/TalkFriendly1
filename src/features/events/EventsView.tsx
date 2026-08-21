"use client";

/**
 * Events view — weekly wellness events open to the community.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, CheckCircle2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { eventService } from "@/services/event.service";
import type { AppEvent } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";

const CATEGORY_LABELS: Record<string, string> = {
  gratitude: "Gratitude",
  "work-stress": "Work & Stress",
  anxiety: "Anxiety",
  relationships: "Relationships",
  reflection: "Reflection",
  meditation: "Meditation",
  parenting: "Parenting",
  general: "General",
};

const CATEGORY_COLORS: Record<string, string> = {
  gratitude: "bg-amber-50 text-amber-700",
  "work-stress": "bg-orange-50 text-orange-700",
  anxiety: "bg-red-50 text-red-700",
  relationships: "bg-pink-50 text-pink-700",
  reflection: "bg-blue-50 text-blue-700",
  meditation: "bg-teal-50 text-teal-700",
};

export function EventsView() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    eventService.getEvents().then((data) => {
      setEvents(data);
      setIsLoading(false);
    });
  }, []);

  const handleJoin = async (eventId: string) => {
    const updated = await eventService.joinEvent(eventId);
    setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Events</h1>
        <p className="text-muted mt-1">
          Weekly workshops, circles, and masterclasses — for every stage of your wellness journey.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <EventCard event={event} onJoin={handleJoin} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onJoin }: { event: AppEvent; onJoin: (id: string) => void }) {
  const attendancePercent = event.maxAttendees
    ? Math.round((event.currentAttendees / event.maxAttendees) * 100)
    : 0;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {event.hostAvatar ? (
            <Avatar src={event.hostAvatar} name={event.hostName} size="md" className="shrink-0" />
          ) : (
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xl">🌿</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[event.category] || "bg-gray-50 text-gray-600"}`}>
                    {CATEGORY_LABELS[event.category] || event.category}
                  </span>
                  {event.isFree ? (
                    <Badge variant="success" className="text-xs">Free</Badge>
                  ) : event.price ? (
                    <Badge variant="secondary" className="text-xs">{formatPrice(event.price)}</Badge>
                  ) : null}
                </div>
                <h3 className="font-semibold text-text">{event.title}</h3>
                <p className="text-xs text-muted mt-0.5">by {event.hostName}</p>
              </div>
              {event.isJoined && (
                <Badge variant="success" className="gap-1 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />Registered
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted leading-relaxed mb-3">{event.description}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDate(event.scheduledAt, "EEE, MMM d · h:mm a")}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {event.duration} min
              </div>
              <div className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" aria-hidden="true" />
                {event.format.charAt(0).toUpperCase() + event.format.slice(1)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                {event.currentAttendees.toLocaleString()} attending
                {event.maxAttendees && ` · ${event.maxAttendees - event.currentAttendees} spots left`}
              </div>
            </div>

            {/* Attendance bar */}
            {event.maxAttendees && (
              <div className="mb-4">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-400 rounded-full transition-all"
                    style={{ width: `${attendancePercent}%` }}
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs text-muted mt-1">{attendancePercent}% full</p>
              </div>
            )}

            <Button
              size="sm"
              variant={event.isJoined ? "outline" : "default"}
              onClick={() => onJoin(event.id)}
            >
              {event.isJoined ? "Cancel RSVP" : event.isFree ? "Register Free" : `Register · ${formatPrice(event.price || 0)}`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
