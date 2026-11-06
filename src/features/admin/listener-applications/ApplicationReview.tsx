"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Briefcase,
  Shield,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Languages,
  Award,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ListenerApplication } from "@/types/listener-application.types";

interface ApplicationReviewProps {
  application: ListenerApplication;
  history: any[];
}

export function ApplicationReview({ application, history }: ApplicationReviewProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'request_info' | null>(null);
  const [feedback, setFeedback] = useState('');

  const canTakeAction = application.status === 'pending_review' || application.status === 'additional_info_required';

  const handleAction = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/listener-applications/${application.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedAction,
          admin_notes: feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process action');
      }

      // Refresh the page
      router.refresh();
      setShowActionModal(false);
      setFeedback('');
      setSelectedAction(null);
    } catch (error) {
      console.error('Error processing action:', error);
      alert('Failed to process action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionModal = (action: 'approve' | 'reject' | 'request_info') => {
    setSelectedAction(action);
    setFeedback('');
    setShowActionModal(true);
  };

  const statusConfig = getStatusConfig(application.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/listener-applications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
            <p className="text-gray-600 mt-1">{application.full_legal_name}</p>
          </div>
        </div>
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          ${statusConfig.bgColor}
        `}>
          {statusConfig.icon}
          <span className={`font-semibold ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {canTakeAction && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Review Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => openActionModal('approve')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Approve Application
            </Button>
            <Button
              onClick={() => openActionModal('request_info')}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              Request More Information
            </Button>
            <Button
              onClick={() => openActionModal('reject')}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Reject Application
            </Button>
          </div>
        </div>
      )}

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Section
            icon={<User className="h-5 w-5" />}
            title="Personal Information"
            items={[
              { icon: <User />, label: "Full Name", value: application.full_legal_name },
              { icon: <Mail />, label: "Email", value: application.email },
              { icon: <Phone />, label: "Phone", value: application.phone },
              { icon: <MapPin />, label: "Location", value: `${application.city}, ${application.state_province || ''} ${application.country}` },
            ]}
          />

          {/* Professional Information */}
          <Section
            icon={<Briefcase className="h-5 w-5" />}
            title="Professional Information"
            items={[
              { icon: <Briefcase />, label: "Title", value: application.professional_title },
              { icon: <Award />, label: "Qualifications", value: application.qualifications?.join(", ") },
              { icon: <FileText />, label: "Institution", value: application.educational_institution },
              { icon: <Calendar />, label: "Experience", value: `${application.years_of_experience} years` },
              { icon: <Briefcase />, label: "Specializations", value: application.specialization?.join(", ") },
              { icon: <Languages />, label: "Languages", value: application.languages_spoken?.join(", ") },
            ]}
          />

          {/* Professional Bio */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Professional Bio
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {application.professional_bio}
            </p>
          </div>

          {/* License Information */}
          {(application.license_number || application.licensing_authority) && (
            <Section
              icon={<Shield className="h-5 w-5" />}
              title="License Information"
              items={[
                { icon: <Shield />, label: "License Number", value: application.license_number || "Not provided" },
                { icon: <FileText />, label: "Authority", value: application.licensing_authority || "Not provided" },
                { icon: <MapPin />, label: "Jurisdiction", value: `${application.license_state_province || ''} ${application.license_country || ''}`.trim() || "Not provided" },
                { icon: <Calendar />, label: "Expiry Date", value: application.license_expiry_date ? new Date(application.license_expiry_date).toLocaleDateString() : "Not provided" },
              ]}
            />
          )}

          {/* Verification Documents */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Verification Documents
            </h3>
            {application.verification_documents && application.verification_documents.length > 0 ? (
              <div className="space-y-2">
                {application.verification_documents.map((doc: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.type} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1.5" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No documents uploaded</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Timeline
            </h3>
            <div className="space-y-4">
              {history.map((entry, index) => {
                const config = getStatusConfig(entry.status);
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                        {config.icon}
                      </div>
                      {index < history.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className={`text-sm font-semibold ${config.textColor}`}>
                        {config.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                      {entry.admin_notes && (
                        <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                          {entry.admin_notes}
                        </p>
                      )}
                      {entry.admin && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {entry.admin.full_name || entry.admin.username}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Application Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Application ID</p>
                <p className="font-mono text-gray-900 text-xs mt-0.5">{application.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Submitted</p>
                <p className="text-gray-900 mt-0.5">
                  {application.submitted_at
                    ? new Date(application.submitted_at).toLocaleString()
                    : 'Not submitted'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="text-gray-900 mt-0.5">
                  {new Date(application.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <ActionModal
          action={selectedAction!}
          feedback={feedback}
          setFeedback={setFeedback}
          onConfirm={handleAction}
          onCancel={() => setShowActionModal(false)}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}

// Section component for grouped information
function Section({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: Array<{ icon: React.ReactNode; label: string; value?: string }>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="text-gray-400 mt-1">{item.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
              <p className="text-sm font-medium text-gray-900 break-words">{item.value || "—"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Action Modal component
function ActionModal({
  action,
  feedback,
  setFeedback,
  onConfirm,
  onCancel,
  isProcessing,
}: {
  action: 'approve' | 'reject' | 'request_info';
  feedback: string;
  setFeedback: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}) {
  const config = {
    approve: {
      title: 'Approve Application',
      description: 'This will approve the application and allow the listener to start accepting bookings.',
      buttonText: 'Approve',
      buttonClass: 'bg-green-600 hover:bg-green-700',
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
    },
    reject: {
      title: 'Reject Application',
      description: 'This will reject the application. Please provide clear feedback explaining the reason.',
      buttonText: 'Reject',
      buttonClass: 'bg-red-600 hover:bg-red-700',
      icon: <XCircle className="h-6 w-6 text-red-600" />,
    },
    request_info: {
      title: 'Request More Information',
      description: 'Request additional information from the applicant. Specify what information is needed.',
      buttonText: 'Send Request',
      buttonClass: 'bg-orange-600 hover:bg-orange-700',
      icon: <AlertCircle className="h-6 w-6 text-orange-600" />,
    },
  };

  const currentConfig = config[action];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          {currentConfig.icon}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{currentConfig.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{currentConfig.description}</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {action === 'approve' ? 'Approval Notes (optional)' : 'Feedback / Notes'}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder={
              action === 'approve'
                ? 'Add any internal notes...'
                : 'Provide clear feedback...'
            }
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 ${currentConfig.buttonClass}`}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : currentConfig.buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, any> = {
    draft: {
      icon: <FileText className="h-4 w-4 text-gray-600" />,
      label: 'Draft',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
    },
    pending_review: {
      icon: <Clock className="h-4 w-4 text-yellow-600" />,
      label: 'Pending Review',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    },
    additional_info_required: {
      icon: <AlertCircle className="h-4 w-4 text-orange-600" />,
      label: 'Info Required',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    },
    approved: {
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      label: 'Approved',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    rejected: {
      icon: <XCircle className="h-4 w-4 text-red-600" />,
      label: 'Rejected',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
  };

  return configs[status] || configs.draft;
}
