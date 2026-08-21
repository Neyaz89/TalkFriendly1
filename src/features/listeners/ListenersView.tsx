"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Star, Clock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { listenerService } from "@/services/listener.service";
import type { Listener } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ListenerCardSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ROUTES } from "@/constants";

const EXPERTISE_FILTERS = ["anxiety", "stress", "career", "grief", "relationships", "meditation", "students", "burnout"];

export function ListenersView() {
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    listenerService.getListeners({ expertise: selectedExpertise ? [selectedExpertise] : undefined })
      .then((data) => { setListeners(data.listeners); setIsLoading(false); });
  }, [selectedExpertise]);

  const filteredListeners = search
    ? listeners.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.expertise.some((e) => e.toLowerCase().includes(search.toLowerCase())))
    : listeners;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Find a Listener</h1>
        <p className="text-muted mt-1">Book 1-on-1 sessions with verified, trained support specialists.</p>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 mb-8">
        <Input placeholder="Search by name or expertise…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedExpertise(null)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!selectedExpertise ? "bg-primary-500 text-white border-primary-500" : "border-border text-muted hover:border-primary/50"}`}>All</button>
          {EXPERTISE_FILTERS.map((exp) => (
            <button key={exp} onClick={() => setSelectedExpertise(selectedExpertise === exp ? null : exp)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${selectedExpertise === exp ? "bg-primary-500 text-white border-primary-500" : "border-border text-muted hover:border-primary/50"}`}>{exp}</button>
          ))}
        </div>
      </div>

      {/* Listeners grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <ListenerCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListeners.map((listener, i) => (
            <motion.div key={listener.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ListenerCard listener={listener} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListenerCard({ listener }: { listener: Listener }) {
  return (
    <Card className="hover:shadow-card-hover transition-all duration-200 group">
      <CardContent className="p-5">
        <div className="flex gap-4 mb-4">
          <Avatar src={listener.avatar} name={listener.name} size="lg" online={listener.isOnline} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-semibold text-text truncate">{listener.name}</h3>
              {listener.isVerified && <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" aria-label="Verified" />}
            </div>
            <p className="text-xs text-muted mt-0.5 line-clamp-1">{listener.title}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-text">{listener.rating}</span>
              </div>
              <span className="text-xs text-muted">({listener.reviewCount})</span>
              {listener.isOnline && <Badge variant="success" className="text-xs">Online</Badge>}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">{listener.bio}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {listener.expertise.slice(0, 3).map((exp) => (
            <Badge key={exp} variant="secondary" className="text-xs capitalize">{exp}</Badge>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {listener.responseTime.replace("Usually within ", "")}
          </div>
          <span>·</span>
          <span>{listener.experience}y exp</span>
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={ROUTES.LISTENER_BOOK(listener.id)}>
              Book {formatPrice(listener.pricing.perSession)}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.LISTENER(listener.id)}>Profile</Link>
          </Button>
        </div>

        {listener.pricing.trialAvailable && (
          <p className="text-center text-xs text-primary mt-2">
            Free {listener.pricing.trialDuration}-min trial available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
