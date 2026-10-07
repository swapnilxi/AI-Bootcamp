"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  BookPlus,
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Lock,
  Star,
  AlertCircle,
} from "lucide-react";
import { canCreateClasses, isAdminRole } from "@/lib/roles";
import { InstructorSelect } from "@/features/courses";

export default function NewClassPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [schedule, setSchedule] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState(0);
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [instructorId, setInstructorId] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center text-ink/60">
        <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-2" />
        Verifying instructor access...
      </div>
    );
  }

  const role = session?.user?.role;
  const isAdmin = isAdminRole(role);
  if (!canCreateClasses(role)) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-cream/20 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-cream mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-ink">Instructor Access Required</h2>
        <p className="text-sm text-ink/70">
          Only instructors and administrators can author new academy classes.
        </p>
        <Link
          href="/courses"
          className="inline-block px-5 py-2.5 rounded-xl bg-cream text-[#0C0B0A] text-sm font-medium hover:bg-cream/90 transition-colors"
        >
          Return to Classes
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          content,
          schedule: new Date(schedule).toISOString(),
          durationMinutes: Number(durationMinutes),
          price: Number(price),
          isSubscriberOnly,
          isPasswordProtected,
          password: isPasswordProtected ? password : undefined,
          instructorId: isAdmin && instructorId ? instructorId : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create class");
        setLoading(false);
        return;
      }

      // Straight to the editor so the author can add lessons
      router.push(`/courses/${data.course.id}/edit?created=1#lessons`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected network error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-mist">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-gold transition-colors mb-2 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Classes</span>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink flex items-center gap-3">
          <BookPlus className="w-7 h-7 text-cream" />
          <span>Create New AI Engineering Class</span>
        </h1>
        <p className="text-sm text-ink/60 mt-1">
          Author a new curriculum, configure access tiers, and set session dates.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-cream/8 border border-cream/20 text-text text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Class Form */}
      <form onSubmit={handleSubmit} className="p-8 sm:p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
            Class Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hybrid Retrieval & Reranking"
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
            Short Description / Overview
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief overview of the topics, learning outcomes, and prerequisites..."
            className="w-full p-4 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
            </label>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Detailed syllabus, meeting links, video embeds, download URLs..."
            className="w-full p-4 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm font-mono bg-black/60"
          />
          <p className="text-xs text-ink/50 mt-1.5">
            This content is protected and only revealed to enrolled/authorized students.
          </p>
        </div>

        {/* Schedule & Duration & Price */}
        {isAdmin && (
          <div>
            <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
              Teaching Instructor
            </label>
            <InstructorSelect value={instructorId} onChange={setInstructorId} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
              Date & Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
              />
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-ink/40" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
              Duration (Minutes)
            </label>
            <div className="relative">
              <input
                type="number"
                min={15}
                max={360}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
              />
              <Clock className="absolute left-3.5 top-3 w-4 h-4 text-ink/40" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
              Price ($ USD, 0 = Free)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
              />
              <DollarSign className="absolute left-3.5 top-3 w-4 h-4 text-ink/40" />
            </div>
          </div>
        </div>

        {/* Access Restrictions Toggles */}
        <div className="pt-4 border-t border-mist space-y-4">
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Access Controls</h3>

          {/* Subscriber Only Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-ivory border border-mist">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cream/10 flex items-center justify-center text-cream">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Subscriber Only Class</p>
                <p className="text-xs text-ink/60">
                  Restrict enrollment exclusively to users with Subscriber or Admin tiers.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSubscriberOnly}
                onChange={(e) => setIsSubscriberOnly(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-mist peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-mist after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
            </label>
          </div>

          {/* Password Protection Toggle */}
          <div className="p-4 rounded-2xl bg-ivory border border-mist space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cream/10 flex items-center justify-center text-cream">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Password Protected Access Key</p>
                  <p className="text-xs text-ink/60">
                    Require students to enter a secret key password to enroll and access materials.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPasswordProtected}
                  onChange={(e) => setIsPasswordProtected(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-mist peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-mist after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>

            {isPasswordProtected && (
              <div className="pt-2 animate-fadeIn">
                <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
                  Secret Class Access Password (Will be securely hashed with bcrypt)
                </label>
                <input
                  type="password"
                  required={isPasswordProtected}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set secret class password..."
                  className="w-full px-4 py-2.5 rounded-xl border border-cream/40 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Link
            href="/courses"
            className="px-6 py-3 rounded-xl border border-mist text-sm font-medium text-ink/70 hover:bg-mist/30 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? "Publishing Class..." : "Publish AI Engineering Class"}
          </button>
        </div>
      </form>
    </div>
  );
}
