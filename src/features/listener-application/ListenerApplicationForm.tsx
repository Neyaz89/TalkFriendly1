"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { ProfessionalInfoStep } from "./ProfessionalInfoStep";
import { VerificationStep } from "./VerificationStep";
import { ReviewStep } from "./ReviewStep";
import { ApplicationProgressIndicator } from "./ApplicationProgressIndicator";

export type ApplicationData = {
  // Personal Information
  full_legal_name: string;
  phone: string;
  country: string;
  city: string;
  state_province: string;
  
  // Professional Information
  professional_title: string;
  qualifications: string[];
  educational_institution: string;
  specialization: string[];
  years_of_experience: number;
  professional_bio: string;
  languages_spoken: string[];
  areas_of_expertise: string[];
  
  // Verification Details
  license_number: string;
  licensing_authority: string;
  license_country: string;
  license_state_province: string;
  license_expiry_date: string;
  
  // Documents
  profile_photo_url: string;
  verification_documents: Array<{
    type: string;
    url: string;
    file_name: string;
    uploaded_at: string;
  }>;
};

const STEPS = [
  { id: 1, title: "Personal Info", description: "Basic details" },
  { id: 2, title: "Professional", description: "Credentials" },
  { id: 3, title: "Verification", description: "Documents" },
  { id: 4, title: "Review", description: "Confirm & submit" }
];

export function ListenerApplicationForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [applicationData, setApplicationData] = useState<Partial<ApplicationData>>({
    qualifications: [],
    specialization: [],
    languages_spoken: [],
    areas_of_expertise: [],
    verification_documents: [],
    years_of_experience: 0
  });

  const updateApplicationData = (data: Partial<ApplicationData>) => {
    setApplicationData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // TODO: API call to save draft
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log('Draft saved:', applicationData);
      // Show success message
    } catch (error) {
      console.error('Error saving draft:', error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: API call to submit application
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      console.log('Application submitted:', applicationData);
      
      // Redirect to success page or dashboard
      router.push('/listener-application/success');
    } catch (error) {
      console.error('Error submitting application:', error);
      // Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            data={applicationData}
            onUpdate={updateApplicationData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <ProfessionalInfoStep
            data={applicationData}
            onUpdate={updateApplicationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <VerificationStep
            data={applicationData}
            onUpdate={updateApplicationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <ReviewStep
            data={applicationData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/auth/register/role-select')}
          className="flex items-center gap-2 text-sm text-muted hover:text-text mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to role selection
        </button>
        
        <h1 className="text-2xl font-bold text-text mb-2">
          Listener Application
        </h1>
        <p className="text-muted">
          Complete your professional application to join TalkFriendly as a verified Listener
        </p>
      </div>

      {/* Progress Indicator */}
      <ApplicationProgressIndicator 
        steps={STEPS} 
        currentStep={currentStep} 
      />

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Save Draft Button (visible on steps 1-3) */}
      {currentStep < 4 && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="text-sm"
          >
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <p className="text-xs text-muted mt-2">
            Your progress will be saved and you can continue later
          </p>
        </div>
      )}
    </div>
  );
}
