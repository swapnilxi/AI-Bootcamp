"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SlotPicker, type SlotValue } from "@/features/booking";

interface ServiceOption {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  durationMinutes: number;
  price: number;
  category: string;
}

function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialServiceSlug = searchParams.get("service");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Selected state
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [slot, setSlot] = useState<SlotValue | null>(null);
  const [practiceTz, setPracticeTz] = useState<string>("America/New_York");


  // Client Details Form
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 1. Load services
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/mentorship");
        const data = await res.json();
        const list = data.services || [];
        setServices(list);

        if (initialServiceSlug) {
          const match = list.find((s: ServiceOption) => s.slug === initialServiceSlug || s.id === initialServiceSlug);
          if (match) {
            setSelectedService(match);
            setStep(2); // Advance directly to step 2 if coming from a specific service page!
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, [initialServiceSlug]);

  // Handle final booking submission
  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService || !slot) {
      setSubmitError("Please ensure service, date, and time are selected.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          scheduledDate: slot.date,
          scheduledTime: slot.time,
          clientName,
          clientEmail,
          clientPhone,
          whatsappOptIn,
          birthDate: birthDate || undefined,
          birthTime: birthTime || undefined,
          birthPlace: birthPlace || undefined,
          clientNotes: clientNotes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Could not confirm booking. Please review your details.");
        setSubmitting(false);
        // The slot was taken meanwhile: send the client back to pick another
        if (res.status === 409) {
          setSlot(null);
          setStep(2);
        }
        return;
      }

      // Redirect to confirmation screen
      router.push(`/book/confirmation?ref=${data.booking.referenceCode}&t=${data.booking.accessToken}`);
    } catch (err) {
      console.error(err);
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  }


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Title & Trust Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted px-3 py-1 rounded-full bg-mist/50 border border-mist inline-block mb-3">
          Confidential Session
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal">
          Schedule Your Session
        </h1>
        <p className="text-ink/70 text-base mt-2">
          Under 2 minutes • No account required • Private video or audio call
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center justify-between text-sm font-medium text-ink">
          <div
            className={`flex items-center gap-2 ${
              step >= 1 ? "text-indigo font-semibold" : "text-ink/40"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step >= 1 ? "bg-gold text-black" : "bg-mist text-ink/60"
              }`}
            >
              1
            </span>
            <span>Choose Service</span>
          </div>

          <div className="h-[1px] flex-1 mx-3 bg-mist" />

          <div
            className={`flex items-center gap-2 ${
              step >= 2 ? "text-indigo font-semibold" : "text-ink/40"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step >= 2 ? "bg-gold text-black" : "bg-mist text-ink/60"
              }`}
            >
              2
            </span>
            <span>Date & Time</span>
          </div>

          <div className="h-[1px] flex-1 mx-3 bg-mist" />

          <div
            className={`flex items-center gap-2 ${
              step === 3 ? "text-indigo font-semibold" : "text-ink/40"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step === 3 ? "bg-gold text-black" : "bg-mist text-ink/60"
              }`}
            >
              3
            </span>
            <span>Your Details</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Steps Container (Left) + Persistent Order Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Step Panels */}
        <div className="lg:col-span-2 editorial-card p-6 sm:p-10">
          {submitError && (
            <div className="p-4 mb-6 rounded-lg bg-cream/8 border border-cream/20 text-text text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: CHOOSE SERVICE */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-mist pb-4">
                <h2 className="font-serif text-2xl text-ink">1. Select Session Focus</h2>
                <p className="text-sm text-ink/70 mt-1">
                  Choose the session that best aligns with your current life questions.
                </p>
              </div>

              {loadingServices ? (
                <div className="py-12 text-center text-ink/60 text-sm">
                  Loading session offerings...
                </div>
              ) : (
                <div className="space-y-3.5">
                  {services.map((svc) => {
                    const isSelected = selectedService?.id === svc.id;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => {
                          setSelectedService(svc);
                          if (svc.id !== selectedService?.id) setSlot(null);
                        }}
                        className={`p-5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-gold bg-gold/5 ring-1 ring-gold/40 shadow-sm"
                            : "border-white/[0.07] bg-black-raised/80 backdrop-blur-sm hover:border-gold/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                              {svc.category}
                            </span>
                            <h3 className="font-serif text-xl text-ink font-medium mt-0.5">
                              {svc.title}
                            </h3>
                            <p className="text-sm text-ink/70 mt-1">{svc.shortDesc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-serif text-2xl font-semibold text-ink">
                              ${svc.price}
                            </span>
                            <span className="block text-xs text-ink/60 mt-0.5">
                              {svc.durationMinutes} Mins
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                >
                  <span>Continue to Date & Time</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & TIME */}
          {step === 2 && selectedService && (
            <div className="space-y-6">
              <div className="border-b border-mist pb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-ink">2. Choose Date & Available Slot</h2>
                  <p className="text-sm text-ink/70 mt-1">
                    Select an appointment time that suits your schedule.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-ink/60 hover:text-indigo flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Change Service</span>
                </button>
              </div>

              <SlotPicker
                serviceId={selectedService.id}
                value={slot}
                onChange={setSlot}
                onTimezone={setPracticeTz}
              />

              <div className="pt-6 border-t border-mist flex items-center justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back</span>
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!slot}
                  onClick={() => setStep(3)}
                >
                  <span>Continue to Your Details</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: CLIENT DETAILS & CONFIRMATION */}
          {step === 3 && (
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <div className="border-b border-mist pb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-ink">3. Your Contact & Birth Details</h2>
                  <p className="text-sm text-ink/70 mt-1">
                    No account required. Coordinates are strictly confidential.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm font-medium text-ink/60 hover:text-indigo flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Change Time</span>
                </button>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Client Contact
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    Full Legal / Preferred Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full px-4 py-2.5 rounded-lg border border-mist bg-black/60 text-ink text-base focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">
                      Email Address (for calendar invite) *
                    </label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="eleanor@example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-mist bg-black/60 text-ink text-base focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">
                      Phone or WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      className="w-full px-4 py-2.5 rounded-lg border border-mist bg-black/60 text-ink text-base focus:outline-none focus:border-gold"
                    />
                    <p className="text-[11px] text-text-muted mt-1">Include your country code.</p>
                  </div>
                </div>
                <label className="flex items-start gap-2.5 text-sm text-text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="mt-0.5 w-4 h-4 min-h-0 accent-[#FF7315]"
                  />
                  <span>Send me confirmation and reminders on WhatsApp as well as email.</span>
                </label>
              </div>

              {/* AI Coordinates (Optional) */}
              <div className="space-y-4 pt-4 border-t border-mist">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Birth Coordinates (Optional at booking)
                  </h3>
                  <span className="text-xs text-ink/60">Can be emailed later</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/[0.07] bg-black-raised/80 backdrop-blur-sm text-ink text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Exact Time (24h)
                    </label>
                    <input
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/[0.07] bg-black-raised/80 backdrop-blur-sm text-ink text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Place of Birth
                    </label>
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="City, Country"
                      className="w-full px-3 py-2 rounded-lg border border-white/[0.07] bg-black-raised/80 backdrop-blur-sm text-ink text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Primary Questions or Context for the Instructor (Optional)
                </label>
                <textarea
                  rows={3}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Share any key career transitions, relationship questions, or timing decisions you wish to explore..."
                  className="w-full p-3 rounded-lg border border-mist bg-black/60 text-ink text-sm resize-none focus:outline-none focus:border-gold"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-6 border-t border-mist flex items-center justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back</span>
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2 text-ink" />
                  <span>{submitting ? "Securing Appointment..." : "Confirm Session"}</span>
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Persistent Order Summary Sidebar */}
        <div className="editorial-card p-6 sm:p-8 space-y-6">
          <h3 className="font-serif text-xl text-ink border-b border-mist pb-3">
            Appointment Summary
          </h3>

          {selectedService ? (
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-ink/60 uppercase">Selected Session</span>
                <p className="font-serif text-lg font-medium text-ink mt-0.5">
                  {selectedService.title}
                </p>
                <span className="inline-block mt-1 text-xs text-text-muted font-medium px-2 py-0.5 rounded-full bg-mist/50">
                  {selectedService.durationMinutes} Minutes • Recorded Session
                </span>
              </div>

              {slot && (
                <div className="pt-3 border-t border-mist/60 space-y-1">
                  <span className="text-xs text-ink/60 uppercase">Scheduled Window</span>
                  <p className="font-medium text-ink">
                    {new Date(slot.start).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: practiceTz || undefined,
                    })}
                  </p>
                  <p className="text-ink/80 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-text-muted" />
                    <span>
                      {new Date(slot.start).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        timeZone: practiceTz || undefined,
                        timeZoneName: "short",
                      })}
                    </span>
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-mist/60 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink">Total Fee:</span>
                <span className="font-serif text-2xl font-bold text-ink">
                  ${selectedService.price}
                </span>
              </div>

              <div className="pt-4 border-t border-mist/60 space-y-2 text-xs text-ink/75">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-text-muted shrink-0" />
                  <span>Confidential 1-on-1 private video call</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-text-muted shrink-0" />
                  <span>Free rescheduling up to 24h prior</span>
                </div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-text-muted shrink-0" />
                  <span>Full audio & chart recording provided</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-ink/60">
              Please select a session service to view fee and session details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-24 text-center text-ink/60">
          Loading booking wizard...
        </div>
      }
    >
      <BookingWizard />
    </Suspense>
  );
}
