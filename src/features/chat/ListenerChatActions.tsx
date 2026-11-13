"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BookingFormCreator, BookingFormData } from "./BookingFormCreator";

interface ListenerChatActionsProps {
  conversationId: string;
  isListener: boolean;
  onFormSent?: () => void;
  onFeedbackRequested?: () => void;
}

/**
 * Special chat actions only available to listeners.
 * Displays buttons to send support forms and request feedback.
 */
export function ListenerChatActions({
  conversationId,
  isListener,
  onFormSent,
  onFeedbackRequested,
}: ListenerChatActionsProps) {
  const [sendingForm, setSendingForm] = useState(false);
  const [requestingFeedback, setRequestingFeedback] = useState(false);
  const [showBookingFormCreator, setShowBookingFormCreator] = useState(false);
  const { success, error: showError } = useToast();

  // Only show for listeners
  if (!isListener) {
    return null;
  }

  const handleSendBookingForm = async (formData: BookingFormData) => {
    setSendingForm(true);
    try {
      const response = await fetch('/api/messages/send-booking-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send booking form');
      }

      success('Booking form sent successfully!');
      setShowBookingFormCreator(false);
      onFormSent?.();
    } catch (error: any) {
      console.error('Error sending booking form:', error);
      showError(error.message || 'Failed to send booking form');
    } finally {
      setSendingForm(false);
    }
  };

  const handleRequestFeedback = async () => {
    setRequestingFeedback(true);
    try {
      const response = await fetch('/api/messages/send-feedback-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          // Use default categories and 7-day expiration
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request feedback');
      }

      success('Feedback request sent successfully');
      onFeedbackRequested?.();
    } catch (error: any) {
      console.error('Error requesting feedback:', error);
      
      // Provide helpful error messages
      if (error.message.includes('Only listeners')) {
        showError('Only listeners can request feedback');
      } else if (error.message.includes('completed sessions')) {
        showError('You can only request feedback for completed sessions');
      } else {
        showError(error.message || 'Failed to request feedback');
      }
    } finally {
      setRequestingFeedback(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={sendingForm || requestingFeedback}
            >
              Listener Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Listener Tools
            </div>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => setShowBookingFormCreator(true)}
              disabled={sendingForm || requestingFeedback}
              className="cursor-pointer"
            >
              {sendingForm ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Send Booking Form
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleRequestFeedback}
              disabled={sendingForm || requestingFeedback}
              className="cursor-pointer"
            >
              {requestingFeedback ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Star className="mr-2 h-4 w-4" />
              )}
              Request Feedback
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Booking Form Creator */}
      <BookingFormCreator
        isOpen={showBookingFormCreator}
        onClose={() => setShowBookingFormCreator(false)}
        onSend={handleSendBookingForm}
        isSending={sendingForm}
      />
    </>
  );
}
