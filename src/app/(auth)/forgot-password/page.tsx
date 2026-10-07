"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDemoToken(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process request");
      } else {
        setMessage(data.message);
        if (data.demoResetToken) {
          setDemoToken(data.demoResetToken);
        }
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 items-center justify-center text-gold mb-2 shadow-lg shadow-black/40">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Recover Access Key
          </h1>
          <p className="text-sm text-text-muted">
            Transmit your email to generate AI reset instructions
          </p>
        </div>

        <div className="p-8 rounded-2xl glass-panel border border-white/10 shadow-2xl space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Instructions Generated</span>
              </div>
              <p>{message}</p>

              {demoToken && (
                <div className="pt-2 border-t border-emerald-500/20">
                  <p className="text-[11px] text-emerald-400">Demo Reset Token (Development):</p>
                  <code className="block p-2 mt-1 rounded bg-cosmic-950 text-[10px] break-all text-cream">
                    {demoToken}
                  </code>
                  <Link
                    href={`/reset-password?token=${demoToken}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cream hover:underline"
                  >
                    Click to proceed with reset <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-2">
                Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="AI@aibootcamp.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-text-muted" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[linear-gradient(180deg,#FFB073_0%,#FF7315_55%,#DC4C00_100%)] hover:brightness-110 text-black font-semibold text-sm shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Transmitting..." : "Send Reset Token"}
            </button>
          </form>

          <div className="text-center text-xs text-text-muted">
            Remembered your credentials?{" "}
            <Link href="/login" className="text-text-muted hover:text-text font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
