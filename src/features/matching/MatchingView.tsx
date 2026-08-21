"use client";

/**
 * Peer matching view — discover people with shared interests and communities.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, MessageCircle, Heart } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { matchingService } from "@/services/matching.service";
import type { PeerMatch } from "@/mocks/matching.mock";
import { CardSkeleton } from "@/components/ui/skeleton";

export function MatchingView() {
  const [matches, setMatches] = useState<PeerMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connected, setConnected] = useState<Set<string>>(new Set());

  useEffect(() => {
    void matchingService.getPeerMatches().then((data) => {
      setMatches(data);
      setIsLoading(false);
    });
  }, []);

  const handleConnect = (id: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Find Your People</h1>
        <p className="text-muted mt-1">
          Connect with members who share your interests, struggles, and communities.
        </p>
      </div>

      {/* Intro banner */}
      <Card className="mb-8 bg-primary-50 border-primary-100">
        <CardContent className="p-5 flex gap-4 items-start">
          <div className="text-3xl">🤝</div>
          <div>
            <p className="font-semibold text-text mb-1">Peer matching is private</p>
            <p className="text-sm text-muted leading-relaxed">
              We suggest connections based on shared interests and communities. Only members who have enabled peer matching in settings will appear here. Your contact info is never shared.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <PeerMatchCard
                match={match}
                isConnected={connected.has(match.id)}
                onConnect={handleConnect}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PeerMatchCard({
  match,
  isConnected,
  onConnect,
}: {
  match: PeerMatch;
  isConnected: boolean;
  onConnect: (id: string) => void;
}) {
  return (
    <Card className="hover:shadow-card-hover transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar
            src={match.avatar}
            name={match.name}
            size="lg"
            online={match.isOnline}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold text-text">{match.name}</h3>
                <p className="text-xs text-muted mt-0.5 line-clamp-2">{match.bio}</p>
              </div>

              {/* Compatibility score */}
              <div className="text-center shrink-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                  style={{
                    borderColor:
                      match.compatibilityScore >= 90
                        ? "#22C55E"
                        : match.compatibilityScore >= 75
                        ? "#F59E0B"
                        : "#9CA3AF",
                  }}
                >
                  <span className="text-xs font-bold text-text">
                    {match.compatibilityScore}%
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">match</p>
              </div>
            </div>

            {/* Shared interests */}
            <div className="mt-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Shared interests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {match.sharedInterests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs capitalize">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Mutual communities */}
            {match.mutualCommunities.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    Both in:{" "}
                    <span className="text-text font-medium">
                      {match.mutualCommunities.join(", ")}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant={isConnected ? "outline" : "default"}
                onClick={() => onConnect(match.id)}
                className="gap-1.5"
              >
                <Heart
                  className={`h-4 w-4 ${isConnected ? "fill-primary text-primary" : ""}`}
                  aria-hidden="true"
                />
                {isConnected ? "Connected" : "Connect"}
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
