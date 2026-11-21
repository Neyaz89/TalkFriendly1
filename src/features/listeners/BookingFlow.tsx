"use client";

/**
 * Multi-step booking flow for listener sessions.
 * Steps: booking-type → date? → time? → type → confirm → payment → success
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
import { PaymentStep } from "./PaymentStep";
import type { Listener, BookingSlot, Booking } from "@/types";
import { ROUTES, SESSION_DURATIONS } from "@/constants";
import { formatDate, formatPrice, formatTime } from "@/lib/utils";
import { addDays, format } from "date-fns";

type Step =
  | "booking-type"
  | "date"
  | "time"
  | "type"
  | "confirm"
  | "payment"
  | "success";

export function BookingFlow({ listenerId }: { listenerId: string }) {
  const router = useRouter();
  const [listener, setListener] = useState<Listener | null>(null);
  const [step, setStep] = useState<Step>("booking-type");
  const [bookingType, setBookingType] = useState<"now" | "later">("now");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"audio" | "video">("video");
  const [duration, setDuration] = useState(60);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Payment state
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentAmountCents, setPaymentAmountCents] = useState(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1));

  useEffect(() => {
    listenerService.getListenerById(listenerId).then(setListener).catch(console.error);
  }, [listenerId]);

  useEffect(() => {
    if (selectedDate) {
      bookingService.getAvailableSlots().then(setAvailableSlots).catch(console.error);
    }
  }, [selectedDate, listenerId]);

  // ── Step handlers ──────────────────────────────────────────────────────────

  /**
   * "Confirm" step → creates a Stripe PaymentIntent and advances to payment.
   */
  const handleProceedToPayment = async () => {
    if (!listener) return;
    setIsLoading(true);
    setPaymentError(null);
    try {
      const now = new Date();
      const date = bookingType === "now" ? format(now, "yyyy-MM-dd") : (selectedDate ?? "");
      const startTime = bookingType === "now" ? format(now, "HH:mm") : (selectedTime ?? "");

      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listenerId, duration, sessionType, date, startTime, bookingType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to initialise payment");

      setPaymentClientSecret(data.clientSecret);
      setPaymentAmountCents(data.amount);
      setStep("payment");
    } catch (err: any) {
      setPaymentError(err.message ?? "Could not start payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * PaymentStep calls this after Stripe confirms the card charge.
   * We then hit our backend to create the booking record in Supabase.
   */
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!listener) return;
    setIsLoading(true);
    try {
      const now = new Date();
      const date = bookingType === "now" ? format(now, "yyyy-MM-dd") : (selectedDate ?? "");
      const startTime = bookingType === "now" ? format(now, "HH:mm") : (selectedTime ?? "");

      const res = await fetch("/api/payments/confirm-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          listenerId,
          duration,
          sessionType,
          date,
          startTime,
          bookingType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking creation failed after payment");

      const b: Booking = {
        id: data.bookingId ?? paymentIntentId,
        userId: "",
        listenerId,
        listenerName: listener.name,
        listenerAvatar: listener.avatar,
        date,
        startTime,
        endTime: "",
        duration,
        sessionType,
        status: "confirmed",
        price: paymentAmountCents,
        currency: "USD",
        meetingUrl: data.meetingUrl ?? "",
        createdAt: new Date().toISOString(),
      };
      setBooking(b);
      setStep("success");
    } catch (err: any) {
      // Payment succeeded but booking failed — show recovery message
      setPaymentError(
        (err.message ?? "Booking could not be confirmed.") +
          " Your payment was processed — please contact support."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (!listener) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const price = formatPrice(Math.round((listener.pricing.perSession * duration) / 60));

  // Progress steps shown at the top (excludes "payment" and "success" from dots)
  const progressSteps =
    bookingType === "now"
      ? (["booking-type", "type", "confirm"] as const)
      : (["booking-type", "date", "time", "type", "confirm"] as const);

  const stepIndex = progressSteps.findIndex((s) => s === step);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={ROUTES.LISTENER(listenerId)}
          className="p-2 rounded-xl hover:bg-secondary text-muted hover:text-text transition-colors"
          aria-label="Back to profile"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-text">Book a Session</h1>
      </div>

      {/* Listener card */}
      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 items-center">
          <Avatar src={listener.avatar} name={listener.name} size="lg" />
          <div>
            <p className="font-semibold text-text">{listener.name}</p>
            <p className="text-xs text-muted">{listener.title}</p>
          </div>
        </CardContent>
      </Card>

      {/* Progress dots — hidden on payment/success */}
      {step !== "payment" && step !== "success" && (
        <div className="flex items-center gap-2 mb-8">
          {progressSteps.map((s, i) => {
            const done = stepIndex >= 0 && i <= stepIndex;
            return (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    done ? "bg-primary-500 text-white" : "bg-gray-100 text-muted"
                  }`}
                >
                  {i + 1}
                </div>
                {i < progressSteps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-100 rounded" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Step 1: booking type ──────────────────────────────────────── */}
        {step === "booking-type" && (
          <motion.div
            key="booking-type"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold text-text mb-2">When would you like to meet?</h2>
            <p className="text-sm text-muted mb-6">
              Start immediately or pick a date and time.
            </p>

            <div className="grid gap-4 mb-6">
              {(["now", "later"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setBookingType(type)}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    bookingType === type
                      ? "bg-primary-50 border-primary-500"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      bookingType === type ? "bg-primary-500" : "bg-gray-100"
                    }`}
                  >
                    {type === "now" ? (
                      <Video className={`h-6 w-6 ${bookingType === type ? "text-white" : "text-muted"}`} />
                    ) : (
                      <svg
                        className={`h-6 w-6 ${bookingType === type ? "text-white" : "text-muted"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${bookingType === type ? "text-primary-700" : "text-text"}`}>
                      {type === "now" ? "Start Now" : "Schedule for Later"}
                    </h3>
                    <p className="text-sm text-muted">
                      {type === "now"
                        ? `Connect immediately with ${listener.name} if they're available`
                        : "Pick a specific date and time that works for both of you"}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                      bookingType === type
                        ? "border-primary-500 bg-primary-500"
                        : "border-gray-300"
                    }`}
                  >
                    {bookingType === type && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep(bookingType === "now" ? "type" : "date")}
              className="w-full gap-2"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* ── Step 2: date (scheduled only) ────────────────────────────── */}
        {step === "date" && (
          <motion.div
            key="date"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold text-text mb-4">Choose a date</h2>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {dates.map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-primary-500 border-primary-500 text-white"
                        : "border-border hover:border-primary/50 text-text"
                    }`}
                  >
                    <span className={`text-xs ${isSelected ? "text-primary-100" : "text-muted"}`}>
                      {format(date, "EEE")}
                    </span>
                    <span className="text-sm font-semibold mt-0.5">{format(date, "d")}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("booking-type")} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep("time")} disabled={!selectedDate} className="flex-1 gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: time (scheduled only) ────────────────────────────── */}
        {step === "time" && (
          <motion.div
            key="time"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold text-text mb-1">Choose a time</h2>
            <p className="text-sm text-muted mb-4">
              {selectedDate && formatDate(selectedDate, "EEEE, MMMM d")}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.isAvailable}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                    selectedTime === slot.time
                      ? "bg-primary-500 border-primary-500 text-white"
                      : slot.isAvailable
                      ? "border-border hover:border-primary/50 text-text"
                      : "border-border text-gray-300 cursor-not-allowed bg-gray-50"
                  }`}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("date")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep("type")}
                disabled={!selectedTime}
                className="flex-1 gap-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: session type + duration ──────────────────────────── */}
        {step === "type" && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold text-text mb-4">Session type & duration</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(["audio", "video"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSessionType(type)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    sessionType === type
                      ? "bg-primary-50 border-primary-400"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {type === "video" ? (
                    <Video className={`h-6 w-6 ${sessionType === type ? "text-primary" : "text-muted"}`} />
                  ) : (
                    <Mic className={`h-6 w-6 ${sessionType === type ? "text-primary" : "text-muted"}`} />
                  )}
                  <span
                    className={`text-sm font-medium capitalize ${
                      sessionType === type ? "text-primary" : "text-text"
                    }`}
                  >
                    {type}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-sm font-medium text-text mb-3">Duration</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {SESSION_DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    duration === d
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "border-border hover:border-primary/50 text-text"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(bookingType === "now" ? "booking-type" : "time")}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={() => setStep("confirm")} className="flex-1 gap-2">
                Review <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 5: confirm / summary ─────────────────────────────────── */}
        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold text-text mb-4">Booking summary</h2>
            <Card className="mb-6">
              <CardContent className="p-5 space-y-4">
                {[
                  { label: "Listener", value: listener.name },
                  {
                    label: "When",
                    value:
                      bookingType === "now"
                        ? "Start Now"
                        : selectedDate
                        ? formatDate(selectedDate, "EEEE, MMMM d, yyyy")
                        : "",
                  },
                  ...(bookingType === "later"
                    ? [{ label: "Time", value: selectedTime ? formatTime(selectedTime) : "" }]
                    : []),
                  { label: "Duration", value: `${duration} minutes` },
                  {
                    label: "Session type",
                    value: sessionType.charAt(0).toUpperCase() + sessionType.slice(1),
                  },
                  { label: "Total", value: price, bold: true },
                ].map(({ label, value, bold }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-sm text-muted">{label}</span>
                    <span className={`text-sm ${bold ? "font-bold text-text" : "text-text"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-600">{paymentError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("type")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleProceedToPayment}
                isLoading={isLoading}
                className="flex-1"
              >
                Proceed to Payment
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 6: payment (Stripe Elements) ────────────────────────── */}
        {step === "payment" && paymentClientSecret && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold text-text mb-6">Payment</h2>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-600">{paymentError}</p>
              </div>
            )}

            <PaymentStep
              clientSecret={paymentClientSecret}
              amountCents={paymentAmountCents}
              listenerName={listener.name}
              duration={duration}
              onSuccess={handlePaymentSuccess}
              onBack={() => setStep("confirm")}
            />
          </motion.div>
        )}

        {/* ── Step 7: success ───────────────────────────────────────────── */}
        {step === "success" && booking && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </motion.div>

            <h2 className="text-2xl font-bold text-text mb-2">
              {bookingType === "now" ? "Ready to Start! 🎉" : "Booking Confirmed! 🎉"}
            </h2>
            <p className="text-muted mb-6">
              {bookingType === "now"
                ? `Your session with ${listener.name} is ready. Join the meeting below.`
                : `Your session with ${listener.name} has been confirmed and payment received.`}
            </p>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-left space-y-2">
              {bookingType === "later" && (
                <>
                  <p className="text-sm">
                    <span className="text-muted">Date: </span>
                    <strong>{formatDate(booking.date, "EEEE, MMMM d")}</strong>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted">Time: </span>
                    <strong>{formatTime(booking.startTime)}</strong>
                  </p>
                </>
              )}
              <p className="text-sm">
                <span className="text-muted">Amount paid: </span>
                <strong>{formatPrice(booking.price)}</strong>
              </p>
              {booking.meetingUrl && (
                <>
                  <p className="text-sm text-muted">Meeting link:</p>
                  <a
                    href={booking.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs break-all block bg-white p-2 rounded-lg border border-green-200"
                  >
                    {booking.meetingUrl}
                  </a>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {bookingType === "now" && booking.meetingUrl && (
                <Button
                  onClick={() => window.open(booking.meetingUrl, "_blank")}
                  className="flex-1"
                >
                  Join Meeting Now
                </Button>
              )}
              <Button
                onClick={() => router.push(ROUTES.DASHBOARD)}
                variant={bookingType === "now" ? "outline" : "default"}
                className="flex-1"
              >
                {bookingType === "now" ? "Go to Dashboard" : "Back to Dashboard"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
