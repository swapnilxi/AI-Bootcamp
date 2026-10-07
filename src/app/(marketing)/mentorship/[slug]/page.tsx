"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AccordionFAQ } from "@/components/ui/AccordionFAQ";
import { Icon } from "@/components/ui/Icon";

interface ServiceDetailData {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  fullDescription: string;
  durationMinutes: number;
  price: number;
  category: string;
  whatIncluded: string[];
  whoIsThisFor: string[];
  preparationTips?: string | null;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [service, setService] = useState<ServiceDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    async function fetchDetail() {
      try {
        const res = await fetch(`/api/mentorship/${slug}`);
        if (!res.ok) throw new Error("Service not found");
        const data = await res.json();
        setService(data.service);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center text-text-muted">
        Loading session overview...
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 editorial-card text-center space-y-4">
        <Icon name="search" variant="line" size={36} className="text-gold mx-auto" />
        <h2 className="font-serif text-2xl text-text font-normal">Session Not Found</h2>
        <p className="text-sm text-text-muted">The requested session offering could not be located.</p>
        <Button href="/mentorship" variant="secondary" size="md">
          Return to All Sessions
        </Button>
      </div>
    );
  }

  const serviceFaqs = [
    {
      question: "Will I receive a recording of this session?",
      answer:
        "Yes. High-definition video and clean audio recordings are generated automatically and sent to you within 24 hours of session completion alongside any written chart diagrams discussed.",
    },
    {
      question: "Can I invite a spouse or business partner to this session?",
      answer:
        "For team architecture reviews, bring whoever owns the system — two or three people works well. For code review, mock interviews and career sessions, 1-on-1 keeps the feedback candid.",
    },
    {
      question: "What happens if I need to reschedule?",
      answer:
        "You can reschedule directly using the link in your confirmation receipt up to 24 hours prior to the scheduled time without any penalty.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Back link */}
      <div>
        <Link
          href="/mentorship"
          className="text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-gold inline-flex items-center gap-1.5 transition-colors"
        >
          <span className="rotate-180 inline-block"><Icon name="arrow" variant="line" size={12} /></span>
          <span>Back to All Sessions</span>
        </Link>
      </div>

      {/* Hero Grid: Main Description (Left) + Sticky Booking Box (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-10">
          <div className="space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold px-3.5 py-1.5 rounded-full bg-black-raised border border-black-line inline-block">
              {service.category} Session
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl text-text font-normal leading-tight">
              {service.title}
            </h1>
            <p className="text-base sm:text-lg text-text-muted leading-relaxed font-sans">
              {service.shortDesc}
            </p>
          </div>

          {/* Full Narrative Overview */}
          <div className="border-t border-black-line pt-8 space-y-4">
            <h2 className="font-serif text-2xl text-text font-normal">Session Overview</h2>
            <div className="text-text-muted text-base leading-relaxed whitespace-pre-line space-y-3 font-sans">
              {service.fullDescription}
            </div>
          </div>

          {/* What is Included */}
          {service.whatIncluded && service.whatIncluded.length > 0 && (
            <div className="border-t border-black-line pt-8 space-y-4">
              <h2 className="font-serif text-2xl text-text font-normal">What Is Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {service.whatIncluded.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded bg-black-raised border border-black-line text-sm">
                    <Icon name="check" variant="line" size={16} className="text-gold shrink-0 mt-0.5" />
                    <span className="text-text">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Who This Session Is For */}
          {service.whoIsThisFor && service.whoIsThisFor.length > 0 && (
            <div className="border-t border-black-line pt-8 space-y-4">
              <h2 className="font-serif text-2xl text-text font-normal">Who This Session Is For</h2>
              <ul className="space-y-3">
                {service.whoIsThisFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-base text-text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-2.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What to Prepare Beforehand */}
          {service.preparationTips && (
            <div className="p-6 rounded bg-black-raised border border-black-line space-y-2">
              <h3 className="font-serif text-lg text-text font-normal flex items-center gap-2">
                <Icon name="role-admin" variant="line" size={16} className="text-gold" />
                <span>What to Prepare Beforehand</span>
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {service.preparationTips}
              </p>
            </div>
          )}

          {/* Session FAQ */}
          <div className="border-t border-black-line pt-8 space-y-6">
            <h2 className="font-serif text-2xl text-text font-normal">Common Questions</h2>
            <AccordionFAQ items={serviceFaqs} />
          </div>
        </div>

        {/* Right 1 Col: Sticky Booking Action Card */}
        <div className="editorial-card p-6 sm:p-8 space-y-6 lg:sticky lg:top-28">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider block">Session Fee</span>
            <div className="font-serif text-4xl font-normal text-gold mt-1">
              ${service.price}
            </div>
            <span className="text-xs text-text-muted block mt-0.5">USD • One-Time Confidential Session</span>
          </div>

          <div className="space-y-3 pt-3 border-t border-black-line text-sm text-text-muted">
            <div className="flex items-center justify-between">
              <span>Duration:</span>
              <span className="font-medium text-text flex items-center gap-1.5">
                <Icon name="clock" variant="line" size={14} className="text-gold" />
                <span>{service.durationMinutes} Minutes</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Format:</span>
              <span className="font-medium text-text flex items-center gap-1.5">
                <Icon name="video" variant="line" size={14} className="text-gold" />
                <span>Zoom or Phone Call</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Recording:</span>
              <span className="font-medium text-text">Included (Audio & Video)</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              href={`/book?service=${service.slug}`}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <span>Book this Session</span>
              <Icon name="arrow" variant="line" size={16} className="ml-1.5" />
            </Button>
          </div>

          <div className="pt-2 text-xs text-center text-text-muted space-y-1.5">
            <p className="flex items-center justify-center gap-1.5"><Icon name="check" variant="filled" size={13} className="text-gold" /> Takes under 2 minutes to schedule</p>
            <p className="flex items-center justify-center gap-1.5"><Icon name="check" variant="filled" size={13} className="text-gold" /> No account creation required</p>
            <p className="flex items-center justify-center gap-1.5"><Icon name="check" variant="filled" size={13} className="text-gold" /> Instant calendar invite (.ics / Google)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
