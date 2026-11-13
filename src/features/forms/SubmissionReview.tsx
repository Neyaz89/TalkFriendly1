"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSubmission, FormSubmissionStatus } from "@/types/support-form.types";
import { Avatar } from "@/components/ui/avatar";
import { CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { formatDistanceToNow } from "date-fns";

interface SubmissionReviewProps {
  formId: string;
}

export function SubmissionReview({ formId }: SubmissionReviewProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<FormSubmissionStatus>('pending');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, [formId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/forms/submissions?form_id=${formId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submissions');
      }

      setSubmissions(data.submissions || []);
      setFormTitle(data.form?.title || 'Untitled Form');
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      showError(error.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/forms/review-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: selectedSubmission.id,
          status: reviewStatus,
          notes: reviewNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to review submission');
      }

      success('Submission reviewed successfully');
      setSelectedSubmission(null);
      setReviewNotes('');
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error reviewing submission:', error);
      showError(error.message || 'Failed to review submission');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: FormSubmissionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reviewing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: FormSubmissionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (selectedSubmission) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSubmission(null)}
            >
              ← Back to Submissions
            </Button>
            <h2 className="text-2xl font-bold mt-2">Review Submission</h2>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(selectedSubmission.status)}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSubmission.status)}`}>
              {selectedSubmission.status}
            </span>
          </div>
        </div>

        {/* Submitter Info */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={selectedSubmission.submitter?.avatar_url}
              name={selectedSubmission.submitter?.full_name || selectedSubmission.submitter?.username}
              size="md"
            />
            <div>
              <p className="font-semibold">
                {selectedSubmission.submitter?.full_name || selectedSubmission.submitter?.username}
              </p>
              <p className="text-sm text-gray-500">
                Submitted {formatDistanceToNow(new Date(selectedSubmission.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Card>

        {/* Responses */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Responses</h3>
          <div className="space-y-4">
            {selectedSubmission.responses?.map((response: any, index: number) => {
              // Find the field label from form fields
              const fieldLabel = `Field ${index + 1}`;
              
              return (
                <div key={response.field_id}>
                  <Label className="text-sm font-medium">{fieldLabel}</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    {Array.isArray(response.value) 
                      ? response.value.join(', ')
                      : String(response.value || '-')}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Review Section */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Update Status</h3>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select
                value={reviewStatus}
                onValueChange={(value: FormSubmissionStatus) => setReviewStatus(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about this submission..."
                className="mt-1"
                rows={4}
              />
            </div>

            {selectedSubmission.notes && (
              <div>
                <Label>Previous Notes</Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-sm">
                  {selectedSubmission.notes}
                </div>
              </div>
            )}

            <Button onClick={handleReviewSubmission} disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Submission'
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{formTitle}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
        </p>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No submissions yet for this form
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <Card
              key={submission.id}
              className="p-4 cursor-pointer hover:border-primary-500 transition-colors"
              onClick={() => {
                setSelectedSubmission(submission);
                setReviewStatus(submission.status);
                setReviewNotes(submission.notes || '');
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={submission.submitter?.avatar_url}
                    name={submission.submitter?.full_name || submission.submitter?.username}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">
                      {submission.submitter?.full_name || submission.submitter?.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(submission.status)}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
