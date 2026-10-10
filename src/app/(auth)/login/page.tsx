"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role");
  const callbackUrl =
    searchParams.get("callbackUrl") ||
    (initialRoleParam === "instructor" ? "/dashboard/instructor" : "/dashboard");

  const [activeTab, setActiveTab] = useState<"learner" | "instructor">(
    initialRoleParam === "instructor" ? "instructor" : "learner"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      const explicitCallback = searchParams.get("callbackUrl");
      router.push(explicitCallback || "/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Tab Switcher: Learner vs Faculty */}
      <div className="flex p-1.5 rounded-2xl bg-surface-elevated border border-line shadow-sm">
        <button
          type="button"
          onClick={() => {
            setActiveTab("learner");
            setError(null);
          }}
          className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "learner"
              ? "bg-orange text-white shadow-md shadow-orange/20"
              : "text-muted hover:text-ink hover:bg-surface/50"
          }`}
        >
          AI Learner / Student
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("instructor");
            setError(null);
          }}
          className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "instructor"
              ? "bg-orange text-white shadow-md shadow-orange/20"
              : "text-muted hover:text-ink hover:bg-surface/50"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="m8 10 2 2-2 2M13 14h3" />
          </svg>
          <span>Faculty &amp; Mentor</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange/10 border border-orange/30 text-orange shadow-[0_0_16px_rgba(255,115,21,0.2)] mb-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7 filter drop-shadow-[0_0_4px_rgba(255,115,21,0.4)]"
          >
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
            <circle cx="19" cy="5" r="1.5" fill="currentColor" />
            <circle cx="5" cy="19" r="1" fill="currentColor" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-normal text-ink">
          {activeTab === "instructor" ? "Mentor & Faculty Studio" : "AI Student & Engineer Portal"}
        </h1>
        <p className="text-sm text-muted">
          {activeTab === "instructor"
            ? "Sign in with your mentor credentials to manage cohorts, review capstones, and guide student projects."
            : "Sign in to access your learning paths, labs, code practice, and AI tutor."}
        </p>
      </div>

      {/* Card */}
      <div className="editorial-card p-8 sm:p-10 space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-orange/10 border border-orange/30 text-ink text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-orange mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              {activeTab === "instructor" ? "Mentor Email Address" : "Email Address"}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  activeTab === "instructor" ? "mentor@aibootcamp.com" : "student@aibootcamp.com"
                }
                style={{ paddingLeft: "3rem" }}
                className="w-full pr-4 py-3 rounded-xl border border-line bg-surface text-ink text-base focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30 transition-all placeholder:text-muted/50"
                autoComplete="email"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange/70 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-orange hover:underline transition-colors font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ paddingLeft: "3rem" }}
                className="w-full pr-4 py-3 rounded-xl border border-line bg-surface text-ink text-base focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30 transition-all placeholder:text-muted/50"
                autoComplete="current-password"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange/70 pointer-events-none" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading
              ? "Authenticating..."
              : activeTab === "instructor"
              ? "Sign In to Mentor Studio"
              : "Sign In to Portal"}
          </Button>
        </form>

        <div className="text-center text-xs text-muted space-y-1.5 pt-2 border-t border-line">
          <div>
            Don&apos;t have an account?{" "}
            <Link
              href={activeTab === "instructor" ? "/register?role=instructor" : "/register"}
              className="text-orange hover:underline font-semibold"
            >
              {activeTab === "instructor" ? "Apply as a Mentor" : "Create an Account"}
            </Link>
          </div>
          {activeTab !== "instructor" && (
            <div>
              Are you an AI engineer or instructor?{" "}
              <Link href="/register?role=instructor" className="text-orange hover:underline font-medium">
                Apply to Teach at AI Bootcamp
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-center text-muted text-sm">
            Loading portal...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
