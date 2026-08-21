"use client";

/**
 * Landing page testimonials section.
 */

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Sarah K.",
    role: "Teacher · 28",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SarahK",
    quote: "I've tried so many mental health apps and nothing stuck. TalkFriendly feels different — it feels human. The AI companion actually listens, and the listening circles changed everything for me.",
    rating: 5,
  },
  {
    name: "Marcus D.",
    role: "Software Engineer · 32",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusD",
    quote: "I was skeptical about the AI chat, but it's genuinely thoughtful. It picked up on patterns in my messages that I hadn't even noticed myself. It recommended a listener who turned out to be exactly what I needed.",
    rating: 5,
  },
  {
    name: "Priya N.",
    role: "Graduate Student · 24",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaN",
    quote: "The journal feature alone is worth it. The AI prompts go deep — they don't let me skim the surface. I've discovered so much about myself in three months of journaling here.",
    rating: 5,
  },
  {
    name: "James T.",
    role: "Freelancer · 35",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JamesT",
    quote: "Burnout is no joke. Finding the Work Stress community here felt like finding people who finally got it. The weekly circles are now part of my routine.",
    rating: 5,
  },
  {
    name: "Aisha M.",
    role: "New Mother · 31",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AishaM",
    quote: "Postpartum anxiety is invisible in our culture. TalkFriendly gave me a space to name it and work through it, with real people and supportive tools. I genuinely don't know where I'd be without it.",
    rating: 5,
  },
  {
    name: "Lucas R.",
    role: "University Student · 20",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=LucasR",
    quote: "The mood tracking taught me that my worst anxiety days happen after bad sleep. Obvious in hindsight, but seeing it in the charts made it real. Now I protect my sleep like it matters — because it does.",
    rating: 5,
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 bg-secondary/30" aria-label="Testimonials">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Real stories
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            People just like you
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Real stories from real members. No actors, no scripts — just people finding their way.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-border shadow-card"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <Quote className="h-6 w-6 text-primary-200 mb-3" aria-hidden="true" />

              <p className="text-sm text-text leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={`${t.name} avatar`}
                  className="h-10 w-10 rounded-full bg-primary-50"
                />
                <div>
                  <p className="text-sm font-semibold text-text">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
