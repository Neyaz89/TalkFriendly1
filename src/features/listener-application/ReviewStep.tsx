"use client";

import React, { useState } from "react";
import { ArrowLeft, Check, User, Briefcase, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApplicationData } from "./ListenerApplicationForm";

interface ReviewStepProps {
  data: Partial<ApplicationData>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewStep({ data, onBack, onSubmit, isSubmitting }: ReviewStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = () => {
    if (!agreedToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }
    onSubmit();
  };

  return (
    <div className="bg-background border border-border rounded-2xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text mb-2">Review Your Application</h2>
        <p className="text-sm text-muted">
          Please review all information before submitting
        </p>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <Section
          icon={<User className="h-5 w-5" />}
          title="Personal Information"
          items={[
            { label: "Full Name", value: data.full_legal_name },
            { label: "Phone", value: data.phone },
            { label: "Location", value: `${data.city}, ${data.state_province || ''} ${data.country}`.trim() },
          ]}
        />

        {/* Professional Information */}
        <Section
          icon={<Briefcase className="h-5 w-5" />}
          title="Professional Information"
          items={[
            { label: "Title", value: data.professional_title },
            { label: "Qualifications", value: data.qualifications?.join(", ") },
            { label: "Institution", value: data.educational_institution },
            { label: "Experience", value: `${data.years_of_experience} years` },
            { label: "Specializations", value: data.specialization?.join(", ") },
            { label: "Languages", value: data.languages_spoken?.join(", ") },
          ]}
        />

        {/* Bio */}
        <div className="border border-border rounded-xl p-4">
          <h4 className="font-semibold text-text mb-2">Professional Bio</h4>
          <p className="text-sm text-muted whitespace-pre-wrap">{data.professional_bio}</p>
        </div>

        {/* Verification */}
        <Section
          icon={<Shield className="h-5 w-5" />}
          title="Verification & Documents"
          items={[
            { label: "License Number", value: data.license_number || "Not provided" },
            { label: "Licensing Authority", value: data.licensing_authority || "Not provided" },
            { label: "Profile Photo", value: data.profile_photo_url ? "✓ Uploaded" : "Not uploaded" },
            { label: "Documents", value: `${data.verification_documents?.length || 0} document(s) uploaded` },
          ]}
        />

        {/* Terms Agreement */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-2">Before You Submit</h4>
              <ul className="text-sm text-yellow-800 space-y-1 mb-3">
                <li>• Your application will be reviewed by our team</li>
                <li>• Review typically takes 2-5 business days</li>
                <li>• You'll receive an email update on your application status</li>
                <li>• Make sure all information is accurate and complete</li>
              </ul>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-yellow-900">
                  I confirm that all information provided is accurate and complete. I agree to TalkFriendly's{" "}
                  <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={!agreedToTerms || isSubmitting}
            className="min-w-[180px] bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  items: Array<{ label: string; value?: string }>;
}

function Section({ icon, title, items }: SectionProps) {
  return (
    <div className="border border-border rounded-xl p-4">
      <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, index) => (
          <div key={index}>
            <dt className="text-xs font-medium text-muted mb-1">{item.label}</dt>
            <dd className="text-sm text-text">{item.value || "—"}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}
