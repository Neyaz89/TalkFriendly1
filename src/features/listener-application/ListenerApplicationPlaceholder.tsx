"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileCheck, ArrowLeft, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Placeholder for Listener Application Form
 * This will be fully implemented in Phase 4
 */
export function ListenerApplicationPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto text-center"
    >
      {/* Icon */}
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
        <Stethoscope className="h-10 w-10 text-green-600" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-text mb-3">
        Professional Listener Application
      </h1>
      
      {/* Description */}
      <p className="text-lg text-muted mb-8 max-w-xl mx-auto">
        Complete your professional application to become a verified Listener on TalkFriendly.
      </p>

      {/* Coming Soon Notice */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
        <FileCheck className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-yellow-900 mb-2">
          Application Form Coming in Phase 4
        </h2>
        <p className="text-sm text-yellow-800">
          The comprehensive Listener application form with professional credential verification
          and document upload will be implemented in Phase 4 of the development roadmap.
        </p>
      </div>

      {/* What to Expect */}
      <div className="text-left bg-background border border-border rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-text mb-4">What the application will include:</h3>
        <ul className="space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Personal and professional information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Educational background and qualifications</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Professional license and credential verification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Document upload (licenses, certificates, degrees)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Specializations and areas of expertise</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Admin review and verification process</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/register/role-select">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Role Selection
          </Link>
        </Button>
        
        <p className="text-sm text-muted">
          For now, you can{" "}
          <Link href="/auth/register?role=user" className="text-primary hover:underline font-medium">
            create a Normal User account
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
