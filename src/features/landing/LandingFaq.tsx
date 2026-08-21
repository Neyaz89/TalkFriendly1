"use client";

/**
 * Landing page FAQ section.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "Is TalkFriendly a replacement for therapy?",
    answer: "No, and we're transparent about that. TalkFriendly is a mental wellness platform designed to support your emotional health through daily practices, community, and peer listening. For clinical mental health conditions, please consult a licensed mental health professional. TalkFriendly works beautifully alongside therapy as a daily support tool.",
  },
  {
    question: "Who are the Listeners?",
    answer: "TalkFriendly Listeners are carefully selected and trained individuals — including certified coaches, peer support specialists, and some licensed therapists — who provide a compassionate, non-judgmental space. They are not replacing professional treatment but offer real human connection and support for everyday challenges.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. Your journal entries, mood data, and conversations are end-to-end encrypted. We never sell your data. You can export or delete your data at any time from your settings. Privacy is foundational to everything we build.",
  },
  {
    question: "How does the AI Companion work?",
    answer: "The AI Companion is trained to be empathetic, non-judgmental, and to ask thoughtful questions. It uses your mood history and journal context to provide personalized responses. All AI interactions are private to you.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes. There are no contracts, no cancellation fees, and no questions asked. You can cancel from your account settings at any time, and you'll retain access until the end of your billing period.",
  },
  {
    question: "What if I'm in a crisis?",
    answer: "If you're experiencing a mental health crisis, please contact emergency services (911) or a crisis helpline such as 988 (Suicide & Crisis Lifeline). TalkFriendly includes crisis resources in the app and our team monitors for urgent situations.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 bg-secondary/20" aria-label="FAQ">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Frequently asked questions
          </h2>
          <p className="text-muted">
            Can&apos;t find what you&apos;re looking for? <a href="mailto:hello@talkfriendly.app" className="text-primary hover:underline">Email us</a>
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-border overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === i}
              >
                <span className="font-medium text-text text-sm pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted shrink-0 transition-transform duration-200",
                    openIndex === i && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
