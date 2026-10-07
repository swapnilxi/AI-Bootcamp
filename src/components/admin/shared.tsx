"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Mail, MessageCircle, X, XCircle, MinusCircle } from "lucide-react";

export type Channel = "EMAIL" | "WHATSAPP";

export interface Delivery {
  channel: Channel;
  status: "SENT" | "FAILED" | "SKIPPED";
  error?: string;
}

export interface NotifyResult {
  deliveries: Delivery[];
  whatsappLink: string | null;
}

let capsPromise: Promise<{ email: boolean; whatsapp: boolean }> | null = null;

/** Which notification channels are configured on the server (admin only). */
export function useChannelCaps() {
  const [caps, setCaps] = useState<{ email: boolean; whatsapp: boolean } | null>(null);
  useEffect(() => {
    capsPromise ??= fetch("/api/admin/availability")
      .then((r) => (r.ok ? r.json() : { channels: { email: false, whatsapp: false } }))
      .then((d) => d.channels)
      .catch(() => ({ email: false, whatsapp: false }));
    capsPromise.then(setCaps);
  }, []);
  return caps;
}

export const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-black/60 text-sm text-ink focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40";
export const labelClass = "block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5";

/** Right-side sliding panel. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-[#0f0f12] border-l border-gold/20 shadow-2xl flex flex-col animate-[drawerIn_0.45s_cubic-bezier(0.16,1,0.3,1)]"
        data-lenis-prevent
      >
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/[0.07]">
          <div>
            <h2 className="font-serif text-2xl text-ink">{title}</h2>
            {subtitle && <div className="text-xs text-text-muted mt-1">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="min-h-0 p-2 rounded-lg text-text-muted hover:text-gold" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">{children}</div>
      </aside>
    </div>
  );
}

/** Email / WhatsApp checkboxes; shows whether each channel is configured. */
export function ChannelPicker({
  value,
  onChange,
  whatsappAvailable = true,
}: {
  value: Channel[];
  onChange: (v: Channel[]) => void;
  whatsappAvailable?: boolean;
}) {
  const caps = useChannelCaps();
  const toggle = (c: Channel) => onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c]);
  const items: [Channel, string, typeof Mail, boolean | undefined][] = [
    ["EMAIL", "Email", Mail, caps?.email],
    ["WHATSAPP", "WhatsApp", MessageCircle, caps?.whatsapp],
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([c, label, ChannelIcon, configured]) => {
        const disabled = c === "WHATSAPP" && !whatsappAvailable;
        const on = value.includes(c) && !disabled;
        return (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => toggle(c)}
            className={`min-h-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-colors disabled:opacity-40 ${
              on ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-text-muted hover:text-text"
            }`}
            aria-pressed={on}
            title={configured === false ? `${label} provider not configured: the message will be logged but not sent` : undefined}
          >
            <ChannelIcon className="w-3.5 h-3.5" />
            {label}
            {configured === false && <span className="text-[10px] text-amber-300">(not set up)</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Shows per-channel delivery results and a click-to-chat fallback for WhatsApp. */
export function DeliveryReport({ result }: { result: NotifyResult | null }) {
  if (!result || result.deliveries.length === 0) return null;
  const waNotSent = result.deliveries.some((d) => d.channel === "WHATSAPP" && d.status !== "SENT");
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/30 p-3 space-y-1.5 text-xs">
      {result.deliveries.map((d) => (
        <p key={d.channel} className="flex items-center gap-2">
          {d.status === "SENT" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          ) : d.status === "SKIPPED" ? (
            <MinusCircle className="w-3.5 h-3.5 text-amber-300" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-clay" />
          )}
          <span className="text-text">{d.channel === "EMAIL" ? "Email" : "WhatsApp"}</span>
          <span className="text-text-muted">
            {d.status === "SENT" ? "sent" : d.status === "SKIPPED" ? "not sent (provider not configured)" : `failed: ${d.error}`}
          </span>
        </p>
      ))}
      {waNotSent && result.whatsappLink && (
        <a
          href={result.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-full bg-[#1f3b2c] border border-emerald-500/30 text-emerald-200 hover:bg-[#25503a] transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" /> Send manually on WhatsApp
        </a>
      )}
    </div>
  );
}

export const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  CONFIRMED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  RESCHEDULED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  COMPLETED: "bg-white/5 text-text-muted border-white/10",
  CANCELLED: "bg-clay/10 text-clay border-clay/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider ${STATUS_STYLES[status] || ""}`}>
      {status === "RESCHEDULED" ? "CONFIRMED · MOVED" : status}
    </span>
  );
}
