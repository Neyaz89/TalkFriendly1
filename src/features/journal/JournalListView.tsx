"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { CardSkeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ALL_TAGS = ["stress", "work", "gratitude", "healing", "anxiety", "growth", "social", "rest"];

const MOOD_EMOJIS: Record<string, string> = {
  struggling: "😔",
  low: "😕",
  okay: "😐",
  good: "🙂",
  great: "😊",
};

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function JournalListView() {
  const { user } = useAuth();
  const supabase = createClient();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [user, search, selectedTag]);

  async function loadEntries() {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      // Apply tag filter
      if (selectedTag) {
        query = query.contains('tags', [selectedTag]);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEntries(data || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getWordCount(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">My Journal</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href={ROUTES.JOURNAL_NEW}>
            <Plus className="h-4 w-4" />
            New Entry
          </Link>
        </Button>
      </div>

      {/* Search + Tags */}
      <div className="space-y-3 mb-6">
        <Input
          placeholder="Search your journal…"
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !selectedTag 
                ? "bg-primary text-white border-primary" 
                : "border-gray-300 text-gray-600 hover:border-primary/50"
            }`}
          >
            All
          </button>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                selectedTag === tag 
                  ? "bg-primary text-white border-primary" 
                  : "border-gray-300 text-gray-600 hover:border-primary/50"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-black mb-2">
            {search || selectedTag ? 'No entries found' : 'No entries yet'}
          </p>
          <p className="text-gray-600 mb-6">
            {search || selectedTag 
              ? 'Try adjusting your search or filters' 
              : 'Your journal is waiting for your first words.'}
          </p>
          {!search && !selectedTag && (
            <Button asChild>
              <Link href={ROUTES.JOURNAL_NEW}>Write your first entry</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={ROUTES.JOURNAL_ENTRY(entry.id)}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-gray-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {entry.mood && MOOD_EMOJIS[entry.mood] && (
                            <span className="text-base" aria-label={`Mood: ${entry.mood}`}>
                              {MOOD_EMOJIS[entry.mood]}
                            </span>
                          )}
                          <h3 className="font-semibold text-black group-hover:text-primary transition-colors truncate">
                            {entry.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {truncate(entry.content, 150)}
                        </p>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="text-xs capitalize bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags.length > 3 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs border-gray-300 text-gray-600"
                              >
                                +{entry.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span className="whitespace-nowrap">{formatDate(entry.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{getWordCount(entry.content)} words</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
