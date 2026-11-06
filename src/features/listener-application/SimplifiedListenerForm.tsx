"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, User, Briefcase, Shield, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Step 1: Basic Info
const step1Schema = z.object({
  full_legal_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
});

// Step 2: Professional Info
const step2Schema = z.object({
  professional_title: z.string().min(2, "Professional title is required"),
  years_of_experience: z.number().min(0, "Years of experience is required"),
  specialization: z.string().min(2, "At least one specialization is required"),
  professional_bio: z.string().min(50, "Bio must be at least 50 characters"),
});

// Step 3: Create Account
const step3Schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export function SimplifiedListenerForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store data from each step
  const [formData, setFormData] = useState<any>({});

  const handleStep1Submit = (data: Step1Data) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    // Convert specialization string to array
    const specs = data.specialization.split(',').map(s => s.trim()).filter(Boolean);
    setFormData({ ...formData, ...data, specialization: specs });
    setCurrentStep(3);
  };

  const handleFinalSubmit = async (data: Step3Data) => {
    setIsSubmitting(true);

    try {
      // 1. Register user account
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: data.password,
          full_name: formData.full_legal_name,
          account_type: 'listener',
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        const errorMessage = error.error || 'Registration failed';
        
        // User-friendly error messages
        if (errorMessage.includes('rate limit')) {
          throw new Error('Too many registration attempts. Please try again in a few minutes, or use a different email address.');
        } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          throw new Error('This email is already registered. Please sign in instead.');
        } else {
          throw new Error(errorMessage);
        }
      }

      // 2. Create listener profile with auto-verified status
      const listenerData = {
        full_legal_name: formData.full_legal_name,
        email: formData.email,
        country: formData.country,
        city: formData.city,
        professional_title: formData.professional_title,
        years_of_experience: formData.years_of_experience,
        specialization: formData.specialization,
        professional_bio: formData.professional_bio,
        auto_verify: true, // Auto-verify listener
      };

      const listenerResponse = await fetch('/api/listener/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listenerData),
      });

      if (!listenerResponse.ok) {
        throw new Error('Failed to set up listener profile');
      }

      // Success! Redirect to dashboard
      router.push('/dashboard?welcome=true');
      
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-semibold
                ${currentStep >= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Basic Info</span>
          <span>Professional</span>
          <span>Account</span>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && <Step1Form onNext={handleStep1Submit} initialData={formData} />}
      {currentStep === 2 && <Step2Form onNext={handleStep2Submit} onBack={() => setCurrentStep(1)} initialData={formData} />}
      {currentStep === 3 && <Step3Form onSubmit={handleFinalSubmit} onBack={() => setCurrentStep(2)} isSubmitting={isSubmitting} />}
    </div>
  );
}

// Step 1: Basic Information
function Step1Form({ onNext, initialData }: { onNext: (data: Step1Data) => void; initialData: any }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: initialData,
  });

  return (
    <div className="bg-white rounded-2xl border border-border p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Basic Information
        </h2>
        <p className="text-sm text-muted">Let's start with the essentials</p>
      </div>

      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <Input
          label="Full Legal Name"
          placeholder="John Doe"
          error={errors.full_legal_name?.message}
          {...register("full_legal_name")}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Country"
            placeholder="United States"
            error={errors.country?.message}
            {...register("country")}
          />

          <Input
            label="City"
            placeholder="New York"
            error={errors.city?.message}
            {...register("city")}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="min-w-[140px]">
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}

// Step 2: Professional Information
function Step2Form({ onNext, onBack, initialData }: { onNext: (data: Step2Data) => void; onBack: () => void; initialData: any }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      ...initialData,
      specialization: Array.isArray(initialData.specialization) ? initialData.specialization.join(', ') : initialData.specialization,
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-border p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          Professional Background
        </h2>
        <p className="text-sm text-muted">Tell us about your expertise</p>
      </div>

      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <Input
          label="Professional Title"
          placeholder="e.g., Licensed Therapist, Counselor, Life Coach"
          error={errors.professional_title?.message}
          {...register("professional_title")}
        />

        <Input
          label="Years of Experience"
          type="number"
          placeholder="5"
          error={errors.years_of_experience?.message}
          {...register("years_of_experience", { valueAsNumber: true })}
        />

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Areas of Expertise <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g., Anxiety, Depression, Relationships (comma-separated)"
            error={errors.specialization?.message}
            {...register("specialization")}
          />
          <p className="text-xs text-muted mt-1">Separate multiple areas with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Professional Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register("professional_bio")}
            rows={5}
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Tell us about your background, approach, and how you can help others... (minimum 50 characters)"
          />
          {errors.professional_bio && (
            <p className="text-sm text-red-600 mt-1">{errors.professional_bio.message}</p>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button type="submit" size="lg" className="min-w-[140px]">
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}

// Step 3: Create Account
function Step3Form({ onSubmit, onBack, isSubmitting }: { onSubmit: (data: Step3Data) => void; onBack: () => void; isSubmitting: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
  });

  return (
    <div className="bg-white rounded-2xl border border-border p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Create Your Account
        </h2>
        <p className="text-sm text-muted">Set up your secure password and start helping others</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 mb-1">
                ✨ Instant Verification!
              </p>
              <p className="text-sm text-green-700">
                Your account will be <strong>automatically verified</strong> so you can start accepting bookings immediately. You can add additional verification documents later in your profile settings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            className="min-w-[180px] bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Create Account & Start
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
