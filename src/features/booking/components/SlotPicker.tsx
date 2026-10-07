"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Globe } from "lucide-react";

interface DaySummary {
  date: string;
  available: boolean;
  count: number;
}

interface Slot {
  time: string;
  start: string;
}

export interface SlotValue {
  date: string;
  time: string;
  start: string;
}

interface SlotPickerProps {
  serviceId: string;
  value: SlotValue | null;
  onChange: (v: SlotValue | null) => void;
  /** Called once the practice timezone is known */
  onTimezone?: (tz: string) => void;
}

const WINDOW = 14;

function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    day: d,
    month: dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
  };
}

function fmtTime(iso: string, timeZone: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
}

/** Two-step picker: a 14-day strip with open-slot counts, then times for the chosen day. */
export function SlotPicker({ serviceId, value, onChange, onTimezone }: SlotPickerProps) {
  const [tz, setTz] = useState<string>("America/New_York");
  const [activeTz, setActiveTz] = useState<string>("America/New_York");
  const [today, setToday] = useState<string>("");
  const [maxAdvance, setMaxAdvance] = useState(60);
  const [from, setFrom] = useState<string | null>(null);
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(value?.date ?? null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dayReason, setDayReason] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localTz = typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  // Load client timezone preference if saved or default to Eastern Time (Virginia)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai_bootcamp_tz");
      if (saved) {
        setActiveTz(saved);
        onTimezone?.(saved);
      } else {
        setActiveTz("America/New_York");
        onTimezone?.("America/New_York");
      }
    }
  }, [onTimezone]);

  function handleTimezoneSelect(newTz: string) {
    setActiveTz(newTz);
    if (typeof window !== "undefined") {
      localStorage.setItem("ai_bootcamp_tz", newTz);
    }
    onTimezone?.(newTz);
  }

  const loadDays = useCallback(
    async (start: string | null) => {
      setLoadingDays(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ serviceId, days: String(WINDOW) });
        if (start) qs.set("from", start);
        const res = await fetch(`/api/availability?${qs}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load availability");
        const practiceZone = data.timezone || "America/New_York";
        setTz(practiceZone);
        setToday(data.today);
        setMaxAdvance(data.maxAdvanceDays);
        setFrom(start ?? data.today);
        setDays(data.days);
        // Auto-select the first open day so the client sees times immediately
        setSelectedDate((current) => {
          if (current && data.days.some((d: DaySummary) => d.date === current && d.available)) return current;
          return data.days.find((d: DaySummary) => d.available)?.date ?? null;
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingDays(false);
      }
    },
    [serviceId, onTimezone]
  );

  useEffect(() => {
    loadDays(null);
  }, [loadDays]);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setDayReason(null);
    fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots || []);
        setDayReason(data.available ? null : data.reason || "No times available");
      })
      .catch(() => !cancelled && setDayReason("Could not load times for this day"))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [selectedDate, serviceId]);

  const canGoBack = !!from && !!today && from > today;
  const canGoForward = !!from && !!today && addDays(from, WINDOW) <= addDays(today, maxAdvance);
  const showLocal = !!tz && !!localTz && tz !== localTz;

  return (
    <div className="space-y-6">
      {/* Day strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-ink">Choose a day</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canGoBack || loadingDays}
              onClick={() => from && loadDays(addDays(from, -WINDOW) < today ? today : addDays(from, -WINDOW))}
              className="min-h-0 p-2 rounded-lg border border-white/10 text-text-muted hover:text-gold hover:border-gold/40 disabled:opacity-30 transition-colors"
              aria-label="Earlier dates"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!canGoForward || loadingDays}
              onClick={() => from && loadDays(addDays(from, WINDOW))}
              className="min-h-0 p-2 rounded-lg border border-white/10 text-text-muted hover:text-gold hover:border-gold/40 disabled:opacity-30 transition-colors"
              aria-label="Later dates"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-text">{error}</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {(loadingDays ? Array.from({ length: WINDOW }, () => null) : days).map((d, i) => {
              if (!d) return <div key={i} className="h-[76px] rounded-xl bg-white/[0.03] animate-pulse" />;
              const l = dayLabel(d.date);
              const active = d.date === selectedDate;
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={!d.available}
                  onClick={() => {
                    setSelectedDate(d.date);
                    if (value?.date !== d.date) onChange(null);
                  }}
                  className={`min-h-0 h-[76px] rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${
                    active
                      ? "border-gold bg-gold/15 text-gold shadow-[0_0_18px_-6px_rgba(249, 115, 22,0.5)]"
                      : d.available
                      ? "border-white/10 bg-black/40 text-text hover:border-gold/50"
                      : "border-white/[0.04] text-text-muted/40 cursor-not-allowed"
                  }`}
                  aria-pressed={active}
                  aria-label={`${l.weekday} ${l.day} ${l.month}${d.available ? `, ${d.count} times available` : ", unavailable"}`}
                >
                  <span className="text-[10px] uppercase tracking-wider">{l.weekday}</span>
                  <span className="font-serif text-xl leading-none">{l.day}</span>
                  <span className="text-[10px]">{d.available ? `${d.count} open` : l.month}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Timezone Selector & Customizer */}
      <div className="p-4 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cream/10 flex items-center justify-center text-text-muted shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink flex items-center gap-1.5 flex-wrap">
              <span>Appointment Time Zone:</span>
              <span className="text-text font-normal">
                {activeTz === "America/New_York"
                  ? "Eastern Time (Virginia & Regional Default)"
                  : activeTz.replace(/_/g, " ")}
              </span>
            </p>
            <p className="text-[11px] text-text-muted">
              Times below are automatically converted to your selected time zone.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <label htmlFor="slot-tz-select" className="sr-only">
            Edit Time Zone
          </label>
          <select
            id="slot-tz-select"
            value={activeTz}
            onChange={(e) => handleTimezoneSelect(e.target.value)}
            className="px-3 py-1.5 bg-black/60 border border-cream/20 text-text rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
          >
            <optgroup label="United States (Regional Focus)">
              <option value="America/New_York">Eastern Time — Virginia, DC, NY, NC (Default)</option>
              <option value="America/Chicago">Central Time — Chicago, Dallas, Houston</option>
              <option value="America/Denver">Mountain Time — Denver, Phoenix</option>
              <option value="America/Los_Angeles">Pacific Time — Los Angeles, Seattle</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
            </optgroup>
            <optgroup label="International Time Zones">
              <option value="Europe/London">London / UK (GMT / BST)</option>
              <option value="Europe/Paris">Central Europe (CET / CEST)</option>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
              <option value="Asia/Singapore">Singapore / Hong Kong (SGT)</option>
              <option value="Asia/Tokyo">Tokyo / Japan (JST)</option>
              <option value="Australia/Sydney">Sydney / Australia (AEST)</option>
              <option value="UTC">Universal Coordinated Time (UTC)</option>
            </optgroup>
          </select>

          {localTz && localTz !== activeTz && (
            <button
              type="button"
              onClick={() => handleTimezoneSelect(localTz)}
              className="text-[11px] text-text-muted hover:text-gold underline transition-colors shrink-0"
              title={`Switch to device time zone (${localTz})`}
            >
              Use My Device Time ({localTz.split("/").pop()?.replace(/_/g, " ")})
            </button>
          )}
        </div>
      </div>

      {/* Times */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-sm font-semibold text-ink">Choose an available slot</p>
          <span className="text-xs text-text-muted inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            Showing in {activeTz === "America/New_York" ? "Eastern Time (Virginia)" : activeTz.replace(/_/g, " ")}
          </span>
        </div>

        {!selectedDate && !loadingDays ? (
          <p className="text-sm text-text-muted p-4 rounded-xl border border-white/[0.07]">
            No open days in this range. Try later dates.
          </p>
        ) : loadingSlots ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : dayReason ? (
          <p className="text-sm text-text-muted p-4 rounded-xl border border-white/[0.07]">{dayReason}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {slots.map((s) => {
              const active = value?.date === selectedDate && value?.time === s.time;
              return (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => onChange({ date: selectedDate!, time: s.time, start: s.start })}
                  className={`min-h-[48px] rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-300 flex flex-col items-center justify-center ${
                    active
                      ? "bg-gold text-[#0C0B0A] border-gold shadow-[0_8px_20px_-10px_rgba(249, 115, 22,0.7)]"
                      : "border-white/10 bg-black/40 text-text hover:border-gold/50 hover:-translate-y-0.5"
                  }`}
                  aria-pressed={active}
                >
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Clock className={`w-3.5 h-3.5 ${active ? "" : "text-text-muted"}`} />
                    {fmtTime(s.start, activeTz)}
                  </span>
                  {activeTz !== (tz || "America/New_York") ? (
                    <span className={`text-[10px] ${active ? "text-[#0C0B0A]/70" : "text-text-muted"}`}>
                      ({fmtTime(s.start, tz || "America/New_York")} Virginia/ET)
                    </span>
                  ) : (
                    <span className={`text-[10px] ${active ? "text-[#0C0B0A]/70" : "text-text-muted"}`}>
                      Eastern Time
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
