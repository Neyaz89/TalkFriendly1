"use client";

import { useState } from "react";
import { reportService } from "@/services/report.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: 'user' | 'post' | 'comment' | 'message';
  entityId: string;
  entityTitle?: string;
}

const REPORT_REASONS = [
  'Harassment or bullying',
  'Hate speech',
  'Spam or scam',
  'Inappropriate content',
  'False information',
  'Violence or dangerous behavior',
  'Impersonation',
  'Privacy violation',
  'Other',
];

export function ReportDialog({
  open,
  onClose,
  entityType,
  entityId,
  entityTitle,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!selectedReason) {
      showToast('error', 'Please select a reason');
      return;
    }

    setIsSubmitting(true);

    try {
      await reportService.createReport({
        entity_type: entityType,
        entity_id: entityId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      showToast('success', 'Report submitted. We will review it shortly.');
      handleClose();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      showToast('error', error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setDescription("");
    onClose();
  };

  const getEntityLabel = () => {
    switch (entityType) {
      case 'user': return 'user';
      case 'post': return 'post';
      case 'comment': return 'comment';
      case 'message': return 'message';
      default: return 'content';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report {getEntityLabel()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info */}
          {entityTitle && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {entityTitle}
              </p>
            </div>
          )}

          {/* Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your report will be reviewed by our moderation team. False reports may result in account restrictions.
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Why are you reporting this {getEntityLabel()}?
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg border transition-all
                    ${selectedReason === reason
                      ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-600 dark:text-primary-300'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                  disabled={isSubmitting}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Additional details (Optional)
            </label>
            <Textarea
              placeholder="Provide any additional context that might help our review..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
