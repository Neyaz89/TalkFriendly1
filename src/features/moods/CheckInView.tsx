"use client";

/**
 * Daily mood check-in view.
 * Large mood selector, sliders for various metrics, free notes, and AI insight.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { moodService } from "@/services/mood.service";
import type { MoodLevel } from "@/types";
import { MOOD_BG_COLORS, MOOD_LABELS } from "@/types/mood.types";
import { ROUTES, MOOD_EMOJIS } from "@/constants";
import Link from "next/link";

const MOODS: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
  { level: 1, emoji: "😔", label: "Really Low", color: "#EF4444" },
  { level: 2, emoji: "😕", label: "Low", color: "#F97316" },
  { level: 3, emoji: "😐", label: "Okay", color: "#F59E0B" },
  { level: 4, emoji: "🙂", label: "Good", color: "#22C55E" },
  { level: 5, emoji: "😊", label: "Great", color: "#3B82F6" },
];

const SLIDER_CONFIG = [
  { key: "energy" as const, label: "Energy Level", description: "How energized do you feel?", color: "bg-green-400", low: "Depleted", high: "Energized" },
  { key: "stress" as const, label: "Stress Level", description: "How stressed are you feeling?", color: "bg-red-400", low: "Relaxed", high: "Very stressed" },
  { key: "sleep" as const, label: "Sleep Quality", description: "How well did you sleep?", color: "bg-blue-400", low: "Poor", high: "Excellent" },
  { key: "anxiety" as const, label: "Anxiety Level", description: "How anxious do you feel?", color: "bg-amber-400", low: "Calm", high: "Very anxious" },
  { key: "socialEnergy" as const, label: "Social Energy", description: "How much do you want to connect with others?", color: "bg-purple-400", low: "Need alone time", high: "Very social" },
];

interface CheckInState {
  energy: number;
  stress: number;
  sleep: number;
  anxiety: number;
  socialEnergy: number;
  notes: string;
}

export function CheckInView() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [sliders, setSliders] = useState<CheckInState>({
    energy: 5, stress: 5, sleep: 7, anxiety: 4, socialEnergy: 5, notes: "",
  });
  const [step, setStep] = useState<"mood" | "metrics" | "success">("mood");
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMoodSelect = (level: MoodLevel) => {
    setSelectedMood(level);
    setStep("metrics");
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setIsSubmitting(true);
    try {
      const entry = await moodService.checkIn({
        mood: selectedMood,
        energy: sliders.energy,
        stress: sliders.stress,
        sleep: sliders.sleep,
        anxiety: sliders.anxiety,
        socialEnergy: sliders.socialEnergy,
        notes: sliders.notes || undefined,
      });
      setAiInsight(entry.aiInsight || null);
      setStep("success");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success") {
    const moodColor = selectedMood ? MOOD_BG_COLORS[selectedMood] : "#E97C5A";
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.1 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: moodColor + "20", border: `2px solid ${moodColor}30` }}
          >
            <span className="text-4xl">{selectedMood ? MOOD_EMOJIS[selectedMood] : "😊"}</span>
          </motion.div>

          <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-text mb-2">Check-in complete!</h2>
          <p className="text-muted mb-6">Thanks for checking in. You&apos;ve maintained your {14}-day streak. 🔥</p>

          {aiInsight && (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6 text-left">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary mb-1">AI Insight</p>
                  <p className="text-sm text-primary-800">{aiInsight}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push(ROUTES.JOURNAL_NEW)} className="flex-1">Write about it</Button>
            <Button onClick={() => router.push(ROUTES.DASHBOARD)} className="flex-1">Go to dashboard</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href={ROUTES.DASHBOARD} className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted hover:text-text" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text">Daily Check-in</h1>
          <p className="text-sm text-muted">How are you doing today?</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "mood" && (
          <motion.div key="mood" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-lg font-semibold text-text mb-2">How are you feeling right now?</p>
                <p className="text-center text-sm text-muted mb-8">Be honest — this is just for you.</p>

                <div className="grid grid-cols-5 gap-2">
                  {MOODS.map((mood) => (
                    <motion.button
                      key={mood.level}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMoodSelect(mood.level)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-150"
                      style={{
                        borderColor: selectedMood === mood.level ? mood.color : "transparent",
                        backgroundColor: selectedMood === mood.level ? mood.color + "15" : "#F9F9F9",
                      }}
                      aria-label={mood.label}
                      aria-pressed={selectedMood === mood.level}
                    >
                      <span className="text-3xl">{mood.emoji}</span>
                      <span className="text-xs font-medium text-muted leading-tight text-center">{mood.label}</span>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "metrics" && selectedMood && (
          <motion.div key="metrics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {/* Selected mood indicator */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border">
              <span className="text-2xl">{MOOD_EMOJIS[selectedMood]}</span>
              <div>
                <p className="text-sm font-semibold text-text">Feeling {MOOD_LABELS[selectedMood]}</p>
                <button onClick={() => setStep("mood")} className="text-xs text-primary hover:underline">Change</button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                <p className="text-sm font-semibold text-text">Tell us a bit more</p>

                {SLIDER_CONFIG.map((slider) => (
                  <div key={slider.key}>
                    <Slider
                      label={slider.label}
                      min={1}
                      max={10}
                      step={1}
                      value={[sliders[slider.key]]}
                      onValueChange={([v]) => setSliders((prev) => ({ ...prev, [slider.key]: v }))}
                      valueLabel={(v) => `${v}/10`}
                      trackColor={slider.color}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted">{slider.low}</span>
                      <span className="text-xs text-muted">{slider.high}</span>
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-text mb-2" htmlFor="notes">
                    Anything you want to note? <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    value={sliders.notes}
                    onChange={(e) => setSliders((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="What's on your mind today..."
                    rows={3}
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full" size="lg" isLoading={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Submit Check-in"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
