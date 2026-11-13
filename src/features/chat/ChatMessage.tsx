"use client";

import { useState, useEffect } from "react";
import type { MessageWithSender } from "@/types/chat.types";
import type { SupportFormMessagePayload } from "@/types/support-form.types";
import type { FeedbackMessagePayload } from "@/types/feedback.types";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { Check, CheckCheck, FileText, MessageSquareStar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSubmission } from "@/features/forms/FormSubmission";
import { FeedbackSubmission } from "@/features/feedback/FeedbackSubmission";

interface ChatMessageProps {
  message: MessageWithSender;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuth();
  const [showFullTime, setShowFullTime] = useState(false);
  const [showFormSubmission, setShowFormSubmission] = useState(false);
  const [showFeedbackSubmission, setShowFeedbackSubmission] = useState(false);
  
  const isOwnMessage = message.sender_id === user?.id;
  const sender = message.sender;

  // Debug logging
  useEffect(() => {
    if (sender && !isOwnMessage) {
      console.log('ChatMessage - Sender:', sender);
      console.log('ChatMessage - Account Type:', sender.account_type);
      console.log('ChatMessage - Is Verified:', sender.is_verified);
    }
  }, [sender, isOwnMessage]);

  // Render special message types
  const renderMessageContent = () => {
    // Voice Message
    if (message.message_type === 'voice' && message.voice_url) {
      return (
        <VoiceMessagePlayer
          url={message.voice_url}
          duration={message.voice_duration || 0}
          isOwnMessage={isOwnMessage}
        />
      );
    }

    // Support Form Request
    if (message.message_type === 'support_form_request') {
      try {
        const formPayload: SupportFormMessagePayload = JSON.parse(message.content || '{}');
        return (
          <>
            <Card className={`p-4 ${isOwnMessage ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">Support Form Request</h4>
                  <p className="text-sm font-medium mb-1">{formPayload.title}</p>
                  {formPayload.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {formPayload.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mb-3">
                    {formPayload.fields?.length || 0} fields to complete
                  </p>
                  {!isOwnMessage && !formPayload.submission_id && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => setShowFormSubmission(true)}
                    >
                      Fill Out Form
                    </Button>
                  )}
                  {formPayload.submission_id && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCheck className="h-3 w-3" />
                      Form submitted
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Form Submission Dialog */}
            {!isOwnMessage && !formPayload.submission_id && (
              <Dialog open={showFormSubmission} onOpenChange={setShowFormSubmission}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Complete Form</DialogTitle>
                    <DialogDescription>
                      Please fill out all required fields
                    </DialogDescription>
                  </DialogHeader>
                  <FormSubmission
                    formPayload={formPayload}
                    messageId={message.id}
                    onSubmitSuccess={() => {
                      setShowFormSubmission(false);
                      // Reload the page to show updated message
                      window.location.reload();
                    }}
                    onCancel={() => setShowFormSubmission(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </>
        );
      } catch (error) {
        console.error('Error parsing form payload:', error);
        return (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="h-4 w-4" />
            Invalid form data
          </div>
        );
      }
    }

    // Feedback Request
    if (message.message_type === 'feedback_request') {
      try {
        const feedbackPayload: FeedbackMessagePayload = JSON.parse(message.content || '{}');
        const isExpired = feedbackPayload.expires_at 
          ? new Date(feedbackPayload.expires_at) < new Date()
          : false;

        return (
          <>
            <Card className={`p-4 ${isOwnMessage ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
              <div className="flex items-start gap-3">
                <MessageSquareStar className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">Feedback Request</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {feedbackPayload.session_id 
                      ? 'Please share your feedback about our recent session'
                      : 'Your listener would appreciate your feedback'
                    }
                  </p>
                  {feedbackPayload.categories && feedbackPayload.categories.length > 0 && (
                    <p className="text-xs text-gray-500 mb-3">
                      Rating categories: {feedbackPayload.categories.join(', ')}
                    </p>
                  )}
                  {isExpired ? (
                    <p className="text-xs text-gray-400 italic">
                      This feedback request has expired
                    </p>
                  ) : (
                    <>
                      {!isOwnMessage && !feedbackPayload.feedback_response_id && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => setShowFeedbackSubmission(true)}
                        >
                          Provide Feedback
                        </Button>
                      )}
                      {feedbackPayload.feedback_response_id && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" />
                          Feedback submitted
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Feedback Submission Dialog */}
            {!isOwnMessage && !feedbackPayload.feedback_response_id && !isExpired && (
              <Dialog open={showFeedbackSubmission} onOpenChange={setShowFeedbackSubmission}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Provide Feedback</DialogTitle>
                    <DialogDescription>
                      Your feedback helps improve the quality of service
                    </DialogDescription>
                  </DialogHeader>
                  <FeedbackSubmission
                    feedbackPayload={feedbackPayload}
                    onSubmitSuccess={() => {
                      setShowFeedbackSubmission(false);
                      // Reload the page to show updated message
                      window.location.reload();
                    }}
                    onCancel={() => setShowFeedbackSubmission(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </>
        );
      } catch (error) {
        console.error('Error parsing feedback payload:', error);
        return (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="h-4 w-4" />
            Invalid feedback data
          </div>
        );
      }
    }

    // System Message
    if (message.message_type === 'system') {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center">
          {message.content}
        </p>
      );
    }

    // Default: Text, Image, File
    return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar (only for other user's messages) */}
      {!isOwnMessage && (
        <Avatar
          src={sender?.avatar_url || undefined}
          name={sender?.full_name || sender?.username || 'User'}
          size="sm"
          className="flex-shrink-0"
        />
      )}

      {/* Message Content */}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender Name (only for other user's messages) */}
        {!isOwnMessage && (
          <span className="text-xs text-gray-600 dark:text-gray-400 px-3 flex items-center gap-1.5">
            <span>{sender?.full_name || sender?.username || 'Unknown'}</span>
            <UserRoleBadge 
              accountType={sender?.account_type as any}
              isVerified={sender?.is_verified}
              size="sm"
            />
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={`
            rounded-2xl px-4 py-2 break-words
            ${message.message_type === 'support_form_request' || message.message_type === 'feedback_request'
              ? '' // No background for card-based messages
              : isOwnMessage
                ? 'bg-primary-500 text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
            }
          `}
        >
          {renderMessageContent()}
        </div>

        {/* Time and Status */}
        <div className="flex items-center gap-1.5 px-3">
          <button
            onClick={() => setShowFullTime(!showFullTime)}
            className="text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
          >
            {showFullTime
              ? format(new Date(message.created_at), 'MMM d, yyyy h:mm a')
              : formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
            }
          </button>

          {/* Read Status (only for own messages) */}
          {isOwnMessage && (
            <span className="text-gray-500 dark:text-gray-500">
              {message.is_read ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary-500" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
