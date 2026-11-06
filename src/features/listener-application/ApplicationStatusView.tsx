"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Calendar,
  User,
  Mail,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ListenerApplication } from "@/types/listener-application.types";

interface ApplicationStatusViewProps {
  application: ListenerApplication | null;
  history: any[];
}

export function ApplicationStatusView({ application, history }: ApplicationStatusViewProps) {
  const router = useRouter();

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Application Found
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't submitted a Listener application yet.
            </p>
            <Button
              onClick={() => router.push('/auth/register/listener-application')}
              size="lg"
            >
              Start Application
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Application Status
              </h1>
              <p className="text-gray-600">
                Track your Listener application progress
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bgColor}`}>
              {statusConfig.icon}
              <span className={`font-semibold ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className={`border-l-4 rounded-lg p-4 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
            <h3 className={`font-semibold mb-1 ${statusConfig.textColor}`}>
              {statusConfig.title}
            </h3>
            <p className={`text-sm ${statusConfig.textColor}`}>
              {statusConfig.description}
            </p>
          </div>
        </div>

        {/* Admin Feedback (if exists) */}
        {application.admin_notes && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Feedback from Admin
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {application.admin_notes}
              </p>
            </div>
          </div>
        )}

        {/* Resubmit Button (if additional info required or rejected) */}
        {(application.status === 'additional_info_required' || application.status === 'rejected') && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
            <p className="text-sm text-gray-600 mb-4">
              {application.status === 'additional_info_required'
                ? 'Please update your application with the requested information and resubmit for review.'
                : 'You can review the feedback and submit a new application if you wish to reapply.'}
            </p>
            <Button
              onClick={() => router.push('/auth/register/listener-application')}
              variant="default"
            >
              {application.status === 'additional_info_required' ? 'Update Application' : 'Submit New Application'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Application Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Application Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem
              icon={<User className="h-4 w-4" />}
              label="Full Name"
              value={application.full_legal_name}
            />
            <DetailItem
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={application.email}
            />
            <DetailItem
              icon={<FileText className="h-4 w-4" />}
              label="Professional Title"
              value={application.professional_title}
            />
            <DetailItem
              icon={<Calendar className="h-4 w-4" />}
              label="Submitted"
              value={application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'Draft'}
            />
            <DetailItem
              icon={<CheckCircle className="h-4 w-4" />}
              label="Years of Experience"
              value={`${application.years_of_experience} years`}
            />
            <DetailItem
              icon={<FileText className="h-4 w-4" />}
              label="Documents"
              value={`${application.verification_documents?.length || 0} uploaded`}
            />
          </div>
        </div>

        {/* Application Timeline */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Application Timeline</h3>
            <div className="space-y-4">
              {history.map((entry, index) => (
                <TimelineEntry key={entry.id} entry={entry} isLast={index === history.length - 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-1">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TimelineEntry({ entry, isLast }: { entry: any; isLast: boolean }) {
  const statusConfig = getStatusConfig(entry.status);
  
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bgColor}`}>
          {statusConfig.icon}
        </div>
        {!isLast && <div className="w-0.5 h-full bg-gray-200 mt-2" />}
      </div>
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-semibold ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(entry.created_at).toLocaleString()}
          </span>
        </div>
        {entry.admin_notes && (
          <p className="text-sm text-gray-600 mt-1">{entry.admin_notes}</p>
        )}
        {entry.admin && (
          <p className="text-xs text-gray-500 mt-1">
            Changed by: {entry.admin.full_name || entry.admin.username}
          </p>
        )}
      </div>
    </div>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, any> = {
    draft: {
      icon: <FileText className="h-5 w-5 text-gray-500" />,
      label: 'Draft',
      title: 'Application in Draft',
      description: 'Complete and submit your application to begin the review process.',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
    },
    pending_review: {
      icon: <Clock className="h-5 w-5 text-yellow-600" />,
      label: 'Pending Review',
      title: 'Application Under Review',
      description: 'Our team is currently reviewing your application. This typically takes 2-5 business days.',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-300',
    },
    additional_info_required: {
      icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
      label: 'Additional Info Required',
      title: 'More Information Needed',
      description: 'Please review the feedback below and update your application with the requested information.',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-300',
    },
    approved: {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      label: 'Approved',
      title: 'Application Approved!',
      description: 'Congratulations! Your application has been approved. You can now start accepting bookings.',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
    },
    rejected: {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      label: 'Rejected',
      title: 'Application Not Approved',
      description: 'Unfortunately, your application was not approved. Please review the feedback below.',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
    },
  };

  return configs[status] || configs.draft;
}
