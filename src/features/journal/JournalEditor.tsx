"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Tag, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TAG_SUGGESTIONS = ["stress", "work", "gratitude", "healing", "anxiety", "growth", "social", "rest", "relationships", "career"];

const MOOD_OPTIONS = [
  { value: "struggling", emoji: "😔", label: "Struggling" },
  { value: "low", emoji: "😕", label: "Low" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "great", emoji: "😊", label: "Great" },
];

export function JournalEditor() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) {
      setError("You must be logged in to save entries");
      return;
    }

    if (!content.trim()) {
      setError("Content cannot be empty");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data, error: saveError } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: title.trim() || "Untitled",
          content: content.trim(),
          mood: mood,
          tags: tags,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Redirect to journal list
      router.push(ROUTES.JOURNAL);
    } catch (err) {
      console.error('Error saving journal:', err);
      setError(err instanceof Error ? err.message : "Failed to save journal entry");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => 
      prev.includes(tag) 
        ? prev.filter((t) => t !== tag) 
        : [...prev, tag]
    );
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link 
            href={ROUTES.JOURNAL} 
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-black" 
            aria-label="Back to journal"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-black">New Journal Entry</h1>
            <p className="text-xs text-gray-600">Express yourself freely</p>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          size="sm" 
          isLoading={isSaving}
          disabled={!content.trim() || isSaving}
          className="gap-1.5"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Entry
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Mood Selector */}
        <div>
          <label className="block text-sm font-medium text-black mb-3">
            How are you feeling? (optional)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setMood(option.value === mood ? null : option.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                  mood === option.value
                    ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                    : "bg-white border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                )}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-xs font-medium text-gray-700">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Title (optional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your entry a title..."
            className="w-full text-xl font-semibold text-black placeholder:text-gray-300 bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            aria-label="Entry title"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Your thoughts <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely... There are no rules here, just your thoughts and feelings. This is your safe space."
            rows={16}
            className="w-full text-base text-black placeholder:text-gray-400 leading-relaxed bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
            aria-label="Journal content"
          />
          <p className="text-xs text-gray-500 mt-2">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </p>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-gray-600" aria-hidden="true" />
            <label className="text-sm font-medium text-black">
              Tags (optional)
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {TAG_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors capitalize",
                  tags.includes(tag)
                    ? "bg-primary text-white border-primary"
                    : "border-gray-300 text-gray-600 hover:border-primary/50 hover:bg-gray-50"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          {tags.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {tags.length} {tags.length === 1 ? 'tag' : 'tags'} selected
            </p>
          )}
        </div>

        {/* Save Button (bottom) */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button 
            onClick={handleSave} 
            className="flex-1"
            isLoading={isSaving}
            disabled={!content.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving Entry...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(ROUTES.JOURNAL)}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
