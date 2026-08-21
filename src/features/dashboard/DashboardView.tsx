"use client";

/**
 * Real, fully functional dashboard connected to Supabase
 * Displays actual user data: mood logs, journal entries, streak, events, and more
 */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { getGreeting } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { 
  BookOpen, Users, Headphones, 
  Sparkles,
  MessageCircle, Heart, Activity, Star, TrendingUp,
  Calendar, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

interface MoodLog {
  id: string;
  mood: string;
  intensity: number;
  notes: string | null;
  created_at: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  attendee_count: number;
  communities?: {
    name: string;
  } | null;
}

export function DashboardView() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  
  // Real data from Supabase
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [recentJournal, setRecentJournal] = useState<JournalEntry | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [streak, setStreak] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [todayMoodLogged, setTodayMoodLogged] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time subscription for mood logs
    const channel = supabase
      .channel('dashboard_mood_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mood_logs',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time mood update:', payload);
          // Reload dashboard data when mood logs change
          loadDashboardData();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadDashboardData() {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Fetch recent mood logs (last 7 days)
      const { data: moods } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(7);

      setMoodLogs(moods || []);

      // Check if user logged mood today
      if (moods && moods.length > 0) {
        const today = new Date().toDateString();
        const lastMoodDate = new Date(moods[0].created_at).toDateString();
        setTodayMoodLogged(today === lastMoodDate);
      }

      // Calculate streak (consecutive days with mood logs)
      if (moods && moods.length > 0) {
        let streakCount = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const mood of moods) {
          const moodDate = new Date(mood.created_at);
          moodDate.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((currentDate.getTime() - moodDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === streakCount) {
            streakCount++;
            currentDate = moodDate;
          } else {
            break;
          }
        }
        setStreak(streakCount);
      }

      // Fetch most recent journal entry
      const { data: journal } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setRecentJournal(journal);

      // Get journal count
      const { count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setJournalCount(count || 0);

      // Fetch upcoming events
      const { data: events } = await supabase
        .from('events')
        .select('*, communities(name)')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3);

      setUpcomingEvents(events || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function logMood(moodValue: number) {
    if (!user || savingMood) return;

    setSavingMood(true);
    setSelectedMood(moodValue);

    try {
      const moodLabels = ['struggling', 'low', 'okay', 'good', 'great'];
      
      const { error } = await supabase
        .from('mood_logs')
        .insert({
          user_id: user.id,
          mood: moodLabels[moodValue],
          intensity: moodValue + 1,
          notes: null,
        });

      if (error) throw error;

      // Reload dashboard data to update streak and mood logs
      await loadDashboardData();
      setTodayMoodLogged(true);

    } catch (error) {
      console.error('Error logging mood:', error);
    } finally {
      setSavingMood(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse mb-2" />
          <div className="h-8 w-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Friend";

  const moods = [
    { emoji: "😔", label: "Struggling", value: 0 },
    { emoji: "😕", label: "Low", value: 1 },
    { emoji: "😐", label: "Okay", value: 2 },
    { emoji: "🙂", label: "Good", value: 3 },
    { emoji: "😊", label: "Great", value: 4 },
  ];

  // Calculate average mood for the week
  const avgMood = moodLogs.length > 0
    ? (moodLogs.reduce((sum, log) => sum + log.intensity, 0) / moodLogs.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Welcome Header */}
          <motion.div variants={item} className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Your mental wellness dashboard</span>
              </div>
              <h1 className="text-3xl font-bold text-black">
                {getGreeting()}, {firstName}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.JOURNAL_NEW}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Entry
                </Link>
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary-600" asChild>
                <Link href={ROUTES.LISTENERS}>
                  <Headphones className="w-4 h-4 mr-2" />
                  Find Support
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Daily Check-in Card */}
              <motion.div variants={item}>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-black">How are you feeling today?</h2>
                        <p className="text-sm text-gray-600 mt-0.5">Daily check-in</p>
                      </div>
                      {todayMoodLogged && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span>Logged today</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-5 gap-3 mb-6">
                      {moods.map((mood) => (
                        <button
                          key={mood.value}
                          onClick={() => logMood(mood.value)}
                          disabled={savingMood}
                          className={`
                            group relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 
                            transition-all duration-200 disabled:opacity-50
                            ${selectedMood === mood.value || (todayMoodLogged && moodLogs[0]?.intensity === mood.value + 1)
                              ? 'bg-primary/10 border-2 border-primary ring-2 ring-primary/20 ring-offset-2 shadow-lg'
                              : 'bg-gray-50 border-2 border-gray-200 hover:border-primary/30 hover:shadow-md'
                            }
                          `}
                        >
                          <span className="text-3xl">{mood.emoji}</span>
                          <span className="text-[10px] font-medium text-black text-center leading-tight">{mood.label}</span>
                          {savingMood && selectedMood === mood.value && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Recent Mood Note */}
                    {moodLogs.length > 0 && moodLogs[0].notes && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-700 italic">&ldquo;{moodLogs[0].notes}&rdquo;</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(moodLogs[0].created_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div variants={item} className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-black">Weekly Mood</h3>
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-black">{avgMood}</span>
                      <span className="text-gray-600 mb-1">/ 5</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary-600 rounded-full transition-all"
                        style={{ width: `${(parseFloat(avgMood.toString()) / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">{moodLogs.length} check-ins this week</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-black">Journal Entries</h3>
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-black">{journalCount}</span>
                      <span className="text-gray-600 mb-1">total</span>
                    </div>
                    {recentJournal && (
                      <div className="mt-3">
                        <Link 
                          href={`${ROUTES.JOURNAL}/${recentJournal.id}`}
                          className="text-xs text-primary hover:underline block truncate"
                        >
                          Last: {recentJournal.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(recentJournal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Recent Journal Preview */}
              {recentJournal && (
                <motion.div variants={item}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-black">Recent Journal Entry</h3>
                      <Link href={ROUTES.JOURNAL} className="text-sm text-primary hover:text-primary-600">
                        View all →
                      </Link>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-black">{recentJournal.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">{recentJournal.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {recentJournal.mood && (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                            {recentJournal.mood}
                          </span>
                        )}
                        <span>{new Date(recentJournal.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Streak Card */}
              <motion.div variants={item}>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="text-4xl">🔥</span>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-600 mb-1">Your streak</h3>
                      <p className="text-4xl font-bold text-black mb-1">{streak}</p>
                      <p className="text-sm text-gray-600">days checking in</p>
                    </div>
                    {moodLogs.length > 0 && (
                      <div className="flex gap-1 justify-center flex-wrap">
                        {moodLogs.slice(0, 7).map((log, i) => {
                          const logDate = new Date(log.created_at);
                          const dayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][logDate.getDay()];
                          
                          return (
                            <div
                              key={log.id}
                              className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-medium"
                              title={`${log.mood} - ${logDate.toLocaleDateString()}`}
                            >
                              {dayLetter}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Upcoming Events */}
              <motion.div variants={item}>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-black">Upcoming Events</h3>
                    <Link href={ROUTES.EVENTS} className="text-sm text-primary hover:text-primary-600">
                      View all
                    </Link>
                  </div>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all border border-gray-100"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-black truncate">{event.title}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(event.event_date).toLocaleDateString()} at{' '}
                              {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {event.communities && (
                              <p className="text-xs text-gray-500 mt-1">{event.communities.name}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-600 mb-3">No upcoming events</p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={ROUTES.EVENTS}>Browse Events</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={item}>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-black mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link
                      href={ROUTES.JOURNAL_NEW}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-all border border-gray-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-black">Write in Journal</span>
                    </Link>
                    <Link
                      href={ROUTES.COMMUNITIES}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-all border border-gray-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-black">Join Community</span>
                    </Link>
                    <Link
                      href={ROUTES.LISTENERS}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-all border border-gray-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Headphones className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-black">Find a Listener</span>
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Daily Affirmation */}
              <motion.div variants={item}>
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20">
                  <h3 className="text-sm font-semibold text-black mb-3">Today&apos;s affirmation</h3>
                  <p className="text-black font-medium italic leading-relaxed mb-4">
                    &ldquo;I am allowed to rest. I am enough exactly as I am.&rdquo;
                  </p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={ROUTES.AFFIRMATIONS}>View more</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
