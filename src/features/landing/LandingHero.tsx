"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Users, Heart, Shield, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

const FEATURES = [
  { icon: Brain, label: "AI Support" },
  { icon: Users, label: "Community" },
  { icon: Heart, label: "Wellness Tracking" },
  { icon: Shield, label: "100% Private" },
];

export function LandingHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-white via-gray-50/30 to-white overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0D698006_1px,transparent_1px),linear-gradient(to_bottom,#0D698006_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black tracking-tight leading-tight">
              Your Complete
              <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                  Mental Wellness
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/10 origin-left rounded-full"
                />
              </span>
              <br />
              Companion
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Track your emotions, journal your thoughts, connect with certified professionals, 
              and join a supportive community — all in one secure, private space.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              size="lg"
              className="group h-14 px-8 bg-primary hover:bg-primary-600 text-white text-lg shadow-xl hover:shadow-2xl transition-all"
              asChild
            >
              <Link href={ROUTES.REGISTER}>
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              className="h-14 px-8 border-2 text-lg hover:bg-gray-50 transition-all"
              asChild
            >
              <Link href="#features">
                Learn More
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600 pt-6"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-medium">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-medium">100% Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-medium">Free forever plan</span>
            </div>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 pt-8"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white rounded-full border border-gray-200 hover:border-primary hover:shadow-md transition-all"
              >
                <feature.icon className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="pt-12"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`}
                      alt=""
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">Join 1,000+ users</p>
                <p className="text-xs text-gray-600">improving their mental wellness</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}
