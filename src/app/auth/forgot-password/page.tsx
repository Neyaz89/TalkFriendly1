"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { ROUTES } from "@/constants";

const schema = z.object({ email: z.string().email("Please enter a valid email") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await authService.forgotPassword(data);
    setSent(true);
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Check your inbox</h2>
        <p className="text-muted mb-8">We sent a password reset link to <strong>{getValues("email")}</strong></p>
        <Button asChild className="w-full" size="lg">
          <Link href={ROUTES.LOGIN}>Back to sign in</Link>
        </Button>
        <p className="text-sm text-muted mt-4">Didn&apos;t receive it? <button type="button" onClick={() => setSent(false)} className="text-primary hover:underline">Try again</button></p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Reset your password</h1>
        <p className="text-muted mt-1">Enter your email and we&apos;ll send you a reset link.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register("email")} />
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>Send reset link</Button>
      </form>
      <div className="mt-6">
        <Link href={ROUTES.LOGIN} className="flex items-center gap-2 text-sm text-muted hover:text-text transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to sign in
        </Link>
      </div>
    </motion.div>
  );
}
