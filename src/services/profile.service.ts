/**
 * Profile service.
 * GET /profile, PATCH /profile, PATCH /profile/settings, POST /profile/avatar
 * All calls mocked to simulate a FastAPI backend.
 */

import type { UserProfile, UserSettings } from "@/types";
import { MOCK_USER_PROFILE } from "@/mocks/users.mock";
import { delay } from "@/lib/utils";

// Mutable copy so updates persist within the session
let mockProfile: UserProfile = { ...MOCK_USER_PROFILE };

export const profileService = {
  /**
   * GET /profile
   * Returns the current user's full profile.
   */
  async getProfile(): Promise<UserProfile> {
    await delay(500);
    return { ...mockProfile };
  },

  /**
   * PATCH /profile
   * Updates top-level profile fields (name, bio, location…).
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    await delay(700);
    mockProfile = { ...mockProfile, ...updates };
    return { ...mockProfile };
  },

  /**
   * PATCH /profile/settings
   * Updates app settings (notifications, privacy, language, darkMode).
   * Returns the full updated profile so callers can replace state in one step.
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<UserProfile> {
    await delay(300);
    mockProfile = {
      ...mockProfile,
      settings: { ...mockProfile.settings, ...settings },
    };
    return { ...mockProfile };
  },

  /**
   * POST /profile/avatar
   * Simulates uploading a profile photo.
   */
  async updateAvatar(): Promise<{ avatarUrl: string }> {
    await delay(1500);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
    mockProfile = { ...mockProfile, avatar: avatarUrl };
    return { avatarUrl };
  },

  /**
   * GET /profile/export
   * Returns the user's data as a downloadable JSON blob.
   */
  async exportData(): Promise<Blob> {
    await delay(1500);
    const exportData = {
      profile: mockProfile,
      exportedAt: new Date().toISOString(),
      version: "1.0",
      app: "TalkFriendly",
    };
    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
  },

  /**
   * DELETE /profile
   * Deletes the user's account and all associated data.
   */
  async deleteAccount(): Promise<void> {
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      // Clear local storage
      if (typeof window !== "undefined") {
        localStorage.clear();
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
};
