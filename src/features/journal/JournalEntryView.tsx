"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, Trash2, Calendar, Tag, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface JournalEntryViewProps {
  entryId: string;
}

export function JournalEntryView({ entryId }: JournalEntryViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntry();
  }, [entryId, user]);

  async function loadEntry() {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setEntry(data);
    } catch (err) {
      console.error('Error loading journal entry:', err);
      setError(err instanceof Error ? err.message : "Failed to load entry");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;

      // Redirect to journal list
      router.push(ROUTES.JOURNAL);
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      alert(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getWordCount(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-20">
          <p className="text-lg text-red-600 mb-4">{error || "Entry not found"}</p>
          <Button asChild>
            <Link href={ROUTES.JOURNAL}>Back to Journal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={ROUTES.JOURNAL} 
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to Journal</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={isDeleting}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Entry Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Mood & Meta */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            {entry.mood && MOOD_EMOJIS[entry.mood] && (
              <div className="flex items-center gap-2">
                <span className="text-3xl">{MOOD_EMOJIS[entry.mood]}</span>
                <span className="text-sm text-gray-600 capitalize">{entry.mood}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(entry.created_at)}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-black mb-6">
            {entry.title}
          </h1>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs capitalize bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {getWordCount(entry.content)} words
            </p>
            {entry.updated_at !== entry.created_at && (
              <p className="text-xs text-gray-400">
                Last edited {formatDate(entry.updated_at)}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
