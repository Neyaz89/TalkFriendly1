"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, Lock } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import { communityService } from "@/services/community.service";
import type { Community, CommunityCategory } from "@/types";
import { ROUTES, COMMUNITY_CATEGORY_LABELS } from "@/constants";
import { CardSkeleton } from "@/components/ui/skeleton";

const CATEGORIES: CommunityCategory[] = ["anxiety", "stress", "career", "students", "meditation", "relationships", "grief", "parenting", "gaming", "weekly-reflection"];

const CATEGORY_COLORS: Record<string, string> = {
  anxiety: "bg-red-50 text-red-600 border-red-100",
  stress: "bg-orange-50 text-orange-600 border-orange-100",
  career: "bg-blue-50 text-blue-600 border-blue-100",
  students: "bg-purple-50 text-purple-600 border-purple-100",
  meditation: "bg-teal-50 text-teal-600 border-teal-100",
  relationships: "bg-pink-50 text-pink-600 border-pink-100",
  grief: "bg-gray-50 text-gray-600 border-gray-100",
  parenting: "bg-green-50 text-green-600 border-green-100",
  gaming: "bg-indigo-50 text-indigo-600 border-indigo-100",
  "weekly-reflection": "bg-primary-50 text-primary-600 border-primary-100",
};

export function CommunitiesView() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | null>(null);
  const [showJoined, setShowJoined] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    communityService.getCommunities({ category: selectedCategory || undefined, search, joined: showJoined || undefined })
      .then((data) => { setCommunities(data.communities); setIsLoading(false); });
  }, [selectedCategory, search, showJoined]);

  const handleJoin = async (communityId: string, isJoined: boolean) => {
    const updated = isJoined
      ? await communityService.leaveCommunity(communityId)
      : await communityService.joinCommunity(communityId);
    setCommunities((prev) => prev.map((c) => c.id === communityId ? updated : c));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Communities</h1>
        <p className="text-muted mt-1">Find your people. Share, support, and grow together.</p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3 mb-8">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input placeholder="Search communities…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button
            onClick={() => setShowJoined((v) => !v)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${showJoined ? "bg-primary-500 text-white border-primary-500" : "border-border text-muted hover:border-primary/50"}`}
          >
            My communities
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedCategory(null)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!selectedCategory ? "bg-primary-500 text-white border-primary-500" : "border-border text-muted"}`}>All</button>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCategory === cat ? "bg-primary-500 text-white border-primary-500" : "border-border text-muted hover:border-primary/50"}`}>
              {COMMUNITY_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community, i) => (
            <motion.div key={community.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <CommunityCard community={community} onJoin={handleJoin} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityCard({ community, onJoin }: { community: Community; onJoin: (id: string, isJoined: boolean) => void }) {
  return (
    <Card className="hover:shadow-card-hover transition-all duration-200 h-full flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${CATEGORY_COLORS[community.category] || "bg-gray-50 text-gray-600"}`}>
            {COMMUNITY_CATEGORY_LABELS[community.category] || community.category}
          </span>
          {community.isPrivate && <Lock className="h-3.5 w-3.5 text-muted shrink-0" aria-label="Private community" />}
        </div>

        <Link href={ROUTES.COMMUNITY(community.id)} className="group flex-1">
          <h3 className="font-semibold text-text mb-2 group-hover:text-primary transition-colors">{community.name}</h3>
          <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-3">{community.description}</p>
        </Link>

        {community.weeklyQuestion && (
          <div className="bg-secondary rounded-xl px-3 py-2 mb-3">
            <p className="text-xs text-muted font-medium mb-0.5">This week:</p>
            <p className="text-xs text-text italic line-clamp-2">&ldquo;{community.weeklyQuestion}&rdquo;</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-muted">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs">{community.memberCount.toLocaleString()}</span>
          </div>
          <Button
            size="sm"
            variant={community.isJoined ? "outline" : "default"}
            onClick={() => onJoin(community.id, community.isJoined)}
            className="text-xs"
          >
            {community.isJoined ? "Leave" : "Join"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
