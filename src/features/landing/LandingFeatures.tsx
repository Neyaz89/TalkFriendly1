"use client";

/**
 * Landing page features section.
 */

import React from "react";
import { motion } from "framer-motion";
import { Activity, BookOpen, Headphones, Users, Sparkles, Heart } from "lucide-react";

const FEATURES = [
  {
    icon: Activity,
    title: "Daily Check-ins",
    description: "Track your mood, energy, stress, and sleep daily. Spot patterns and understand yourself better over time.",
    color: "bg-accent-cream text-primary-500",
    delay: 0,
  },
  {
    icon: Sparkles,
    title: "AI Companion",
    description: "A thoughtful, always-available AI that listens without judgment and guides you toward insight and healing.",
    color: "bg-primary-50 text-primary-600",
    delay: 0.1,
  },
  {
    icon: BookOpen,
    title: "Private Journal",
    description: "Write freely with AI-guided prompts, rich text editing, and reflections that help you process your inner world.",
    color: "bg-secondary-100 text-primary-500",
    delay: 0.2,
  },
  {
    icon: Headphones,
    title: "Trained Listeners",
    description: "Book 1-on-1 sessions with verified listeners who specialize in anxiety, grief, career, relationships, and more.",
    color: "bg-accent-sage/10 text-accent-sage",
    delay: 0.3,
  },
  {
    icon: Users,
    title: "Safe Communities",
    description: "Find your people in topic-based communities. Share, support, and grow alongside others on the same journey.",
    color: "bg-accent-gold/10 text-accent-gold",
    delay: 0.4,
  },
  {
    icon: Heart,
    title: "Daily Affirmations",
    description: "Personalized AI-generated affirmations, voice recordings, and reminders to anchor you in your worth.",
    color: "bg-accent-terracotta/10 text-accent-terracotta",
    delay: 0.5,
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6" aria-label="Features">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Everything you need
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Your complete mental wellness toolkit
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            TalkFriendly brings together daily check-ins, journaling, AI support, human listeners, and community — all in one beautiful space.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">{feature.title}</h3>
                <p className="text-muted leading-relaxed text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
