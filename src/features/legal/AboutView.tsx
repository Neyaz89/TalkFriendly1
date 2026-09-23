"use client";

/**
 * About page - TalkFriendly company information
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Shield, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

export function AboutView() {
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
            <h1 className="text-4xl font-bold text-text mb-4">About TalkFriendly</h1>
            <p className="text-xl text-muted leading-relaxed">
              Your mental wellbeing companion, designed to support your emotional health journey.
            </p>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="prose prose-lg max-w-none"
        >
          <div className="bg-white rounded-2xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold text-text mb-4">What is TalkFriendly?</h2>
            <p className="text-muted leading-relaxed mb-4">
              TalkFriendly is a mental wellness platform designed to help you reflect, connect, and grow. 
              We provide daily check-ins, journaling tools, AI-powered insights, and access to trained listeners 
              who offer compassionate, non-judgmental support.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              Whether you're navigating everyday stress, looking for community, or seeking meaningful conversation, 
              TalkFriendly is here to support you on your journey.
            </p>
            <p className="text-muted leading-relaxed">
              <strong className="text-text">Important:</strong> TalkFriendly is not a medical or healthcare service. 
              We do not provide medical diagnosis, treatment, or emergency care. For clinical mental health conditions, 
              please consult a licensed mental health professional. TalkFriendly works beautifully alongside therapy 
              as a daily support tool.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Our Purpose</h3>
              <p className="text-sm text-muted leading-relaxed">
                We believe mental wellbeing should be accessible, approachable, and integrated into daily life. 
                TalkFriendly makes it easy to check in with yourself, process your thoughts, and find support when you need it.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Privacy First</h3>
              <p className="text-sm text-muted leading-relaxed">
                Your privacy matters. Your journal entries, mood data, and conversations are private and secure. 
                We never sell your data, and you can export or delete your information at any time.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Community Support</h3>
              <p className="text-sm text-muted leading-relaxed">
                Connect with others who understand what you're going through. Join supportive communities, 
                participate in listening circles, and share experiences in a safe, moderated environment.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-muted leading-relaxed">
                Our AI companion provides thoughtful, empathetic responses to help you reflect on your experiences 
                and gain new perspectives on your emotional wellbeing.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold text-text mb-4">How TalkFriendly Works</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-text mb-2">Daily Check-ins</h3>
                <p className="text-muted text-sm">
                  Track your mood, energy, stress, and sleep quality. Build awareness of your emotional patterns over time.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Private Journaling</h3>
                <p className="text-muted text-sm">
                  Write freely in a secure, private space. Use AI prompts to explore your thoughts and feelings more deeply.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Listener Sessions</h3>
                <p className="text-muted text-sm">
                  Connect with trained listeners for compassionate, non-judgmental conversation. Listeners are carefully 
                  selected individuals including certified coaches, peer support specialists, and some licensed therapists.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Community Connection</h3>
                <p className="text-muted text-sm">
                  Join topic-based communities, participate in weekly events, and find encouragement from others on similar journeys.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-text mb-4">Not a Substitute for Professional Care</h2>
            <p className="text-muted leading-relaxed mb-4">
              TalkFriendly is designed to support your general mental wellbeing. We are transparent that our platform 
              is not a replacement for professional mental health treatment.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              If you're experiencing a mental health crisis, are in immediate danger, or have clinical mental health 
              conditions requiring treatment, please contact a licensed mental health professional or emergency services.
            </p>
            <p className="text-muted leading-relaxed">
              TalkFriendly works best as a complement to professional care, providing daily support, community connection, 
              and tools for reflection between therapy sessions or as part of your ongoing wellness routine.
            </p>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-text mb-4">Ready to begin?</h2>
            <p className="text-muted mb-6">
              Start your mental wellbeing journey today. It's free to begin.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href={ROUTES.REGISTER}>Create Free Account</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={ROUTES.HOME}>Learn More</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
