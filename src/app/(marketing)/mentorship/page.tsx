"use client";

import React, { useState, useEffect } from "react";
import { ServiceCard, ServiceItem } from "@/components/services/ServiceCard";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    "Code Review",
    "Career & Vocation",
    "Relationships",
    "Interview Prep",
    "Remedies & Wellness",
  ];

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        const url = activeCategory === "All" ? "/api/mentorship" : `/api/mentorship?category=${encodeURIComponent(activeCategory)}`;
        const res = await fetch(url);
        const data = await res.json();
        setServices(data.services || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold px-3.5 py-1.5 rounded-full bg-black-raised border border-black-line inline-block">
          1-on-1 Sessions
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text font-normal leading-tight">
          Personal AI Sessions
        </h1>
        <p className="text-base sm:text-lg text-text-muted leading-relaxed">
          Every session is a confidential, recorded deep dive into your birth chart. Choose the focus area that best addresses your present decisions.
        </p>

        {/* Trust signals strip */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <TrustBadge icon={<Icon name="video" variant="line" size={14} className="text-gold" />} label="Private Zoom Video Call" />
          <TrustBadge icon={<Icon name="clock" variant="line" size={14} className="text-gold" />} label="Lifetime Recording Provided" />
          <TrustBadge icon={<Icon name="role-admin" variant="line" size={14} className="text-gold" />} label="100% Confidential" />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all min-h-[44px] ${
              activeCategory === cat
                ? "bg-gold text-black shadow-sm"
                : "bg-black-raised text-text-muted border border-black-line hover:border-gold hover:text-text"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-20 text-center text-text-muted text-base">
          Loading session catalog...
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc, idx) => (
            <ServiceCard key={svc.id} service={svc} featured={idx === 1} />
          ))}
        </div>
      ) : (
        <div className="editorial-card p-12 text-center text-text-muted max-w-md mx-auto space-y-3">
          <Icon name="search" variant="line" size={32} className="text-gold mx-auto" />
          <h3 className="font-serif text-xl text-text font-normal">No sessions in this category</h3>
          <p className="text-sm">Please select &ldquo;All&rdquo; to browse all available sessions.</p>
          <button
            onClick={() => setActiveCategory("All")}
            className="text-xs font-semibold uppercase tracking-wider text-gold hover:underline"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Questions Helper */}
      <div className="editorial-card p-8 sm:p-10 max-w-3xl mx-auto text-center space-y-4">
        <h3 className="font-serif text-2xl text-text font-normal">
          Unsure Which Session Fits Your Situation?
        </h3>
        <p className="text-sm text-text-muted leading-relaxed max-w-xl mx-auto">
          If this is your first time consulting an instructor, we recommend the{" "}
          <strong className="text-text font-medium">AI Architecture Review</strong>, which covers retrieval, agents, evaluation and cost in one sitting.
        </p>
        <div className="pt-2">
          <Link
            href="/contact"
            className="text-xs font-semibold uppercase tracking-wider text-gold hover:underline inline-flex items-center gap-1.5"
          >
            <span>Send an inquiry or WhatsApp question</span>
            <Icon name="arrow" variant="line" size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
