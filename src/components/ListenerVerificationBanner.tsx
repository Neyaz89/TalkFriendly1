"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VerificationStatus } from "@/lib/listener-verification";

interface ListenerVerificationBannerProps {
  status: VerificationStatus;
  hasApplication: boolean;
}

export function ListenerVerificationBanner({ status, hasApplication }: ListenerVerificationBannerProps) {
  const router = useRouter();

  // Don't show banner for verified listeners
  if (status === 'verified' || status === 'approved') {
    return null;
  }

  const config = getBannerConfig(status, hasApplication);

  return (
    <div className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-6 mb-6`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${config.textColor}`}>
            {config.title}
          </h3>
          <p className={`text-sm mb-4 ${config.textColor}`}>
            {config.description}
          </p>
          <div className="flex flex-wrap gap-3">
            {config.buttons.map((button: any, index: number) => (
              <Button
                key={index}
                onClick={() => router.push(button.href)}
                variant={button.variant}
                size="sm"
              >
                {button.label}
                {button.showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getBannerConfig(status: VerificationStatus, hasApplication: boolean) {
  if (!hasApplication) {
    return {
      icon: <FileText className="h-6 w-6" />,
      title: 'Complete Your Listener Application',
      description: 'To start accepting bookings, you need to complete and submit your professional listener application. This includes uploading your credentials and professional documents.',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
      buttons: [
        { label: 'Start Application', href: '/auth/register/listener-application', variant: 'default' as const, showArrow: true },
      ],
    };
  }

  const configs: Record<VerificationStatus, any> = {
    draft: {
      icon: <FileText className="h-6 w-6" />,
      title: 'Application in Draft',
      description: 'Your listener application is incomplete. Complete and submit your application to begin the verification process.',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-900',
      buttons: [
        { label: 'Complete Application', href: '/auth/register/listener-application', variant: 'default' as const, showArrow: true },
      ],
    },
    pending_review: {
      icon: <Clock className="h-6 w-6" />,
      title: 'Application Under Review',
      description: 'Your application is being reviewed by our team. This typically takes 2-5 business days. You cannot accept bookings until your application is approved.',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
      buttons: [
        { label: 'View Status', href: '/listener-application', variant: 'outline' as const, showArrow: false },
      ],
    },
    additional_info_required: {
      icon: <AlertCircle className="h-6 w-6" />,
      title: 'Additional Information Required',
      description: 'Our team needs more information to process your application. Please review the feedback and update your application.',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-900',
      buttons: [
        { label: 'View Feedback', href: '/listener-application', variant: 'default' as const, showArrow: true },
        { label: 'Update Application', href: '/auth/register/listener-application', variant: 'outline' as const, showArrow: false },
      ],
    },
    rejected: {
      icon: <XCircle className="h-6 w-6" />,
      title: 'Application Not Approved',
      description: 'Unfortunately, your application was not approved. Please review the feedback to understand why and consider reapplying.',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
      buttons: [
        { label: 'View Feedback', href: '/listener-application', variant: 'default' as const, showArrow: true },
      ],
    },
    unverified: {
      icon: <AlertCircle className="h-6 w-6" />,
      title: 'Verification Required',
      description: 'You need to complete the listener verification process before you can accept bookings.',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-900',
      buttons: [
        { label: 'Start Verification', href: '/auth/register/listener-application', variant: 'default' as const, showArrow: true },
      ],
    },
    verified: { icon: null, title: '', description: '', bgColor: '', borderColor: '', iconColor: '', textColor: '', buttons: [] },
    approved: { icon: null, title: '', description: '', bgColor: '', borderColor: '', iconColor: '', textColor: '', buttons: [] },
  };

  return configs[status] || configs.unverified;
}
