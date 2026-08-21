"use client";

/**
 * Multi-step booking flow for listener sessions.
 * Steps: Choose Date → Choose Time → Session Type → Confirmation → Success
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Video, Mic } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { listenerService } from "@/services/listener.service";
import { bookingService } from "@/services/booking.service";
import type { Listener, BookingSlot, Booking } from "@/types";
import { ROUTES, SESSION_DURATIONS } from "@/constants";
import { formatDate, formatPrice, formatTime } from "@/lib/utils";
import { addDays, format } from "date-fns";

type Step = "date" | "time" | "type" | "confirm" | "success";

export function BookingFlow({ listenerId }: { listenerId: string }) {
  const router = useRouter();
  const [listener, setListener] = useState<Listener | null>(null);
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"audio" | "video">("video");
  const [duration, setDuration] = useState(60);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1));

  useEffect(() => {
    listenerService.getListenerById(listenerId).then(setListener);
  }, [listenerId]);

  useEffect(() => {
    if (selectedDate) {
      void bookingService.getAvailableSlots().then(setAvailableSlots);
    }
  }, [selectedDate, listenerId]);

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    setIsLoading(true);
    try {
      const b = await bookingService.createBooking({ listenerId, date: selectedDate, startTime: selectedTime, duration, sessionType });
      setBooking(b);
      setStep("success");
    } finally { setIsLoading(false); }
  };

  if (!listener) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;

  const price = formatPrice(Math.round((listener.pricing.perSession * duration) / 60));

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={ROUTES.LISTENER(listenerId)} className="p-2 rounded-xl hover:bg-secondary text-muted hover:text-text transition-colors" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-text">Book a Session</h1>
      </div>

      {/* Listener header */}
      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 items-center">
          <Avatar src={listener.avatar} name={listener.name} size="lg" />
          <div>
            <p className="font-semibold text-text">{listener.name}</p>
            <p className="text-xs text-muted">{listener.title}</p>
          </div>
        </CardContent>
      </Card>

      {/* Steps progress */}
      <div className="flex items-center gap-2 mb-8">
        {(["date", "time", "type", "confirm"] as const).map((s, i) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step === s || (["time", "type", "confirm", "success"].includes(step) && i === 0) || (["type", "confirm", "success"].includes(step) && i <= 1) || (["confirm", "success"].includes(step) && i <= 2) ? "bg-primary-500 text-white" : "bg-gray-100 text-muted"}`}>
              {i + 1}
            </div>
            {i < 3 && <div className="flex-1 h-0.5 bg-gray-100 rounded" />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "date" && (
          <motion.div key="date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-semibold text-text mb-4">Choose a date</h2>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {dates.map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const isSelected = selectedDate === dateStr;
                return (
                  <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all ${isSelected ? "bg-primary-500 border-primary-500 text-white" : "border-border hover:border-primary/50 text-text"}`}>
                    <span className={`text-xs ${isSelected ? "text-primary-100" : "text-muted"}`}>{format(date, "EEE")}</span>
                    <span className="text-sm font-semibold mt-0.5">{format(date, "d")}</span>
                  </button>
                );
              })}
            </div>
            <Button onClick={() => setStep("time")} disabled={!selectedDate} className="w-full gap-2">Next <ArrowRight className="h-4 w-4" /></Button>
          </motion.div>
        )}

        {step === "time" && (
          <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-semibold text-text mb-1">Choose a time</h2>
            <p className="text-sm text-muted mb-4">{selectedDate && formatDate(selectedDate, "EEEE, MMMM d")}</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {availableSlots.map((slot) => (
                <button key={slot.time} disabled={!slot.isAvailable} onClick={() => setSelectedTime(slot.time)}
                  className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${selectedTime === slot.time ? "bg-primary-500 border-primary-500 text-white" : slot.isAvailable ? "border-border hover:border-primary/50 text-text" : "border-border text-gray-200 cursor-not-allowed bg-gray-50"}`}>
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("date")} className="flex-1">Back</Button>
              <Button onClick={() => setStep("type")} disabled={!selectedTime} className="flex-1 gap-2">Next <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        )}

        {step === "type" && (
          <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-semibold text-text mb-4">Session type & duration</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(["audio", "video"] as const).map((type) => (
                <button key={type} onClick={() => setSessionType(type)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${sessionType === type ? "bg-primary-50 border-primary-400" : "border-border hover:border-primary/50"}`}>
                  {type === "video" ? <Video className={`h-6 w-6 ${sessionType === type ? "text-primary" : "text-muted"}`} /> : <Mic className={`h-6 w-6 ${sessionType === type ? "text-primary" : "text-muted"}`} />}
                  <span className={`text-sm font-medium capitalize ${sessionType === type ? "text-primary" : "text-text"}`}>{type}</span>
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-text mb-3">Duration</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {SESSION_DURATIONS.map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${duration === d ? "bg-primary-500 border-primary-500 text-white" : "border-border hover:border-primary/50 text-text"}`}>
                  {d} min
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("time")} className="flex-1">Back</Button>
              <Button onClick={() => setStep("confirm")} className="flex-1 gap-2">Review <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-semibold text-text mb-4">Booking summary</h2>
            <Card className="mb-6">
              <CardContent className="p-5 space-y-4">
                {[
                  { label: "Listener", value: listener.name },
                  { label: "Date", value: selectedDate ? formatDate(selectedDate, "EEEE, MMMM d, yyyy") : "" },
                  { label: "Time", value: selectedTime ? formatTime(selectedTime) : "" },
                  { label: "Duration", value: `${duration} minutes` },
                  { label: "Session type", value: sessionType.charAt(0).toUpperCase() + sessionType.slice(1) },
                  { label: "Price", value: price, bold: true },
                ].map(({ label, value, bold }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-sm text-muted">{label}</span>
                    <span className={`text-sm ${bold ? "font-bold text-text" : "text-text"}`}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("type")} className="flex-1">Back</Button>
              <Button onClick={handleBook} isLoading={isLoading} className="flex-1">Confirm Booking</Button>
            </div>
          </motion.div>
        )}

        {step === "success" && booking && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text mb-2">Booked! 🎉</h2>
            <p className="text-muted mb-6">Your session with <strong>{listener.name}</strong> is confirmed.</p>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-left space-y-2">
              <p className="text-sm"><span className="text-muted">Date:</span> <strong>{formatDate(booking.date, "EEEE, MMMM d")}</strong></p>
              <p className="text-sm"><span className="text-muted">Time:</span> <strong>{formatTime(booking.startTime)}</strong></p>
              <p className="text-sm"><span className="text-muted">Link:</span> <a href={booking.meetingUrl} className="text-primary hover:underline text-xs break-all">{booking.meetingUrl}</a></p>
            </div>
            <Button onClick={() => router.push(ROUTES.DASHBOARD)} className="w-full">Back to dashboard</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
