"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, Mail, User, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialName = searchParams.get("name") || "";
  const initialRole = searchParams.get("role") === "instructor" ? "INSTRUCTOR" : "USER";

  const [role, setRole] = useState<"USER" | "INSTRUCTOR">(initialRole);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          bio: role === "INSTRUCTOR" ? bio || undefined : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login?registered=true");
      } else {
        // Instructor applicants land as regular users with a "profile under verification" notice
        router.push("/dashboard/user");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Role Selection Tabs */}
      <div className="flex p-1 rounded-xl bg-black-raised border border-white/[0.08] shadow-inner">
        <button
          type="button"
          onClick={() => setRole("USER")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            role === "USER"
              ? "bg-orange text-white shadow-sm"
              : "text-text-muted hover:text-ink"
          }`}
        >
          Learner / Student
        </button>
        <button
          type="button"
          onClick={() => setRole("INSTRUCTOR")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            role === "INSTRUCTOR"
              ? "bg-orange text-white shadow-sm"
              : "text-text-muted hover:text-ink"
          }`}
        >
          <Icon name="role-instructor" variant="filled" size={14} />
          <span>Academy Instructor</span>
        </button>
      </div>

      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-full bg-black-raised border border-cream/30 text-cream font-serif text-2xl font-bold items-center justify-center mb-1 shadow-sm">
          M
        </div>
        <h1 className="font-serif text-3xl font-normal text-ink">
          {role === "INSTRUCTOR" ? "Join Academy Faculty" : "Create Client Account"}
        </h1>
        <p className="text-sm text-ink/70">
          {role === "INSTRUCTOR"
            ? "Apply to join the faculty. You start as a regular member while administration verifies your profile."
            : "Track your skill graph, keep a streak and pick up where you left off."}
        </p>
      </div>

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
              Full Legal / Preferred Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "INSTRUCTOR" ? "Dr. Jonathan Cross" : "Eleanor Vance"}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-mist bg-black/60 text-ink text-base focus:outline-none focus:border-gold"
              />
              <User className="absolute left-3.5 top-3 w-4 h-4 text-ink/40 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === "INSTRUCTOR" ? "jonathan@example.com" : "eleanor@example.com"}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-mist bg-black/60 text-ink text-base focus:outline-none focus:border-gold"
              />
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-ink/40 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Password (min 8 chars, 1 uppercase, 1 number)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-mist bg-black/60 text-ink text-base focus:outline-none focus:border-gold"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-ink/40 pointer-events-none" />
            </div>
          </div>

          {role === "INSTRUCTOR" && (
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Background & Specialisation (Bio)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Staff ML engineer, 6 years building retrieval and agent systems in production..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-cream/30 bg-black/60 text-ink text-xs focus:outline-none focus:border-gold resize-none"
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading
              ? "Creating Account..."
              : role === "INSTRUCTOR"
              ? "Register as Academy Instructor"
              : "Create Client Account"}
          </Button>
        </form>

        <div className="text-center text-xs text-ink/70 pt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-cream hover:underline font-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="py-24 text-center text-ink/60">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
