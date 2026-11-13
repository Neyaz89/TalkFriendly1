"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface TimeSlot {
  date: string;
  time: string;
}

interface BookingFormPayload {
  booking_form_id: string;
  title: string;
  description?: string;
  available_slots: TimeSlot[];
  duration_pricing: Record<string, number>; // in cents
  support_areas: string[];
  booking_id?: string; // Set after user books
}

interface BookingFormMessageProps {
  payload: BookingFormPayload;
  isOwnMessage: boolean;
  onBook?: () => void;
}

export function BookingFormMessage({
  payload,
  isOwnMessage,
  onBook,
}: BookingFormMessageProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [supportDetails, setSupportDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already booked, show confirmation
  if (payload.booking_id) {
    return (
      <Card className="p-4 max-w-md bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-1">
              Session Booked!
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your booking has been submitted. The listener will confirm your session shortly.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleSubmit = async () => {
    // Validate
    if (!selectedSlot) {
      setError("Please select a time slot");
      return;
    }
    if (!selectedDuration) {
      setError("Please select a duration");
      return;
    }
    if (!selectedArea) {
      setError("Please select a support area");
      return;
    }
    if (!supportDetails.trim()) {
      setError("Please describe what you need help with");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_form_id: payload.booking_form_id,
          selected_slot: selectedSlot,
          selected_duration: parseInt(selectedDuration),
          support_area: selectedArea,
          support_details: supportDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      // Trigger refresh
      onBook?.();
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatSlotDisplay = (slot: TimeSlot) => {
    try {
      const date = new Date(slot.date + 'T' + slot.time);
      return format(date, "EEE, MMM d 'at' h:mm a");
    } catch {
      return `${slot.date} at ${slot.time}`;
    }
  };

  // Convert cents to dollars for display
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Get available durations (those with pricing > 0)
  const availableDurations = Object.entries(payload.duration_pricing)
    .filter(([_, price]) => price > 0)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

  const selectedPrice = selectedDuration
    ? payload.duration_pricing[selectedDuration]
    : 0;

  return (
    <Card className={`p-4 max-w-md ${isOwnMessage ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-gray-800'}`}>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h4 className="font-semibold text-base mb-1">📅 {payload.title}</h4>
          {payload.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {payload.description}
            </p>
          )}
        </div>

        {/* Only show form if not own message */}
        {!isOwnMessage && (
          <>
            {/* Time Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Choose a time slot:
              </label>
              <div className="space-y-2">
                {payload.available_slots.map((slot, index) => (
                  <label
                    key={index}
                    className={`
                      flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                      ${
                        selectedSlot === slot
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="time_slot"
                      checked={selectedSlot === slot}
                      onChange={() => setSelectedSlot(slot)}
                      className="mr-3"
                    />
                    <span className="text-sm">{formatSlotDisplay(slot)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration & Pricing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Choose duration:
              </label>
              <div className="space-y-2">
                {availableDurations.map(([duration, price]) => (
                  <label
                    key={duration}
                    className={`
                      flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors
                      ${
                        selectedDuration === duration
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="duration"
                        checked={selectedDuration === duration}
                        onChange={() => setSelectedDuration(duration)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">{duration} minutes</span>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      {formatPrice(price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Support Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What support do you need?
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select an area...</option>
                {payload.support_areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Support Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tell me more about what you'd like to discuss:
              </label>
              <textarea
                value={supportDetails}
                onChange={(e) => setSupportDetails(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                placeholder="Describe what you need help with..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Total & Submit */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                {selectedPrice > 0 && (
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    Total: {formatPrice(selectedPrice)}
                  </div>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedSlot || !selectedDuration || !selectedArea || !supportDetails.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Book Session'
                )}
              </Button>
            </div>
          </>
        )}

        {/* If own message, just show summary */}
        {isOwnMessage && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>✓ Booking form sent</p>
            <p className="text-xs mt-1">
              {payload.available_slots.length} time slots • {availableDurations.length} duration options
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
