"use client";

/**
 * Landing page pricing section.
 */

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    description: "Everything you need to start your wellness journey.",
    price: { monthly: 0, annual: 0 },
    features: [
      "Daily mood check-ins",
      "Basic journal (5 entries/month)",
      "AI Companion (10 messages/day)",
      "Access to public communities",
      "Daily affirmation",
      "Mood charts & history",
    ],
    cta: "Start Free",
    href: ROUTES.REGISTER,
    highlighted: false,
  },
  {
    name: "Plus",
    description: "For deeper healing and consistent practice.",
    price: { monthly: 12, annual: 9 },
    features: [
      "Everything in Free",
      "Unlimited journal entries",
      "AI Companion (unlimited)",
      "Advanced mood analytics",
      "Listening circles (join unlimited)",
      "Priority community access",
      "Voice affirmations",
      "Weekly AI insights report",
    ],
    cta: "Start Plus",
    href: ROUTES.REGISTER,
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Premium",
    description: "For those who want personal human support.",
    price: { monthly: 39, annual: 29 },
    features: [
      "Everything in Plus",
      "2 listener sessions/month (30 min)",
      "Priority listener matching",
      "Conversation summaries",
      "Goal tracking & coaching",
      "Early access to new features",
      "Dedicated support",
    ],
    cta: "Start Premium",
    href: ROUTES.REGISTER,
    highlighted: false,
  },
];

export function LandingPricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6" aria-label="Pricing">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Start free, grow at your pace
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto mb-8">
            No surprise fees. Cancel anytime. Your mental health journey should never be gated by cost.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-secondary rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                !annual ? "bg-white shadow-sm text-text" : "text-muted"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                annual ? "bg-white shadow-sm text-text" : "text-muted"
              )}
            >
              Annual
              <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                Save 25%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative rounded-2xl p-6 border",
                plan.highlighted
                  ? "border-primary-300 shadow-large bg-primary-50"
                  : "border-border shadow-card bg-white"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-text mb-1">{plan.name}</h3>
                <p className="text-sm text-muted">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-text">
                    ${annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-muted text-sm ml-1">/month</span>
                  )}
                  {annual && plan.price.monthly > 0 && (
                    <p className="text-xs text-muted mt-1">Billed annually</p>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8" role="list">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        plan.highlighted ? "text-primary-500" : "text-green-500"
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-text">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
