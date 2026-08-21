"use client";

/**
 * OTP verification form — uses useSearchParams so must be inside Suspense.
 */

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { ROUTES } from "@/constants";

export function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      await authService.verifyOtp({ email, otp: code });
      setIsVerified(true);
      setTimeout(() => router.push(ROUTES.DASHBOARD), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-text">Verified!</h2>
        <p className="text-muted mt-2">Taking you to your dashboard…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Check your email</h1>
        <p className="text-muted mt-1">
          We sent a 6-digit code to <strong className="text-text">{email}</strong>
        </p>
      </div>

      {/* OTP input grid */}
      <div
        className="flex gap-3 justify-between mb-6"
        onPaste={handlePaste}
      >
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-full aspect-square text-center text-2xl font-bold rounded-2xl border-2 border-border bg-white text-text transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-label={`Digit ${i + 1} of 6`}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4 text-center" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        className="w-full"
        size="lg"
        isLoading={isVerifying}
        disabled={otp.some((d) => !d)}
      >
        {isVerifying ? "Verifying…" : "Verify Code"}
      </Button>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link
          href={ROUTES.LOGIN}
          className="flex items-center gap-2 text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to sign in
        </Link>
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => setOtp(["", "", "", "", "", ""])}
        >
          Resend code
        </button>
      </div>

      <p className="text-center text-xs text-muted mt-6 bg-secondary rounded-xl p-3">
        Demo mode: any 6-digit code works (e.g. <strong>123456</strong>)
      </p>
    </motion.div>
  );
}
