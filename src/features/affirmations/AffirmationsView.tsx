"use client";

/**
 * Affirmations view — AI-generated and user-created affirmations with voice recording support.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Heart, Mic, Volume2, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { affirmationService } from "@/services/affirmation.service";
import type { Affirmation, AffirmationCategory } from "@/types";
import { CardSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CATEGORIES: { key: AffirmationCategory; label: string; emoji: string }[] = [
  { key: "healing", label: "Healing", emoji: "💛" },
  { key: "strength", label: "Strength", emoji: "💪" },
  { key: "confidence", label: "Confidence", emoji: "✨" },
  { key: "gratitude", label: "Gratitude", emoji: "🙏" },
  { key: "growth", label: "Growth", emoji: "🌱" },
  { key: "peace", label: "Peace", emoji: "🕊️" },
  { key: "love", label: "Love", emoji: "💙" },
  { key: "success", label: "Success", emoji: "⭐" },
];

export function AffirmationsView() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newText, setNewText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AffirmationCategory>("general");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "favorites" | "ai" | "mine">("all");
  const [dailyAffirmation, setDailyAffirmation] = useState<Affirmation | null>(null);

  useEffect(() => {
    Promise.all([
      affirmationService.getAffirmations(),
      affirmationService.getDailyAffirmation(),
    ]).then(([list, daily]) => {
      setAffirmations(list);
      setDailyAffirmation(daily);
      setIsLoading(false);
    });
  }, []);

  const handleFavorite = async (id: string) => {
    const updated = await affirmationService.toggleFavorite(id);
    setAffirmations((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const handleDelete = async (id: string) => {
    await affirmationService.deleteAffirmation(id);
    setAffirmations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const generated = await affirmationService.generateAffirmation(selectedCategory);
    setAffirmations((prev) => [generated, ...prev]);
    setIsGenerating(false);
  };

  const handleCreate = async () => {
    if (!newText.trim()) return;
    setIsCreating(true);
    const created = await affirmationService.createAffirmation({ text: newText, category: selectedCategory });
    setAffirmations((prev) => [created, ...prev]);
    setNewText("");
    setShowCreate(false);
    setIsCreating(false);
  };

  const filteredAffirmations = affirmations.filter((a) => {
    if (filter === "favorites") return a.isFavorited;
    if (filter === "ai") return a.isAiGenerated;
    if (filter === "mine") return a.isUserCreated;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">Affirmations</h1>
          <p className="text-muted mt-1">Words that anchor you in your worth.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />New
        </Button>
      </div>

      {/* Daily affirmation hero */}
      {dailyAffirmation && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-primary-50 to-secondary border-primary-100 overflow-hidden">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Today&apos;s Affirmation</p>
              </div>
              <p className="text-xl font-semibold text-text leading-relaxed italic mb-4">
                &ldquo;{dailyAffirmation.text}&rdquo;
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="soft"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleFavorite(dailyAffirmation.id)}
                >
                  <Heart className={cn("h-4 w-4", dailyAffirmation.isFavorited && "fill-current")} />
                  {dailyAffirmation.isFavorited ? "Saved" : "Save"}
                </Button>
                <Button variant="soft" size="sm" className="gap-2">
                  <Volume2 className="h-4 w-4" />Play
                </Button>
                <Button
                  variant="soft"
                  size="sm"
                  className="gap-2"
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                >
                  <RefreshCw className="h-4 w-4" />New one
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Create new affirmation */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card className="border-primary/30">
              <CardContent className="p-5 space-y-4">
                <p className="font-semibold text-text">Write your own affirmation</p>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="I am worthy of love, rest, and all good things&hellip;"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  aria-label="Affirmation text"
                />

                {/* Category picker */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={cn(
                        "flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors",
                        selectedCategory === cat.key
                          ? "bg-primary-500 text-white border-primary-500"
                          : "border-border text-muted hover:border-primary/50"
                      )}
                    >
                      <span>{cat.emoji}</span>{cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleCreate} isLoading={isCreating} disabled={!newText.trim()} className="flex-1">
                    Save Affirmation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Generate button */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="soft"
          onClick={handleGenerate}
          isLoading={isGenerating}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating&hellip;" : "Generate AI Affirmation"}
        </Button>

        {/* Category for generation */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as AffirmationCategory)}
          className="text-sm border border-border rounded-xl px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Affirmation category"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.key} value={cat.key}>{cat.emoji} {cat.label}</option>
          ))}
        </select>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "favorites", "ai", "mine"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors capitalize",
              filter === f ? "bg-primary-500 text-white border-primary-500" : "border-border text-muted hover:border-primary/50"
            )}
          >
            {f === "ai" ? "AI Generated" : f === "mine" ? "My Own" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Affirmations list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filteredAffirmations.map((aff) => (
              <motion.div
                key={aff.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                layout
              >
                <AffirmationCard
                  affirmation={aff}
                  onFavorite={handleFavorite}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredAffirmations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted">No affirmations in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AffirmationCard({
  affirmation,
  onFavorite,
  onDelete,
}: {
  affirmation: Affirmation;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="group hover:shadow-card-hover transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-sm text-text leading-relaxed italic mb-2">
              &ldquo;{affirmation.text}&rdquo;
            </p>
            <div className="flex items-center gap-2">
              {affirmation.isAiGenerated && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Sparkles className="h-2.5 w-2.5" />AI
                </Badge>
              )}
              {affirmation.isUserCreated && (
                <Badge variant="secondary" className="text-xs">You</Badge>
              )}
              {affirmation.hasVoiceRecording && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Mic className="h-2.5 w-2.5" />Voice
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs capitalize">{affirmation.category}</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onFavorite(affirmation.id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={affirmation.isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={cn("h-4 w-4", affirmation.isFavorited ? "fill-primary text-primary" : "text-muted")} />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-muted"
              aria-label="Play affirmation"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            {affirmation.isUserCreated && (
              <button
                onClick={() => onDelete(affirmation.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted hover:text-red-500"
                aria-label="Delete affirmation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
