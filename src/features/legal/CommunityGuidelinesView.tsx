"use client";

/**
 * Community Guidelines - Rules and expectations for TalkFriendly community
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Shield, Users, AlertCircle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES, SUPPORT_EMAIL } from "@/constants";

const GUIDELINES = [
  {
    number: 1,
    title: "Be kind and respectful",
    description: "Treat others with compassion. Disagreements are okay; personal attacks, harassment, bullying and hate aren't.",
    icon: <Heart className="h-5 w-5" />
  },
  {
    number: 2,
    title: "Share, don't judge",
    description: "Everyone's experience with mental health is different. Avoid dismissing, shaming or making assumptions about someone else's feelings or situation.",
    icon: <Users className="h-5 w-5" />
  },
  {
    number: 3,
    title: "Keep it supportive",
    description: "Offer encouragement and share what has helped you, but remember that your experience isn't necessarily right for someone else.",
    icon: <Heart className="h-5 w-5" />
  },
  {
    number: 4,
    title: "Protect privacy",
    description: "Don't share another person's private information, screenshots, contact details or personal stories outside the app without their permission.",
    icon: <Shield className="h-5 w-5" />
  },
  {
    number: 5,
    title: "Help keep our community safe",
    description: "We encourage honest conversations about difficult experiences, but please avoid content that could be harmful, triggering or encourage unsafe behaviour. When sharing personal experiences, keep others in mind and focus on support, understanding and recovery.",
    icon: <Shield className="h-5 w-5" />
  },
  {
    number: 6,
    title: "No professional impersonation",
    description: "Don't present yourself as a mental health professional unless you're appropriately qualified and clearly identified as such.",
    icon: <AlertCircle className="h-5 w-5" />
  },
  {
    number: 7,
    title: "No unsolicited promotion",
    description: "Keep the community focused on support. Spam, scams, advertising and unsolicited links aren't allowed.",
    icon: <Flag className="h-5 w-5" />
  },
  {
    number: 8,
    title: "When someone is in crisis",
    description: "If you believe someone may be in immediate danger, encourage them to contact local emergency services or a crisis support service. The community isn't a substitute for professional or emergency care.",
    icon: <AlertCircle className="h-5 w-5" />
  },
  {
    number: 9,
    title: "Help us keep TalkFriendly safe",
    description: "If something makes you uncomfortable or you think it breaks these guidelines, report it to us. We may remove content or restrict accounts when necessary to protect the community.",
    icon: <Flag className="h-5 w-5" />
  },
];

export function CommunityGuidelinesView() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={ROUTES.HOME} 
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-text mb-4">Community Guidelines</h1>
            <p className="text-xl text-muted leading-relaxed">
              TalkFriendly is a place to share experiences, find encouragement and connect with others. 
              Help us keep it a safe and welcoming space for everyone.
            </p>
          </motion.div>
        </div>

        {/* Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4 mb-12"
        >
          {GUIDELINES.map((guideline, index) => (
            <motion.div
              key={guideline.number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-2xl border border-border p-6"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary">
                    {guideline.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-text mb-2">
                    {guideline.number}. {guideline.title}
                  </h2>
                  <p className="text-muted leading-relaxed">
                    {guideline.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Closing message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-primary-50 border border-primary-100 rounded-2xl p-8 text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-text mb-3">
            Above all: be the kind of person you'd want to meet on a difficult day.
          </h2>
          <p className="text-muted">
            Thank you for helping make TalkFriendly a supportive community.
          </p>
        </motion.div>

        {/* Reporting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white rounded-2xl border border-border p-8"
        >
          <h2 className="text-xl font-bold text-text mb-4">Report a Concern</h2>
          <p className="text-muted mb-6 leading-relaxed">
            If you see content or behaviour that violates these guidelines or makes you feel unsafe, 
            please report it. You can report individual messages, posts, or user profiles from within 
            the app, or contact us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Community Report`}>
                Report via Email
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.HELP}>Visit Help Centre</Link>
            </Button>
          </div>
        </motion.div>

        {/* Last updated */}
        <p className="text-sm text-muted text-center mt-8">
          Last updated: September 19, 2026
        </p>
      </div>
    </div>
  );
}
