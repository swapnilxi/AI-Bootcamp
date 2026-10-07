import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  durationMinutes: number;
  price: number;
  category: string;
  whatIncluded?: string[];
}

interface ServiceCardProps {
  service: ServiceItem;
  featured?: boolean;
}

export function ServiceCard({ service, featured = false }: ServiceCardProps) {
  return (
    <div
      className={`editorial-card p-8 flex flex-col justify-between h-full relative ${
        featured ? "border-cream shadow-sm" : "border-black-line"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-8 px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-cream text-[#0C0B0A]">
          Most Requested
        </span>
      )}

      <div>
        {/* Category & Duration */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {service.category}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-text-muted px-2.5 py-1 rounded-full bg-black border border-black-line">
            <Icon name="clock" variant="line" size={14} className="text-text-muted" />
            <span>{service.durationMinutes} Minutes</span>
          </span>
        </div>

        {/* Title */}
        <Link href={`/mentorship/${service.slug}`} className="group">
          <h3 className="font-serif text-2xl sm:text-3xl text-text group-hover:text-gold transition-colors mb-3 leading-snug">
            {service.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="mb-4">
          <span className="font-serif text-3xl font-medium text-text">
            ${service.price}
          </span>
          <span className="text-xs text-text-muted ml-2">USD • 1-on-1 Recorded Session</span>
        </div>

        {/* Description */}
        <p className="text-text-muted text-sm leading-relaxed mb-6">
          {service.shortDesc}
        </p>

        {/* Deliverables snippet if available */}
        {service.whatIncluded && service.whatIncluded.length > 0 && (
          <ul className="space-y-2 mb-6 pt-4 border-t border-black-line text-sm text-text-muted">
            {service.whatIncluded.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Icon name="check" variant="line" size={16} className="text-text-muted shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-black-line flex flex-col sm:flex-row gap-3">
        <Button
          href={`/book?service=${service.slug}`}
          variant="primary"
          size="md"
          className="w-full flex-1"
        >
          <span>Book this Session</span>
          <Icon name="arrow" variant="line" size={14} className="ml-1" />
        </Button>
        <Link
          href={`/mentorship/${service.slug}`}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-gold transition-colors text-center"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
