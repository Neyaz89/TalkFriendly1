"use client";

/**
 * PaymentStep
 *
 * Rendered inside BookingFlow between the "confirm" and "success" steps.
 * Wraps the Stripe Elements payment form.
 *
 * Props:
 *   clientSecret    – from POST /api/payments/create-intent
 *   amountCents     – integer, cents (shown as formatted price)
 *   listenerName    – displayed in the UI
 *   duration        – session length in minutes
 *   onSuccess       – called with the confirmed paymentIntentId
 *   onBack          – returns user to the confirm step
 */

import React, { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

// ── Inner form (must be a child of <Elements>) ────────────────────────────────

interface InnerFormProps {
  amountCents: number;
  listenerName: string;
  duration: number;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

function PaymentForm({
  amountCents,
  listenerName,
  duration,
  onSuccess,
  onBack,
}: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // No redirect — we handle success inline
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(
        error.message ?? "Payment failed. Please check your card details."
      );
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setErrorMessage("Payment was not completed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Summary card */}
      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text">
            {duration}-min session with {listenerName}
          </p>
          <p className="text-xs text-muted mt-0.5">Secure payment via Stripe</p>
        </div>
        <p className="text-xl font-bold text-primary-700">
          {formatPrice(amountCents)}
        </p>
      </div>

      {/* Stripe Elements card input */}
      <div className="bg-white border border-border rounded-2xl p-4">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-muted justify-center">
        <Lock className="h-3.5 w-3.5" />
        <span>Payment secured by Stripe. TalkFriendly never stores card details.</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          isLoading={isProcessing}
          className="flex-1"
        >
          {isProcessing ? "Processing…" : `Pay ${formatPrice(amountCents)}`}
        </Button>
      </div>
    </form>
  );
}

// ── Public wrapper — initialises Stripe provider ─────────────────────────────

interface PaymentStepProps {
  clientSecret: string;
  amountCents: number;
  listenerName: string;
  duration: number;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

export function PaymentStep({
  clientSecret,
  amountCents,
  listenerName,
  duration,
  onSuccess,
  onBack,
}: PaymentStepProps) {
  const stripePromise = getStripe();

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center h-32 text-muted text-sm">
        Loading payment form…
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#E97C5A",
            borderRadius: "12px",
          },
        },
      }}
    >
      <PaymentForm
        amountCents={amountCents}
        listenerName={listenerName}
        duration={duration}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}
