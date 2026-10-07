"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Key, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const qToken = searchParams.get("token");
    if (qToken) {
      setToken(qToken);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Password reset failed");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 items-center justify-center text-gold mb-2 shadow-lg shadow-black/40">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Set New Password
        </h1>
        <p className="text-sm text-text-muted">
          Re-align your authentication key with the cosmos
        </p>
      </div>

      <div className="p-8 rounded-2xl glass-panel border border-white/10 shadow-2xl space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Password reset successful! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-2">
              Reset Token
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token here..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
              />
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-text-muted" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-2">
              New Password (min 8 chars, 1 uppercase, 1 number)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-text-muted" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-text-muted" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 rounded-xl bg-[linear-gradient(180deg,#FFB073_0%,#FF7315_55%,#DC4C00_100%)] hover:brightness-110 text-black font-semibold text-sm shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Aligning..." : "Update Password"}
          </button>
        </form>

        <div className="text-center text-xs text-text-muted">
          <Link href="/login" className="text-gold hover:text-amber-300 font-medium">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-center text-text-muted text-sm">
            <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-2" />
            Loading token...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
