"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role");
  const callbackUrl = searchParams.get("callbackUrl") || (initialRoleParam === "instructor" ? "/dashboard/instructor" : "/dashboard");

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
      router.push(callbackUrl);
      router.refresh();
    }
  }

  function setDemoCredentials(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Tab Switcher: Learner vs Instructor */}
      <div className="flex p-1 rounded-xl bg-black-raised border border-white/[0.08] shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("learner")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "learner"
              ? "bg-cream text-[#0C0B0A] shadow-sm"
              : "text-text-muted hover:text-ink"
          }`}
        >
          Learner / Client
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("instructor");
            if (!email) {
              setDemoCredentials("instructor@aibootcamp.com", "InstructorStars2026!");
            }
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "instructor"
              ? "bg-cream text-[#0C0B0A] shadow-sm"
              : "text-text-muted hover:text-ink"
          }`}
        >
          <Icon name="role-instructor" variant="filled" size={14} />
          <span>Academy Instructor</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-full bg-black-raised border border-cream/30 text-cream font-serif text-2xl font-bold items-center justify-center mb-1 shadow-sm">
          M
        </div>
        <h1 className="font-serif text-3xl font-normal text-ink">
          {activeTab === "instructor" ? "Academy Instructor Studio" : "Client & Student Portal"}
        </h1>
        <p className="text-sm text-ink/70">
          {activeTab === "instructor"
            ? "Sign in with your mentor credentials to author classes, manage lessons, and track students."
            : "Sign in to access your sessions, birth charts, and courses."}
        </p>
      </div>

      {/* Card */}
      <div className="editorial-card p-8 sm:p-10 space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-cream/10 border border-cream/30 text-cream text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              {activeTab === "instructor" ? "Instructor Email Address" : "Email Address"}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === "instructor" ? "instructor@aibootcamp.com" : "client@aibootcamp.com"}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-mist bg-black/60 text-ink text-base focus:outline-none focus:border-gold"
                autoComplete="email"
              />
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-ink/40 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-cream hover:underline transition-colors"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-mist bg-black/60 text-ink text-base focus:outline-none focus:border-gold"
                autoComplete="current-password"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-ink/40 pointer-events-none" />
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
              ? "Sign In to Instructor Studio"
              : "Sign In to Portal"}
          </Button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="pt-4 border-t border-mist space-y-2">
          <p className="text-xs text-ink/60 font-medium text-center">
            {activeTab === "instructor" ? "Quick Demo Instructor Account:" : "Demo Mentor & Student Accounts:"}
          </p>

          {activeTab === "instructor" ? (
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials("instructor@aibootcamp.com", "InstructorStars2026!")}
                className="w-full p-3 rounded-lg bg-black-raised hover:border-cream border border-cream/40 text-text text-left transition-colors font-medium flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Icon name="role-instructor" variant="filled" size={16} className="text-cream" />
                  <div>
                    <p className="font-semibold text-cream">Aria Vale (Instructor)</p>
                    <p className="text-[11px] text-text-muted">instructor@aibootcamp.com</p>
                  </div>
                </div>
                <span className="text-[11px] text-cream font-semibold uppercase tracking-wider">Use Credentials →</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials("instructor@aibootcamp.com", "InstructorStars2026!")}
                className="p-2.5 rounded-lg bg-black-raised hover:border-cream/50 border border-cream/30 text-text text-left transition-colors font-medium flex items-center gap-2"
              >
                <Icon name="role-instructor" variant="filled" size={16} className="text-cream" />
                <span className="text-cream">Instructor</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("admin@aibootcamp.com", "AI EngineeringAdmin2026!")}
                className="p-2.5 rounded-lg bg-black-raised hover:border-gold/50 border border-black-line text-text text-left transition-colors font-medium flex items-center gap-2"
              >
                <Icon name="role-admin" variant="filled" size={16} className="text-cream" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("subscriber@aibootcamp.com", "CosmicSubscriber2026!")}
                className="p-2.5 rounded-lg bg-black-raised hover:border-gold/50 border border-black-line text-text text-left transition-colors font-medium flex items-center gap-2"
              >
                <Icon name="role-subscriber" variant="filled" size={16} className="text-cream" />
                <span>Subscriber</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("user@aibootcamp.com", "CosmicUser2026!")}
                className="p-2.5 rounded-lg bg-black-raised hover:border-gold/50 border border-black-line text-text text-left transition-colors font-medium flex items-center gap-2"
              >
                <Icon name="role-user" variant="filled" size={16} className="text-cream" />
                <span>Client (User)</span>
              </button>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-ink/70 space-y-1.5">
          <div>
            Don&apos;t have an account?{" "}
            <Link
              href={activeTab === "instructor" ? "/register?role=instructor" : "/register"}
              className="text-cream hover:underline font-semibold"
            >
              {activeTab === "instructor" ? "Register as an Instructor" : "Create an Account"}
            </Link>
          </div>
          {activeTab !== "instructor" && (
            <div>
              Are you an instructor?{" "}
              <Link href="/register?role=instructor" className="text-cream hover:underline font-medium">
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
          <div className="text-center text-ink/60 text-sm">
            Loading portal...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
