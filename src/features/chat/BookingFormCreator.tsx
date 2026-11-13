"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, Calendar, Clock, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TimeSlot {
  date: string;
  time: string;
}

interface DurationPricing {
  [key: string]: number; // duration in minutes: price in dollars
}

interface BookingFormCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (formData: BookingFormData) => Promise<void>;
  isSending: boolean;
}

export interface BookingFormData {
  title: string;
  description: string;
  available_slots: TimeSlot[];
  duration_pricing: DurationPricing;
  support_areas: string[];
}

const DEFAULT_SUPPORT_AREAS = [
  "Anxiety",
  "Depression",
  "Stress Management",
  "Relationships",
  "Career Counseling",
  "Self-Esteem",
  "Grief & Loss",
  "Other"
];

export function BookingFormCreator({
  isOpen,
  onClose,
  onSend,
  isSending,
}: BookingFormCreatorProps) {
  const [title, setTitle] = useState("Book a Session with Me");
  const [description, setDescription] = useState("I'm here to support you on your mental health journey. Choose a time that works for you.");
  const [slots, setSlots] = useState<TimeSlot[]>([{ date: "", time: "" }]);
  const [pricing, setPricing] = useState<DurationPricing>({
    "15": 25,
    "30": 45,
    "45": 65,
    "60": 80,
  });
  const [supportAreas] = useState<string[]>(DEFAULT_SUPPORT_AREAS);

  const addSlot = () => {
    setSlots([...slots, { date: "", time: "" }]);
  };

  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index: number, field: "date" | "time", value: string) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const updatePricing = (duration: string, price: number) => {
    setPricing({ ...pricing, [duration]: price });
  };

  const handleSend = async () => {
    // Validate
    const validSlots = slots.filter(s => s.date && s.time);
    if (validSlots.length === 0) {
      alert("Please add at least one time slot");
      return;
    }

    if (!title.trim()) {
      alert("Please add a title");
      return;
    }

    // Check if at least one pricing is set
    const hasPricing = Object.values(pricing).some(p => p > 0);
    if (!hasPricing) {
      alert("Please set pricing for at least one duration");
      return;
    }

    const formData: BookingFormData = {
      title: title.trim(),
      description: description.trim(),
      available_slots: validSlots,
      duration_pricing: pricing,
      support_areas: supportAreas,
    };

    await onSend(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Session Booking Form</DialogTitle>
          <DialogDescription>
            Set your availability and pricing, then send to the user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Form Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              placeholder="Book a Session with Me"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              placeholder="Tell the user what to expect..."
            />
          </div>

          {/* Available Time Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Available Time Slots
            </label>
            <div className="space-y-2">
              {slots.map((slot, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={slot.date}
                    onChange={(e) => updateSlot(index, "date", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="time"
                    value={slot.time}
                    onChange={(e) => updateSlot(index, "time", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSlot(index)}
                    disabled={slots.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSlot}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </div>
          </div>

          {/* Duration & Pricing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Duration & Pricing (USD)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["15", "30", "45", "60"].map((duration) => (
                <div key={duration} className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <span className="text-sm font-medium w-20">{duration} mins</span>
                  <div className="flex-1 flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={pricing[duration] || ""}
                      onChange={(e) => updatePricing(duration, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support Areas Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Support Areas (User will choose one)
            </label>
            <div className="flex flex-wrap gap-2">
              {supportAreas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending..." : "Send to User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
