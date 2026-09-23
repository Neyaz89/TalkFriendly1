"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Chrome } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    profession: z.string().min(2, "Profession must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    ageConfirmed: z.boolean().refine((v) => v === true, "You must confirm you are 18 or older"),
    agreeToTerms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    // Validate age >= 18
    if (!data.dateOfBirth) return false;
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    return actualAge >= 18;
  }, {
    message: "You must be at least 18 years old to use TalkFriendly",
    path: ["dateOfBirth"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      agreeToTerms: false,
      ageConfirmed: false,
    },
  });

  const emailValue = watch("email");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      // Extract username from name (or use email prefix as fallback)
      const username = data.name.toLowerCase().replace(/\s+/g, '_');
      await signUp(data.email, data.password, username, data.name, data.profession, data.dateOfBirth, data.ageConfirmed);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  // Show email confirmation message
  if (emailSent) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-3">Check your email</h1>
        <p className="text-muted mb-6">
          A confirmation link has been sent to <strong className="text-text">{emailValue}</strong>.
          <br />
          Please confirm your email to login to your account.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Can&apos;t find the email?</strong> Check your spam folder or{" "}
            <button 
              onClick={() => setEmailSent(false)}
              className="text-primary hover:underline font-medium"
            >
              try again
            </button>
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={ROUTES.LOGIN}>Back to Sign In</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Create your account</h1>
        <p className="text-muted mt-1">Start your free mental wellness journey today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button variant="outline" type="button" className="gap-2"><Chrome className="h-4 w-4" />Google</Button>
        <Button variant="outline" type="button" className="gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Apple
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted">or with email</span></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Full name" type="text" placeholder="Alex Morgan" leftIcon={<User className="h-4 w-4" />} error={errors.name?.message} autoComplete="name" {...register("name")} />
        <Input label="Profession" type="text" placeholder="Student, Teacher, etc." leftIcon={<User className="h-4 w-4" />} error={errors.profession?.message} autoComplete="organization-title" {...register("profession")} />
        
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-text mb-2">
            Date of Birth
          </label>
          <Input 
            id="dateOfBirth"
            type="date" 
            error={errors.dateOfBirth?.message} 
            {...register("dateOfBirth")} 
          />
          <p className="text-xs text-muted mt-1">You must be 18 or older to use TalkFriendly</p>
        </div>

        <Input label="Email" type="email" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} autoComplete="email" {...register("email")} />
        <Input label="Password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-muted hover:text-text transition-colors" aria-label={showPassword ? "Hide" : "Show"}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message} autoComplete="new-password" {...register("password")} />
        <Input label="Confirm password" type="password" placeholder="Repeat password" leftIcon={<Lock className="h-4 w-4" />} error={errors.confirmPassword?.message} autoComplete="new-password" {...register("confirmPassword")} />

        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary mt-0.5" {...register("ageConfirmed")} />
          <span className="text-sm text-muted">
            I confirm that I am 18 years of age or older
          </span>
        </label>
        {errors.ageConfirmed && <p className="text-xs text-red-500 -mt-2">{errors.ageConfirmed.message}</p>}

        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary mt-0.5" {...register("agreeToTerms")} />
          <span className="text-sm text-muted">
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>
          </span>
        </label>
        {errors.agreeToTerms && <p className="text-xs text-red-500 -mt-2">{errors.agreeToTerms.message}</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600" role="alert">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link href={ROUTES.LOGIN} className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </motion.div>
  );
}
