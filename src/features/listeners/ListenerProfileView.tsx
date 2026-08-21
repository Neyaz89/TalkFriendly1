"use client";

/**
 * Detailed listener profile — bio, expertise, reviews, availability calendar, and booking CTA.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, CheckCircle2, Clock, Globe2,
  MessageSquare, Calendar, Video, Mic, Award,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listenerService } from "@/services/listener.service";
import type { Listener, ListenerReview } from "@/types";
import { ROUTES } from "@/constants";
import { formatDate, formatPrice, timeAgo } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";

export function ListenerProfileView({ listenerId }: { listenerId: string }) {
  const [listener, setListener] = useState<Listener | null>(null);
  const [reviews, setReviews] = useState<ListenerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listenerService.getListenerById(listenerId),
      listenerService.getListenerReviews(listenerId),
    ]).then(([l, r]) => {
      setListener(l);
      setReviews(r);
      setIsLoading(false);
    });
  }, [listenerId]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <CardSkeleton className="h-60" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!listener) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={ROUTES.LISTENERS} className="p-2 rounded-xl hover:bg-secondary text-muted hover:text-text transition-colors" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-text">Listener Profile</h1>
      </div>

      {/* Hero card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="shrink-0">
              <Avatar src={listener.avatar} name={listener.name} size="xl" online={listener.isOnline} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-text">{listener.name}</h2>
                    {listener.isVerified && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" aria-label="Verified listener" />
                    )}
                  </div>
                  <p className="text-muted text-sm mt-0.5">{listener.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-text">{formatPrice(listener.pricing.perSession)}</p>
                  <p className="text-xs text-muted">per 60-min session</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <div className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Star className="h-4 w-4 fill-current" />
                  {listener.rating}
                  <span className="text-muted font-normal">({listener.reviewCount} reviews)</span>
                </div>
                <span className="text-muted">·</span>
                <span className="text-muted">{listener.sessionCount} sessions</span>
                <span className="text-muted">·</span>
                <span className="text-muted">{listener.experience} years exp</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {listener.badges.map((badge) => (
                  <Badge key={badge} variant="default" className="text-xs">{badge}</Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button asChild className="gap-2">
                  <Link href={ROUTES.LISTENER_BOOK(listenerId)}>
                    <Calendar className="h-4 w-4" />Book a Session
                  </Link>
                </Button>
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />Message
                </Button>
              </div>

              {listener.pricing.trialAvailable && (
                <p className="text-sm text-primary mt-2 font-medium">
                  ✓ Free {listener.pricing.trialDuration}-minute trial available
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Clock, label: "Response time", value: listener.responseTime.replace("Usually within ", "") },
          { icon: Globe2, label: "Languages", value: listener.languages.join(", ") },
          { icon: Video, label: "Video sessions", value: "Available" },
          { icon: Mic, label: "Audio sessions", value: "Available" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-border p-3 text-center">
            <Icon className="h-4 w-4 text-muted mx-auto mb-1" />
            <p className="text-xs text-muted">{label}</p>
            <p className="text-xs font-semibold text-text mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* About */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">About {listener.name.split(" ")[0]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">{listener.bio}</p>

          {listener.education && (
            <div className="flex items-start gap-2">
              <Award className="h-4 w-4 text-muted shrink-0 mt-0.5" />
              <p className="text-sm text-text">{listener.education}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Specializes in</p>
            <div className="flex flex-wrap gap-1.5">
              {listener.expertise.map((exp) => (
                <Badge key={exp} variant="secondary" className="capitalize">{exp}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session durations + pricing */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Session Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {listener.pricing.sessionDurations.map((duration) => {
              const price = Math.round((listener.pricing.perSession * duration) / 60);
              return (
                <div key={duration} className="text-center p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary-50 transition-colors cursor-pointer">
                  <p className="text-lg font-bold text-text">{duration}</p>
                  <p className="text-xs text-muted">minutes</p>
                  <p className="text-sm font-semibold text-primary mt-1">{formatPrice(price)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming availability */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {listener.availability.slots.slice(0, 2).map((slot) => (
              <div key={slot.date} className="flex items-center justify-between">
                <p className="text-sm font-medium text-text">{formatDate(slot.date, "EEEE, MMM d")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {slot.times.slice(0, 4).map((time) => (
                    <span key={time} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-medium">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button asChild className="w-full mt-4" size="lg">
            <Link href={ROUTES.LISTENER_BOOK(listenerId)}>
              Book a Session
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Reviews</CardTitle>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-bold text-text">{listener.rating}</span>
              <span className="text-xs text-muted">({listener.reviewCount})</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-gray-50 border border-border"
              >
                <div className="flex items-start gap-3 mb-2">
                  <Avatar src={review.userAvatar} name={review.userName} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-text">{review.userName}</p>
                      <span className="text-xs text-muted">{timeAgo(review.createdAt)}</span>
                    </div>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted leading-relaxed italic">&ldquo;{review.comment}&rdquo;</p>
                <Badge variant="secondary" className="text-xs mt-2 capitalize">{review.sessionType} session</Badge>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
