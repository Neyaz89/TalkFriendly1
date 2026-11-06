"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, User, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ApplicationData } from "./ListenerApplicationForm";

const personalInfoSchema = z.object({
  full_legal_name: z.string().min(2, "Full legal name is required").max(100),
  phone: z.string().min(10, "Valid phone number required").max(20),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  state_province: z.string().optional(),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
  data: Partial<ApplicationData>;
  onUpdate: (data: Partial<ApplicationData>) => void;
  onNext: () => void;
}

export function PersonalInfoStep({ data, onUpdate, onNext }: PersonalInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      full_legal_name: data.full_legal_name || '',
      phone: data.phone || '',
      country: data.country || '',
      city: data.city || '',
      state_province: data.state_province || '',
    },
    mode: 'onChange',
  });

  const onSubmit = (formData: PersonalInfoData) => {
    onUpdate(formData);
    onNext();
  };

  return (
    <div className="bg-background border border-border rounded-2xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text mb-2">Personal Information</h2>
        <p className="text-sm text-muted">
          Please provide your basic personal details
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Full Legal Name */}
        <Input
          label="Full Legal Name"
          placeholder="Dr. Jane Smith"
          leftIcon={<User className="h-4 w-4" />}
          error={errors.full_legal_name?.message}
          {...register("full_legal_name")}
          required
        />

        {/* Phone */}
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+1 (555) 123-4567"
          leftIcon={<Phone className="h-4 w-4" />}
          error={errors.phone?.message}
          {...register("phone")}
          required
        />

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-4 py-2 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            {...register("country")}
          >
            <option value="">Select country</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="IN">India</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="ES">Spain</option>
            <option value="IT">Italy</option>
            <option value="BR">Brazil</option>
            <option value="MX">Mexico</option>
            <option value="JP">Japan</option>
            <option value="KR">South Korea</option>
            <option value="SG">Singapore</option>
            <option value="AE">United Arab Emirates</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.country && (
            <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>
          )}
        </div>

        {/* City */}
        <Input
          label="City"
          placeholder="New York"
          leftIcon={<MapPin className="h-4 w-4" />}
          error={errors.city?.message}
          {...register("city")}
          required
        />

        {/* State/Province */}
        <Input
          label="State/Province (Optional)"
          placeholder="New York"
          leftIcon={<MapPin className="h-4 w-4" />}
          error={errors.state_province?.message}
          {...register("state_province")}
        />

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong className="font-semibold">Note:</strong> Your legal name will be used for verification purposes only and will not be publicly displayed.
          </p>
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4">
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
