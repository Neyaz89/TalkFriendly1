"use client";

import React from "react";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { Community } from "@/types";
import { ROUTES, COMMUNITY_CATEGORY_LABELS } from "@/constants";

const CATEGORY_COLORS: Record<string, string> = {
  anxiety: "bg-red-50 text-red-600",
  stress: "bg-orange-50 text-orange-600",
  career: "bg-blue-50 text-blue-600",
  students: "bg-purple-50 text-purple-600",
  meditation: "bg-teal-50 text-teal-600",
  relationships: "bg-pink-50 text-pink-600",
  grief: "bg-gray-50 text-gray-600",
  parenting: "bg-green-50 text-green-600",
  gaming: "bg-indigo-50 text-indigo-600",
  wellness: "bg-emerald-50 text-emerald-600",
  "weekly-reflection": "bg-primary-50 text-primary-600",
};

interface RecommendedCommunitiesCardProps {
  communities: Community[];
}

export function RecommendedCommunitiesCard({ communities }: RecommendedCommunitiesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recommended Communities</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.COMMUNITIES} className="text-primary text-xs gap-1">
              Explore <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-4">
          {communities.slice(0, 3).map((community) => (
            <Link
              key={community.id}
              href={ROUTES.COMMUNITY(community.id)}
              className="p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-card transition-all duration-150 group"
            >
              <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium mb-3 ${CATEGORY_COLORS[community.category] || "bg-gray-50 text-gray-600"}`}>
                {COMMUNITY_CATEGORY_LABELS[community.category] || community.category}
              </div>
              <p className="text-sm font-semibold text-text mb-1 group-hover:text-primary transition-colors">
                {community.name}
              </p>
              <p className="text-xs text-muted leading-relaxed line-clamp-2">{community.description}</p>
              <div className="flex items-center gap-1 mt-3 text-muted">
                <Users className="h-3 w-3" aria-hidden="true" />
                <span className="text-xs">{community.memberCount.toLocaleString()} members</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
