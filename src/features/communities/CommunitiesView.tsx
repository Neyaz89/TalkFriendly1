"use client";

/**
 * Communities View
 * Lists all communities with filtering, search, and create functionality.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Lock,
  Plus,
  X,
  Shield,
  MessageSquare,
  Mic,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { communityService } from "@/services/community.service";
import type {
  Community,
  CommunityCategory,
  CreateCommunityPayload,
} from "@/types";
import { ROUTES } from "@/constants";
import { CardSkeleton } from "@/components/ui/skeleton";

const CATEGORIES: { value: CommunityCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "anxiety", label: "Anxiety" },
  { value: "stress", label: "Stress & Burnout" },
  { value: "career", label: "Career" },
  { value: "students", label: "Students" },
  { value: "meditation", label: "Meditation" },
  { value: "relationships", label: "Relationships" },
  { value: "grief", label: "Grief & Loss" },
  { value: "parenting", label: "Parenting" },
  { value: "gaming", label: "Gaming" },
  { value: "wellness", label: "Wellness" },
];

const CATEGORY_COLORS: Record<CommunityCategory, string> = {
  general: "bg-gray-50 text-gray-600 border-gray-100",
  anxiety: "bg-red-50 text-red-600 border-red-100",
  stress: "bg-orange-50 text-orange-600 border-orange-100",
  career: "bg-blue-50 text-blue-600 border-blue-100",
  students: "bg-purple-50 text-purple-600 border-purple-100",
  meditation: "bg-teal-50 text-teal-600 border-teal-100",
  relationships: "bg-pink-50 text-pink-600 border-pink-100",
  grief: "bg-gray-50 text-gray-600 border-gray-100",
  parenting: "bg-green-50 text-green-600 border-green-100",
  gaming: "bg-indigo-50 text-indigo-600 border-indigo-100",
  wellness: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export function CommunitiesView() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CommunityCategory | null>(null);
  const [showJoined, setShowJoined] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search, showJoined]);

  const loadCommunities = async () => {
    try {
      setIsLoading(true);
      const data = await communityService.getCommunities({
        category: selectedCategory || undefined,
        search: search || undefined,
        is_member: showJoined || undefined,
      });
      setCommunities(data.communities);
    } catch (error) {
      // Silently handle - communities will remain empty
      // In production, this would be logged to error monitoring service
      setCommunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (communityId: string, isMember: boolean) => {
    try {
      if (isMember) {
        await communityService.leaveCommunity(communityId);
      } else {
        await communityService.joinCommunity({ community_id: communityId });
      }
      // Refresh the community to get updated member status
      await loadCommunities();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join/leave community";
      alert(message);
    }
  };

  const handleCreateCommunity = async (community: Community) => {
    setCommunities((prev) => [community, ...prev]);
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">
            Communities
          </h1>
          <p className="text-muted mt-1 text-sm sm:text-base">
            Find your people. Share, support, and grow together.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="shrink-0"
          size="sm"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search communities…"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowJoined((v) => !v)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${
              showJoined
                ? "bg-primary text-white border-primary"
                : "border-border text-muted hover:border-primary/50"
            }`}
          >
            My Communities
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !selectedCategory
                ? "bg-primary text-white border-primary"
                : "border-border text-muted hover:border-primary/50"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.value ? null : cat.value
                )
              }
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedCategory === cat.value
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted hover:border-primary/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Communities Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No communities found
          </h3>
          <p className="text-muted mb-6">
            {showJoined
              ? "You haven't joined any communities yet."
              : "Try adjusting your search or filters."}
          </p>
          {showJoined && (
            <Button onClick={() => setShowJoined(false)}>
              Explore Communities
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {communities.map((community, i) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <CommunityCard community={community} onJoin={handleJoin} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateCommunity}
      />
    </div>
  );
}

// ============================================================================
// Community Card Component
// ============================================================================

function CommunityCard({
  community,
  onJoin,
}: {
  community: Community;
  onJoin: (id: string, isMember: boolean) => void;
}) {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === community.category)?.label ||
    community.category;

  return (
    <Card className="hover:shadow-card-hover transition-all duration-200 h-full flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Category Badge + Privacy */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${
              CATEGORY_COLORS[community.category] ||
              "bg-gray-50 text-gray-600"
            }`}
          >
            {categoryLabel}
          </span>
          {community.is_private && (
            <Lock
              className="h-3.5 w-3.5 text-muted shrink-0"
              aria-label="Private community"
            />
          )}
        </div>

        {/* Community Info */}
        <Link
          href={ROUTES.COMMUNITY(community.id)}
          className="group flex-1 flex flex-col"
        >
          <h3 className="font-semibold text-text mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {community.name}
          </h3>
          <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-3">
            {community.description}
          </p>
        </Link>

        {/* Stats + Action */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <div className="flex items-center gap-3 text-muted">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">
                {community.member_count.toLocaleString()}
              </span>
            </div>
            {community.is_member && (
              <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full font-medium">
                Joined
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant={community.is_member ? "outline" : "default"}
            onClick={(e) => {
              e.preventDefault();
              onJoin(community.id, community.is_member || false);
            }}
            className="text-xs"
          >
            {community.is_member ? "Leave" : "Join"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Create Community Modal
// ============================================================================

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (community: Community) => void;
}

function CreateCommunityModal({
  isOpen,
  onClose,
  onCreate,
}: CreateCommunityModalProps) {
  const [formData, setFormData] = useState<CreateCommunityPayload>({
    name: "",
    description: "",
    category: "general",
    is_private: false,
    settings: {
      allow_voice_messages: true,
      allow_member_posts: true,
      require_approval: false,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    console.log('=== FRONTEND: Create Community Submit ===')
    console.log('Form data:', JSON.stringify(formData, null, 2))

    if (!formData.name.trim()) {
      console.log('❌ Validation failed: name empty')
      setError("Community name is required");
      return;
    }

    if (!formData.description.trim()) {
      console.log('❌ Validation failed: description empty')
      setError("Description is required");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Calling communityService.createCommunity...')
      
      const community = await communityService.createCommunity(formData);
      
      console.log('✅ Community created successfully:', community)
      onCreate(community);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        category: "general",
        is_private: false,
        settings: {
          allow_voice_messages: true,
          allow_member_posts: true,
          require_approval: false,
        },
      });
    } catch (err) {
      console.error('❌ FRONTEND: Create community failed - RAW ERROR:', err)
      console.error('❌ FRONTEND: Error type:', typeof err)
      console.error('❌ FRONTEND: Error constructor:', err?.constructor?.name)
      console.error('❌ FRONTEND: Error stringified:', JSON.stringify(err, null, 2))
      console.error('❌ FRONTEND: Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        fullError: err
      })
      
      // Try to extract message from various error formats
      let message = "Failed to create community";
      
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err === 'object') {
        // Check for common error properties
        const errorObj = err as any;
        if (errorObj.message) message = errorObj.message;
        else if (errorObj.error) message = errorObj.error;
        else if (errorObj.msg) message = errorObj.msg;
      }
      
      console.error('❌ FRONTEND: Extracted message:', message)
      setError(message);
      
      // Show alert with full error for debugging
      alert(`Failed to create community:\n\n${message}\n\nCheck browser console for full details.`);
    } finally {
      setIsSubmitting(false);
      console.log('=== FRONTEND: Create Community Submit END ===')
    }
  };

  const handleChange = (
    field: keyof CreateCommunityPayload,
    value: string | boolean | Partial<typeof formData.settings>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSettingChange = (
    setting: 'allow_voice_messages' | 'allow_member_posts' | 'require_approval',
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings!, [setting]: value },
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-xl font-bold text-text">Create Community</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-4 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Community Name */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Community Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Mindful Tech Workers"
                  maxLength={50}
                />
                <p className="text-xs text-muted mt-1">
                  {formData.name.length}/50 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleChange("description", e.target.value)
                  }
                  placeholder="What is this community about? What kind of discussions will happen here?"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    handleChange("category", e.target.value as CommunityCategory)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Privacy */}
              <div>
                <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_private}
                    onChange={(e) =>
                      handleChange("is_private", e.target.checked)
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-4 w-4 text-muted" />
                      <span className="text-sm font-medium text-text">
                        Private Community
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      Only invited members can join and see content
                    </p>
                  </div>
                </label>
              </div>

              {/* Community Settings */}
              <div>
                <h3 className="text-sm font-medium text-text mb-3">
                  Community Settings
                </h3>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.settings?.allow_member_posts}
                      onChange={(e) =>
                        handleSettingChange("allow_member_posts", e.target.checked)
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <MessageSquare className="h-3.5 w-3.5 text-muted" />
                        <span className="text-sm font-medium text-text">
                          Allow member messages
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        All members can send messages
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.settings?.allow_voice_messages}
                      onChange={(e) =>
                        handleSettingChange(
                          "allow_voice_messages",
                          e.target.checked
                        )
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Mic className="h-3.5 w-3.5 text-muted" />
                        <span className="text-sm font-medium text-text">
                          Allow voice messages
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        Members can send voice messages
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.settings?.require_approval}
                      onChange={(e) =>
                        handleSettingChange("require_approval", e.target.checked)
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Shield className="h-3.5 w-3.5 text-muted" />
                        <span className="text-sm font-medium text-text">
                          Require approval
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        New members need approval to join
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
