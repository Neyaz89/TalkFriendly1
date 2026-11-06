"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Shield, Calendar, Upload, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ApplicationData } from "./ListenerApplicationForm";
import { DocumentUploadZone } from "./DocumentUploadZone";
import { DocumentPreview } from "./DocumentPreview";

const verificationSchema = z.object({
  license_number: z.string().optional(),
  licensing_authority: z.string().optional(),
  license_country: z.string().optional(),
  license_state_province: z.string().optional(),
  license_expiry_date: z.string().optional(),
});

type VerificationData = z.infer<typeof verificationSchema>;

interface VerificationStepProps {
  data: Partial<ApplicationData>;
  onUpdate: (data: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function VerificationStep({ data, onUpdate, onNext, onBack }: VerificationStepProps) {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(data.profile_photo_url || null);
  const [documents, setDocuments] = useState(data.verification_documents || []);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      license_number: data.license_number || '',
      licensing_authority: data.licensing_authority || '',
      license_country: data.license_country || '',
      license_state_province: data.license_state_province || '',
      license_expiry_date: data.license_expiry_date || '',
    },
  });

  const handleProfilePhotoUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // TODO: Upload to Supabase Storage
      const mockUrl = URL.createObjectURL(file);
      setProfilePhoto(mockUrl);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      // TODO: Upload to Supabase Storage
      const newDocs = files.map((file) => ({
        type: 'certificate',
        url: URL.createObjectURL(file),
        file_name: file.name,
        uploaded_at: new Date().toISOString(),
      }));
      setDocuments([...documents, ...newDocs]);
    } catch (error) {
      console.error('Error uploading documents:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const onSubmit = (formData: VerificationData) => {
    if (!profilePhoto) {
      alert("Please upload a profile photo");
      return;
    }
    if (documents.length === 0) {
      alert("Please upload at least one verification document");
      return;
    }

    onUpdate({
      ...formData,
      profile_photo_url: profilePhoto,
      verification_documents: documents,
    });
    onNext();
  };

  return (
    <div className="bg-background border border-border rounded-2xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text mb-2">Verification & Documents</h2>
        <p className="text-sm text-muted">
          Upload your credentials and professional documents
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Photo */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Profile Photo <span className="text-red-500">*</span>
          </label>
          {profilePhoto ? (
            <div className="flex items-center gap-4">
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProfilePhoto(null)}
                >
                  Change Photo
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              <ImageIcon className="h-12 w-12 text-muted mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProfilePhotoUpload(file);
                }}
                className="hidden"
                id="profile-photo"
              />
              <label htmlFor="profile-photo" className="cursor-pointer">
                <span className="text-primary font-medium hover:underline">
                  Upload a photo
                </span>
                <p className="text-xs text-muted mt-1">JPG, PNG (Max 5MB)</p>
              </label>
            </div>
          )}
        </div>

        {/* License Information */}
        <div className="border border-border rounded-xl p-5 bg-gray-50">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Professional License (Optional)
          </h3>
          <p className="text-sm text-muted mb-4">
            If you have a professional license, please provide the details below. This is optional and jurisdiction-dependent.
          </p>

          <div className="space-y-4">
            <Input
              label="License Number"
              placeholder="PSY-12345"
              {...register("license_number")}
            />

            <Input
              label="Licensing Authority"
              placeholder="State Board of Psychology"
              {...register("licensing_authority")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="License Country"
                placeholder="United States"
                {...register("license_country")}
              />

              <Input
                label="State/Province"
                placeholder="California"
                {...register("license_state_province")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                License Expiry Date
              </label>
              <Input
                type="date"
                {...register("license_expiry_date")}
              />
            </div>
          </div>
        </div>

        {/* Verification Documents */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Verification Documents <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-muted mb-3">
            Upload professional certificates, degrees, or other credentials (Min: 1, Max: 5)
          </p>

          <DocumentUploadZone
            onUpload={handleDocumentUpload}
            isUploading={isUploading}
            maxFiles={5 - documents.length}
          />

          {documents.length > 0 && (
            <div className="mt-4 space-y-2">
              {documents.map((doc, index) => (
                <DocumentPreview
                  key={index}
                  document={doc}
                  onRemove={() => handleRemoveDocument(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong className="font-semibold">Document Privacy:</strong> All uploaded documents are stored securely and will only be viewed by authorized administrators during the verification process.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            type="submit"
            size="lg"
            className="min-w-[160px]"
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
