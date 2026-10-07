"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted px-3.5 py-1.5 rounded-full bg-black-raised border border-black-line inline-block">
          Direct Inquiries
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text font-normal leading-tight">
          Contact the Practice
        </h1>
        <p className="text-base sm:text-lg text-text-muted leading-relaxed font-sans">
          Have a question prior to booking? We respond to all written inquiries within 24 hours on business days.
        </p>
      </div>

      {/* Main Grid: Details (Left) + Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Contact Information & Channels */}
        <div className="space-y-8">
          <div className="editorial-card p-8 space-y-6">
            <h2 className="font-serif text-2xl text-text font-normal">
              Direct Communication Channels
            </h2>

            <div className="space-y-5 text-base">
              {/* WhatsApp (Single color gold, no off-brand green) */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-black border border-black-line flex items-center justify-center shrink-0 mt-0.5 text-text-muted">
                  <Icon name="whatsapp" variant="filled" size={18} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">WhatsApp Direct</span>
                  <a
                    href="https://wa.me/15551234567?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20an%20AI%20session"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-text hover:text-gold text-lg transition-colors"
                  >
                    +1 (555) 123-4567
                  </a>
                  <p className="text-xs text-text-muted mt-0.5">
                    Fastest for scheduling inquiries and availability questions.
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-black border border-black-line flex items-center justify-center shrink-0 mt-0.5 text-text-muted">
                  <Icon name="mail" variant="line" size={18} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Confidential Email</span>
                  <a
                    href="mailto:consult@aibootcamp.com"
                    className="font-medium text-text hover:text-gold text-lg transition-colors"
                  >
                    consult@aibootcamp.com
                  </a>
                  <p className="text-xs text-text-muted mt-0.5">
                    For detailed background notes or birth data transmissions.
                  </p>
                </div>
              </div>

              {/* Practice Hours */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-black border border-black-line flex items-center justify-center shrink-0 mt-0.5 text-text-muted">
                  <Icon name="clock" variant="line" size={18} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Clinic Hours</span>
                  <p className="font-medium text-text text-base">
                    Monday – Friday: 10:00 – 18:00
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Appointments outside standard hours available by prior arrangement.
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-black border border-black-line flex items-center justify-center shrink-0 mt-0.5 text-text-muted">
                  <Icon name="role-admin" variant="line" size={18} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Meeting Location</span>
                  <p className="font-medium text-text text-base">
                    Virtual Zoom Studio (Global) & In-Person by Invitation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Booking Redirect */}
          <div className="p-6 rounded bg-black-raised border border-black-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-serif text-lg font-normal text-text">Ready to schedule directly?</p>
              <p className="text-xs text-text-muted">Takes under 2 minutes with no account required.</p>
            </div>
            <Button href="/book" variant="primary" size="md">
              <span>Book Session</span>
              <Icon name="arrow" variant="line" size={14} className="ml-1" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="editorial-card p-8 sm:p-10 space-y-6">
          <h2 className="font-serif text-2xl text-text font-normal border-b border-black-line pb-4">
            Send a Written Message
          </h2>

          {sent ? (
            <div className="p-8 text-center space-y-4">
              <Icon name="check" variant="line" size={48} className="text-gold mx-auto" />
              <h3 className="font-serif text-2xl text-text font-normal">Message Transmitted</h3>
              <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
                Thank you, {name}. Your inquiry has been forwarded directly to the mentor. We will respond within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setName("");
                  setEmail("");
                  setSubject("");
                  setMessage("");
                }}
                className="text-xs font-semibold uppercase tracking-wider text-text-muted hover:underline pt-2 block mx-auto"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Eleanor Vance"
                  className="w-full px-4 py-2.5 rounded border border-black-line bg-black text-text text-sm focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Your Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="eleanor@example.com"
                  className="w-full px-4 py-2.5 rounded border border-black-line bg-black text-text text-sm focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Subject / Area of Interest
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question regarding Career Session or Birth Time"
                  className="w-full px-4 py-2.5 rounded border border-black-line bg-black text-text text-sm focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Message *
                </label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please write your questions here..."
                  className="w-full p-4 rounded border border-black-line bg-black text-text text-sm resize-none focus:outline-none focus:border-gold"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" className="w-full">
                  <span>Send Inquiry</span>
                  <Icon name="arrow" variant="line" size={16} className="ml-1.5" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
