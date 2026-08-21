"use client";

/**
 * Settings view.
 * Dark mode, notifications, privacy, language, data export, and account deletion.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon, Sun, Bell, Shield, Globe,
  Download, Trash2, ChevronRight, LogOut, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profileService } from "@/services/profile.service";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import type { UserProfile, NotificationSettings, PrivacySettings } from "@/types";
import { ROUTES } from "@/constants";

// ─── Accessible toggle switch ─────────────────────────────────────────────────
function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-primary focus-visible:ring-offset-2
        ${enabled ? "bg-primary-500" : "bg-gray-200"}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md
          transition-transform duration-200
          ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

// ─── Generic row ─────────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{label}</p>
        {description && (
          <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export function SettingsView() {
  const { signOut } = useAuth();
  const { theme, showBorders, toggleTheme, toggleBorders } = useTheme();
  const isDark = theme === 'dark';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    profileService.getProfile().then((d) => {
      setProfile(d);
      setIsLoading(false);
    });
  }, []);

  /* Persist a notification setting change */
  const updateNotif = async (key: keyof NotificationSettings, value: boolean | string) => {
    if (!profile) return;
    const updated: NotificationSettings = { ...profile.settings.notifications, [key]: value };
    const saved = await profileService.updateSettings({
      ...profile.settings,
      notifications: updated,
    });
    setProfile((p) => (p ? { ...p, settings: saved.settings } : p));
    flashSaved();
  };

  /* Persist a privacy setting change */
  const updatePrivacy = async (key: keyof PrivacySettings, value: boolean) => {
    if (!profile) return;
    const updated: PrivacySettings = { ...profile.settings.privacy, [key]: value };
    const saved = await profileService.updateSettings({
      ...profile.settings,
      privacy: updated,
    });
    setProfile((p) => (p ? { ...p, settings: saved.settings } : p));
    flashSaved();
  };

  /* Persist language change */
  const updateLanguage = async (lang: string) => {
    if (!profile) return;
    const saved = await profileService.updateSettings({ ...profile.settings, language: lang });
    setProfile((p) => (p ? { ...p, settings: saved.settings } : p));
    flashSaved();
  };

  const flashSaved = () => {
    setSavedMsg("Saved ✓");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const handleExport = async () => {
    const blob = await profileService.exportData();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "talkfriendly-data-export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    await profileService.deleteAccount();
    await signOut();
  };

  if (isLoading || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  const n = profile.settings.notifications;
  const p = profile.settings.privacy;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={ROUTES.PROFILE}
          className="p-2 rounded-xl hover:bg-secondary text-muted hover:text-text transition-colors"
          aria-label="Back to profile"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">Settings</h1>
          <p
            className={`text-xs font-medium text-green-600 transition-opacity duration-300 ${
              savedMsg ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            {savedMsg || "–"}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* ── Appearance ──────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="Dark Mode" description="Dark backgrounds and light text">
              <Toggle enabled={isDark} onChange={toggleTheme} label="Toggle dark mode" />
            </SettingRow>
            <SettingRow label="Show Borders" description="Display borders around cards and elements">
              <Toggle enabled={showBorders} onChange={toggleBorders} label="Toggle borders" />
            </SettingRow>
          </CardContent>
        </Card>

        {/* ── Notifications ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="Daily Check-in Reminder" description="Prompt me to check in each day">
              <Toggle enabled={n.dailyCheckIn}    onChange={(v) => updateNotif("dailyCheckIn", v)}    label="Daily check-in reminder"    />
            </SettingRow>
            <SettingRow label="Journal Reminder" description="Prompt me to write regularly">
              <Toggle enabled={n.journalReminder} onChange={(v) => updateNotif("journalReminder", v)} label="Journal reminder"           />
            </SettingRow>
            <SettingRow label="Community Updates" description="New posts and replies">
              <Toggle enabled={n.communityUpdates} onChange={(v) => updateNotif("communityUpdates", v)} label="Community updates"        />
            </SettingRow>
            <SettingRow label="Listener Messages" description="Session reminders and messages">
              <Toggle enabled={n.listenerMessages} onChange={(v) => updateNotif("listenerMessages", v)} label="Listener messages"        />
            </SettingRow>
            <SettingRow label="Weekly Insights" description="Weekly wellbeing report">
              <Toggle enabled={n.weeklyInsights}  onChange={(v) => updateNotif("weeklyInsights", v)}  label="Weekly insights"           />
            </SettingRow>
            <SettingRow label="Event Reminders" description="Upcoming circles and events">
              <Toggle enabled={n.eventReminders}  onChange={(v) => updateNotif("eventReminders", v)}  label="Event reminders"           />
            </SettingRow>

            <div className="pt-3 border-t border-border">
              <SettingRow label="Reminder Time" description="When to send daily reminders">
                <input
                  type="time"
                  value={n.reminderTime}
                  onChange={(e) => updateNotif("reminderTime", e.target.value)}
                  className="text-sm border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  aria-label="Reminder time"
                />
              </SettingRow>
            </div>
          </CardContent>
        </Card>

        {/* ── Privacy ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="Show in Matching" description="Allow others to find you for peer support">
              <Toggle enabled={p.showInMatching} onChange={(v) => updatePrivacy("showInMatching", v)} label="Show in matching" />
            </SettingRow>
            <SettingRow label="Allow Direct Messages" description="Let matched users message you">
              <Toggle enabled={p.allowMessages}  onChange={(v) => updatePrivacy("allowMessages", v)}  label="Allow direct messages" />
            </SettingRow>
            <SettingRow label="Public Profile" description="Others can view your basic profile">
              <Toggle enabled={p.publicProfile}  onChange={(v) => updatePrivacy("publicProfile", v)}  label="Public profile" />
            </SettingRow>
            <SettingRow label="Share Activity" description="Show streaks and achievements publicly">
              <Toggle enabled={p.shareActivity}  onChange={(v) => updatePrivacy("shareActivity", v)}  label="Share activity" />
            </SettingRow>
          </CardContent>
        </Card>

        {/* ── Language ────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SettingRow label="App Language" description="Interface and notification language">
              <select
                value={profile.settings.language}
                onChange={(e) => updateLanguage(e.target.value)}
                className="text-sm border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                aria-label="Language"
              >
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="ar">🇦🇪 العربية</option>
                <option value="pt">🇧🇷 Português</option>
                <option value="hi">🇮🇳 हिंदी</option>
                <option value="zh">🇨🇳 中文</option>
              </select>
            </SettingRow>
          </CardContent>
        </Card>

        {/* ── Data & Account ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data & Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Export */}
            <ActionRow
              icon={Download}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              label="Export My Data"
              description="Download all your TalkFriendly data as JSON"
              onClick={handleExport}
            />

            {/* Sign out */}
            <ActionRow
              icon={LogOut}
              iconBg="bg-gray-50"
              iconColor="text-muted"
              label="Sign Out"
              description="Sign out of your account"
              onClick={signOut}
            />

            {/* Delete account */}
            <ActionRow
              icon={Trash2}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              label="Delete Account"
              labelColor="text-red-600"
              description="Permanently delete your account and all data"
              onClick={() => setShowDeleteConfirm(true)}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Delete confirmation modal ─────────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{   y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-large"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-7 w-7 text-red-500" aria-hidden="true" />
                </div>
                <h3 id="delete-dialog-title" className="text-lg font-bold text-text">
                  Delete your account?
                </h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  This permanently deletes all your journals, check-ins, conversations, and
                  community posts. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                >
                  Delete forever
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Action row sub-component ─────────────────────────────────────────────────
function ActionRow({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  labelColor = "text-text",
  description,
  onClick,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  labelColor?: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
    >
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${labelColor}`}>{label}</p>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted shrink-0" aria-hidden="true" />
    </button>
  );
}
