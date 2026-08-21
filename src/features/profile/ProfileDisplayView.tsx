"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Briefcase, 
  User as UserIcon,
  Calendar,
  BookOpen,
  Activity,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/constants";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  profession: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface ProfileDisplayViewProps {
  user: User;
  profile: Profile | null;
}

export function ProfileDisplayView({ user, profile }: ProfileDisplayViewProps) {
  const supabase = createClient();
  const [stats, setStats] = useState({
    journalCount: 0,
    moodLogsCount: 0,
    streak: 0,
  });

  useEffect(() => {
    loadStats();
  }, [user]);

  async function loadStats() {
    if (!user) return;

    try {
      // Get journal count
      const { count: journalCount } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get mood logs count
      const { count: moodLogsCount } = await supabase
        .from('mood_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Calculate streak
      const { data: moods } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      let streakCount = 0;
      if (moods && moods.length > 0) {
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
      }

      setStats({
        journalCount: journalCount || 0,
        moodLogsCount: moodLogsCount || 0,
        streak: streakCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.DASHBOARD}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={ROUTES.PROFILE_EDIT}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>

          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            {/* Cover/Banner */}
            <div className="h-32 bg-gradient-to-r from-primary to-primary-600" />
            
            {/* Profile Info */}
            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                {/* Avatar & Name */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-16 md:-mt-12">
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg relative z-10">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={`${displayName}'s avatar`}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-white text-4xl font-bold">
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name & Title */}
                  <div className="text-center md:text-left mb-4 md:mb-0">
                    <h1 className="text-3xl font-bold text-black mb-1">{displayName}</h1>
                    {profile?.profession && (
                      <p className="text-lg text-gray-600 flex items-center justify-center md:justify-start gap-2">
                        <Briefcase className="w-4 h-4" />
                        {profile.profession}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">@{profile?.username}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{stats.journalCount}</div>
                    <div className="text-xs text-gray-600">Journals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{stats.moodLogsCount}</div>
                    <div className="text-xs text-gray-600">Check-ins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{stats.streak}</div>
                    <div className="text-xs text-gray-600">Day Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Info */}
            <div className="md:col-span-1 space-y-6">
              {/* About Card */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-black mb-4">About</h2>
                
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm text-black truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Username</p>
                      <p className="text-sm text-black">@{profile?.username}</p>
                    </div>
                  </div>

                  {/* Profession */}
                  {profile?.profession && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Profession</p>
                        <p className="text-sm text-black">{profile.profession}</p>
                      </div>
                    </div>
                  )}

                  {/* Member Since */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Member Since</p>
                      <p className="text-sm text-black">{memberSince}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Badges (Future) */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-black mb-4">Achievements</h2>
                <div className="grid grid-cols-3 gap-3">
                  {stats.streak >= 7 && (
                    <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                      <Award className="w-6 h-6 text-yellow-600 mb-1" />
                      <span className="text-xs text-yellow-800 font-medium text-center">7 Day Streak</span>
                    </div>
                  )}
                  {stats.journalCount >= 10 && (
                    <div className="flex flex-col items-center p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <BookOpen className="w-6 h-6 text-blue-600 mb-1" />
                      <span className="text-xs text-blue-800 font-medium text-center">10 Journals</span>
                    </div>
                  )}
                  {stats.moodLogsCount >= 30 && (
                    <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl border border-green-200">
                      <Activity className="w-6 h-6 text-green-600 mb-1" />
                      <span className="text-xs text-green-800 font-medium text-center">30 Check-ins</span>
                    </div>
                  )}
                  {stats.streak < 7 && stats.journalCount < 10 && stats.moodLogsCount < 30 && (
                    <div className="col-span-3 text-center py-6">
                      <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Keep going to earn badges!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Bio & Activity */}
            <div className="md:col-span-2 space-y-6">
              {/* Bio Card */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-black mb-4">Bio</h2>
                {profile?.bio ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No bio added yet</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={ROUTES.PROFILE_EDIT}>Add Bio</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats Overview */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-black mb-4">Wellness Journey</h2>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Journal Entries */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-600">{stats.journalCount}</span>
                    </div>
                    <p className="text-sm text-blue-800 font-medium">Journal Entries</p>
                    <p className="text-xs text-blue-600 mt-1">Total reflections recorded</p>
                  </div>

                  {/* Mood Check-ins */}
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">{stats.moodLogsCount}</span>
                    </div>
                    <p className="text-sm text-green-800 font-medium">Mood Check-ins</p>
                    <p className="text-xs text-green-600 mt-1">Times you logged your mood</p>
                  </div>

                  {/* Current Streak */}
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🔥</span>
                      <span className="text-2xl font-bold text-orange-600">{stats.streak}</span>
                    </div>
                    <p className="text-sm text-orange-800 font-medium">Day Streak</p>
                    <p className="text-xs text-orange-600 mt-1">Consecutive days of check-ins</p>
                  </div>

                  {/* Member Duration */}
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <span className="text-2xl font-bold text-purple-600">
                        {profile?.created_at 
                          ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
                          : 0}
                      </span>
                    </div>
                    <p className="text-sm text-purple-800 font-medium">Days as Member</p>
                    <p className="text-xs text-purple-600 mt-1">Since {memberSince}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
