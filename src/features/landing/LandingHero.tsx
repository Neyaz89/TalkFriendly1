"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Brain, Heart, TrendingUp, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { createClient } from "@/lib/supabase/client";

const FEATURES = [
  { icon: Brain, label: "AI Insights" },
  { icon: Users, label: "Pro Listeners" },
  { icon: Heart, label: "Daily Tracking" },
  { icon: TrendingUp, label: "Analytics" },
];

export function LandingHero() {
  const supabase = createClient();
  const [userCount, setUserCount] = useState(1250);
  const [onlineCount, setOnlineCount] = useState(34);
  const [latestMood, setLatestMood] = useState<string>("good");
  const [recentCheckInTime, setRecentCheckInTime] = useState<string>("just now");
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [activeStreaks, setActiveStreaks] = useState(0);

  useEffect(() => {
    loadStats();
    loadLatestMood();
    loadActivityStats();
    
    // Set up real-time subscription for any user's mood logs
    const channel = supabase
      .channel('landing_mood_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mood_logs',
        },
        (payload) => {
          console.log('New mood logged:', payload);
          loadLatestMood();
          loadActivityStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadStats() {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (count) {
        setUserCount(count);
      }

      const estimated = Math.floor((count || 1250) * 0.12);
      setOnlineCount(estimated);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadLatestMood() {
    try {
      const { data } = await supabase
        .from('mood_logs')
        .select('mood, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setLatestMood(data.mood);
        
        // Calculate time ago
        const now = new Date();
        const moodTime = new Date(data.created_at);
        const diffMs = now.getTime() - moodTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) {
          setRecentCheckInTime('just now');
        } else if (diffMins < 60) {
          setRecentCheckInTime(`${diffMins}m ago`);
        } else if (diffMins < 1440) {
          const hours = Math.floor(diffMins / 60);
          setRecentCheckInTime(`${hours}h ago`);
        } else {
          const days = Math.floor(diffMins / 1440);
          setRecentCheckInTime(`${days}d ago`);
        }
      }
    } catch (error) {
      console.error('Error loading latest mood:', error);
    }
  }

  async function loadActivityStats() {
    try {
      // Get total check-ins in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: checkInCount } = await supabase
        .from('mood_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      setTotalCheckIns(checkInCount || 0);

      // Get count of users with check-ins today (active streaks)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: streakCount } = await supabase
        .from('mood_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setActiveStreaks(streakCount || 0);
    } catch (error) {
      console.error('Error loading activity stats:', error);
    }
  }

  function formatUserCount(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center bg-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0D698008_1px,transparent_1px),linear-gradient(to_bottom,#0D698008_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#0D6980]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-[#0D6980]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link 
                href="#features" 
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 hover:border-primary transition-all text-sm shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-black">Join a growing community of happy users</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black tracking-tight leading-[1.1]">
                Your complete
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">
                    mental wellness
                  </span>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/10 origin-left rounded-full"
                  />
                </span>
                <br />
                companion
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed">
                Track your emotions, journal your thoughts, connect with certified professionals, 
                and join a supportive community.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                size="lg"
                className="group h-12 px-6 bg-primary hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <Link href={ROUTES.REGISTER}>
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                className="h-12 px-6 border-2 border-gray-300 hover:border-primary hover:bg-gray-50 text-black transition-all"
                asChild
              >
                <Link href="#features">
                  Watch Demo
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-6 text-sm text-gray-600 pt-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Free forever</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-3 pt-4"
            >
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white backdrop-blur-sm rounded-full border border-gray-200 hover:border-primary transition-all shadow-sm"
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-black">{feature.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl blur-2xl opacity-60" />
            
            <div className="relative bg-white backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium">Daily Check-in</span>
                  </div>
                  <span className="text-xs text-gray-600">2 min</span>
                </div>
                <h3 className="text-xl font-bold text-black">How are you feeling?</h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { emoji: "😔", label: "Hard day", value: "struggling" },
                    { emoji: "😕", label: "Low", value: "low" },
                    { emoji: "😐", label: "Okay", value: "okay" },
                    { emoji: "🙂", label: "Good", value: "good" },
                    { emoji: "😊", label: "Great", value: "great" },
                  ].map((mood, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className={`
                        aspect-square rounded-xl flex flex-col items-center justify-center gap-1 
                        border-2 transition-all
                        ${mood.value === latestMood 
                          ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary ring-2 ring-primary/20 ring-offset-2 shadow-lg' 
                          : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                        }
                      `}
                    >
                      <span className="text-2xl">{mood.emoji}</span>
                      <span className="text-[9px] font-medium text-black">{mood.label}</span>
                    </motion.div>
                  ))}
                </div>

                {latestMood && (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-full border border-gray-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>Last check-in: {recentCheckInTime}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-lg">🔥</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Active Streaks</p>
                        <p className="text-sm font-bold text-black">{activeStreaks} users today</p>
                      </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-lg">📈</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Check-ins This Week</p>
                        <p className="text-sm font-bold text-primary">{totalCheckIns.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      Live
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary-600 text-white shadow-md hover:shadow-lg transition-all"
                  asChild
                >
                  <Link href={ROUTES.REGISTER}>
                    Start Your Journey
                  </Link>
                </Button>

                <p className="text-center text-xs text-gray-500">
                  Takes less than 2 minutes • Track your progress
                </p>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`}
                      alt="User avatar"
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-black">{onlineCount} online</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
    </section>
  );
}
