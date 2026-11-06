"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Award, GraduationCap, Briefcase, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ApplicationData } from "./ListenerApplicationForm";

const professionalInfoSchema = z.object({
  professional_title: z.string().min(2, "Professional title is required").max(100),
  educational_institution: z.string().min(2, "Educational institution is required").max(200),
  years_of_experience: z.coerce.number().min(0, "Years of experience is required").max(60),
  professional_bio: z.string().min(200, "Bio must be at least 200 characters").max(1000, "Bio must not exceed 1000 characters"),
});

type ProfessionalInfoData = z.infer<typeof professionalInfoSchema>;

interface ProfessionalInfoStepProps {
  data: Partial<ApplicationData>;
  onUpdate: (data: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const COMMON_QUALIFICATIONS = [
  "MD - Doctor of Medicine",
  "PhD - Doctor of Philosophy (Psychology)",
  "PsyD - Doctor of Psychology",
  "MSW - Master of Social Work",
  "LCSW - Licensed Clinical Social Worker",
  "LPC - Licensed Professional Counselor",
  "LMFT - Licensed Marriage and Family Therapist",
  "Psychiatrist",
  "Clinical Psychologist",
  "Counseling Psychologist",
];

const COMMON_SPECIALIZATIONS = [
  "Depression",
  "Anxiety Disorders",
  "Trauma & PTSD",
  "Relationship Issues",
  "Grief & Loss",
  "Stress Management",
  "Self-Esteem",
  "Family Conflicts",
  "Work-Life Balance",
  "Addiction",
  "Eating Disorders",
  "Sleep Disorders",
];

const COMMON_LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Mandarin", "Cantonese", "Japanese", "Korean", "Arabic", "Hindi",
  "Russian", "Dutch", "Swedish", "Polish"
];

export function ProfessionalInfoStep({ 
  data, 
  onUpdate, 
  onNext, 
  onBack 
}: ProfessionalInfoStepProps) {
  const [qualifications, setQualifications] = useState<string[]>(
    data.qualifications || []
  );
  const [specializations, setSpecializations] = useState<string[]>(
    data.specialization || []
  );
  const [languages, setLanguages] = useState<string[]>(
    data.languages_spoken || []
  );
  const [expertise, setExpertise] = useState<string[]>(
    data.areas_of_expertise || []
  );
  const [customInput, setCustomInput] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProfessionalInfoData>({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      professional_title: data.professional_title || '',
      educational_institution: data.educational_institution || '',
      years_of_experience: data.years_of_experience || 0,
      professional_bio: data.professional_bio || '',
    },
    mode: 'onChange',
  });

  const bioValue = watch('professional_bio');
  const bioLength = bioValue?.length || 0;

  const toggleItem = (item: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const addCustomItem = (list: string[], setter: (list: string[]) => void) => {
    if (customInput.trim() && !list.includes(customInput.trim())) {
      setter([...list, customInput.trim()]);
      setCustomInput("");
    }
  };

  const removeItem = (item: string, list: string[], setter: (list: string[]) => void) => {
    setter(list.filter(i => i !== item));
  };

  const onSubmit = (formData: ProfessionalInfoData) => {
    if (qualifications.length === 0) {
      alert("Please select at least one qualification");
      return;
    }
    if (specializations.length === 0) {
      alert("Please select at least one specialization");
      return;
    }
    if (languages.length === 0) {
      alert("Please select at least one language");
      return;
    }

    onUpdate({
      ...formData,
      qualifications,
      specialization: specializations,
      languages_spoken: languages,
      areas_of_expertise: expertise.length > 0 ? expertise : specializations,
    });
    onNext();
  };

  return (
    <div className="bg-background border border-border rounded-2xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text mb-2">Professional Information</h2>
        <p className="text-sm text-muted">
          Tell us about your professional background and expertise
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Professional Title */}
        <Input
          label="Professional Title"
          placeholder="Licensed Clinical Psychologist"
          leftIcon={<Award className="h-4 w-4" />}
          error={errors.professional_title?.message}
          {...register("professional_title")}
          required
        />

        {/* Qualifications */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Qualifications <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            {COMMON_QUALIFICATIONS.map((qual) => (
              <button
                key={qual}
                type="button"
                onClick={() => toggleItem(qual, qualifications, setQualifications)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                  qualifications.includes(qual)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background border-border hover:border-primary'
                }`}
              >
                {qual}
              </button>
            ))}
          </div>
          {qualifications.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {qualifications.map((qual) => (
                <span
                  key={qual}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {qual}
                  <button
                    type="button"
                    onClick={() => removeItem(qual, qualifications, setQualifications)}
                    className="hover:text-primary-dark"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Educational Institution */}
        <Input
          label="Educational Institution"
          placeholder="Harvard Medical School"
          leftIcon={<GraduationCap className="h-4 w-4" />}
          error={errors.educational_institution?.message}
          {...register("educational_institution")}
          required
        />

        {/* Specializations */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Specializations <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COMMON_SPECIALIZATIONS.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => toggleItem(spec, specializations, setSpecializations)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  specializations.includes(spec)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-background border-border hover:border-green-500'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
          {specializations.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {specializations.map((spec) => (
                <span
                  key={spec}
                  className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                >
                  {spec}
                  <button
                    type="button"
                    onClick={() => removeItem(spec, specializations, setSpecializations)}
                    className="hover:text-green-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Years of Experience */}
        <Input
          label="Years of Experience"
          type="number"
          min="0"
          max="60"
          placeholder="5"
          leftIcon={<Briefcase className="h-4 w-4" />}
          error={errors.years_of_experience?.message}
          {...register("years_of_experience")}
          required
        />

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Languages Spoken <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COMMON_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleItem(lang, languages, setLanguages)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  languages.includes(lang)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-background border-border hover:border-blue-500'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          {languages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {lang}
                  <button
                    type="button"
                    onClick={() => removeItem(lang, languages, setLanguages)}
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Professional Bio */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Professional Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            rows={6}
            placeholder="Describe your professional background, approach to therapy, and what makes you passionate about helping others..."
            {...register("professional_bio")}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted">
              {errors.professional_bio?.message || "Minimum 200 characters, maximum 1000"}
            </p>
            <p className={`text-xs ${bioLength < 200 ? 'text-red-500' : bioLength > 1000 ? 'text-red-500' : 'text-green-600'}`}>
              {bioLength} / 1000
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
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
