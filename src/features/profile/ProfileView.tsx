"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@supabase/supabase-js";
import { Camera, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ROUTES } from "@/constants";
import Image from "next/image";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  profession: z.string().min(2, "Profession must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  profession: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface ProfileViewProps {
  user: User;
  profile: Profile | null;
}

export function ProfileView({ user, profile }: ProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      profession: profile?.profession || "",
      bio: profile?.bio || "",
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl;

    setUploading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setError(null);
      setSuccess(null);

      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
        if (!newAvatarUrl && avatarFile) {
          // Upload failed
          return;
        }
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          username: data.username,
          profession: data.profession,
          bio: data.bio || null,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          username: data.username,
          profession: data.profession,
          avatar_url: newAvatarUrl,
        },
      });

      if (authError) {
        throw authError;
      }

      setSuccess('Profile updated successfully!');
      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setPreviewUrl(null);

      // Redirect to profile page to show updated data
      setTimeout(() => {
        router.push(ROUTES.PROFILE);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const displayAvatarUrl = previewUrl || avatarUrl;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href={ROUTES.PROFILE}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-black">Edit Profile</h1>
            <p className="text-gray-600 mt-2">Update your personal information and avatar</p>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Avatar Section */}
              <div className="bg-gray-50 px-6 py-8 border-b border-gray-200">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                      {displayAvatarUrl ? (
                        <Image
                          src={displayAvatarUrl}
                          alt="Profile avatar"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-white text-4xl font-bold">
                          {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-lg"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Click the camera icon to upload a new photo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                  {previewUrl && (
                    <p className="text-xs text-primary mt-2">
                      New photo selected - click Save to update
                    </p>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="p-6 space-y-6">
                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    error={errors.full_name?.message}
                    {...register("full_name")}
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="john_doe"
                    error={errors.username?.message}
                    {...register("username")}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lowercase letters, numbers, and underscores only
                  </p>
                </div>

                {/* Profession */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Profession <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Software Developer"
                    error={errors.profession?.message}
                    {...register("profession")}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Bio
                  </label>
                  <textarea
                    placeholder="Tell us a bit about yourself..."
                    rows={4}
                    className={`
                      w-full px-4 py-3 rounded-xl border transition-colors
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      ${errors.bio ? 'border-red-500' : 'border-gray-300'}
                    `}
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum 500 characters
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-600" role="alert">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-600" role="alert">{success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isSubmitting || uploading}
                    disabled={isSubmitting || uploading}
                  >
                    {isSubmitting || uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(ROUTES.PROFILE)}
                    disabled={isSubmitting || uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
