"use client";

import React from "react";
import Link from "next/link";
import { Star, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { Listener } from "@/types";
import { ROUTES } from "@/constants";
import { formatPrice } from "@/lib/utils";

interface RecommendedListenerCardProps {
  listener: Listener;
}

export function RecommendedListenerCard({ listener }: RecommendedListenerCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Recommended Listener</p>

        <div className="flex gap-4">
          <Avatar src={listener.avatar} name={listener.name} size="lg" online={listener.isOnline} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-text">{listener.name}</p>
                <p className="text-xs text-muted mt-0.5">{listener.title}</p>
              </div>
              {listener.isVerified && (
                <Badge variant="success" className="shrink-0">✓ Verified</Badge>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span className="text-xs font-semibold">{listener.rating}</span>
                <span className="text-xs text-muted">({listener.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1 text-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs">{listener.responseTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {listener.expertise.slice(0, 3).map((exp) => (
            <Badge key={exp} variant="secondary" className="text-xs capitalize">{exp}</Badge>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button asChild size="sm" className="flex-1 gap-1.5">
            <Link href={ROUTES.LISTENER_BOOK(listener.id)}>
              Book session
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link href={ROUTES.LISTENER(listener.id)}>
              View <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <p className="text-xs text-center text-muted mt-2">
          From {formatPrice(listener.pricing.perSession)} / session
          {listener.pricing.trialAvailable && " · Free trial available"}
        </p>
      </CardContent>
    </Card>
  );
}
