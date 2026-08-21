"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { JournalEntry } from "@/types";
import { ROUTES } from "@/constants";
import { truncate, smartDate } from "@/lib/utils";

interface RecentJournalCardProps {
  journal?: JournalEntry;
  reflection?: string;
}

export function RecentJournalCard({ journal, reflection }: RecentJournalCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Journal</p>
            {journal && <p className="text-xs text-muted">{smartDate(journal.createdAt)}</p>}
          </div>
        </div>

        {journal ? (
          <div>
            <p className="text-sm font-semibold text-text mb-1">{journal.title}</p>
            <p className="text-sm text-muted leading-relaxed mb-4">
              {truncate(journal.excerpt || journal.content, 120)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.JOURNAL_ENTRY(journal.id)}>Read more</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.JOURNAL_NEW} className="gap-1">
                  New entry <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted mb-4">
              {reflection || "Write freely about how you're feeling. Your journal is a safe space."}
            </p>
            <Button asChild className="gap-2 group">
              <Link href={ROUTES.JOURNAL_NEW}>
                Start writing
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
