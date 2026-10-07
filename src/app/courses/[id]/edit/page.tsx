"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Lock,
  Star,
  AlertCircle,
  Save,
} from "lucide-react";
import { isAdminRole } from "@/lib/roles";
import { InstructorSelect, LessonManager } from "@/features/courses";

export default function EditClassPage() {
  const params = useParams();
  const id = params?.id as string;
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
  const [originalInstructorId, setOriginalInstructorId] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>("APPROVED");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const justCreated = useSearchParams().get("created") === "1";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchClass();
    }
  }, [id]);

  async function fetchClass() {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error("Failed to load class");

      const data = await res.json();
      const c = data.course;
      setTitle(c.title);
      setDescription(c.description);
      setContent(c.content || "");
      if (c.schedule) {
        const d = new Date(c.schedule);
        // format for datetime-local input YYYY-MM-DDTHH:mm
        const pad = (n: number) => n.toString().padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setSchedule(formatted);
      }
      setDurationMinutes(c.durationMinutes);
      setPrice(c.price);
      setIsSubscriberOnly(c.isSubscriberOnly);
      setIsPasswordProtected(c.isPasswordProtected);
      setCanManage(!!c.canManage);
      setReviewStatus(c.approvalStatus || "APPROVED");
      setRejectionReason(c.rejectionReason || null);
      setInstructorId(c.instructorId || "");
      setOriginalInstructorId(c.instructorId || "");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load class data");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center text-ink/60">
        <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-2" />
        Loading class details...
      </div>
    );
  }

  const isAdmin = isAdminRole(session?.user?.role);
  if (!canManage) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-cream/20 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-cream mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-ink">Only this class&apos;s instructor or an administrator can edit it</h2>
        <Link
          href={`/courses/${id}`}
          className="inline-block px-5 py-2.5 rounded-xl bg-cream text-black text-sm font-medium hover:bg-cream/90 transition-colors"
        >
          Return to Class
        </Link>
      </div>
    );
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
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
          password: isPasswordProtected && password ? password : undefined,
          ...(isAdmin && instructorId && instructorId !== originalInstructorId && { instructorId }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update class");
        setSaving(false);
        return;
      }

      // Stay on the editor so lessons can be managed alongside class details
      setSaving(false);
      setOriginalInstructorId(instructorId);
      if (reviewStatus === "REJECTED" && !isAdmin) {
        setReviewStatus("PENDING");
        setRejectionReason(null);
      }
      setSavedMsg("Class details saved.");
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update class");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="pb-6 border-b border-mist">
        <Link
          href={`/courses/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-gold transition-colors mb-2 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View Class</span>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Edit AI Engineering Class</h1>
      </div>

      {justCreated && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">
          Class created. Now add lessons below to build the curriculum.
        </div>
      )}
      {reviewStatus === "REJECTED" && (
        <div className="p-4 rounded-xl bg-cream/8 border border-cream/20 text-text text-sm">
          This class was declined{rejectionReason ? `: ${rejectionReason}` : "."} Saving your changes resubmits it for review.
        </div>
      )}
      {reviewStatus === "PENDING" && (
        <div className="p-4 rounded-xl bg-cream/8 border border-cream/20 text-text text-sm">
          This class is under review and not yet visible to learners. You can keep editing meanwhile.
        </div>
      )}
      {savedMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">
          {savedMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-cream/8 border border-cream/20 text-text text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="p-8 sm:p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
            Class Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
            Short Description
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-4 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
            Course Overview & Materials (optional)
          </label>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm font-mono bg-black/60"
          />
        </div>

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
              Price ($ USD)
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

        <div className="pt-4 border-t border-mist space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-ivory border border-mist">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cream/10 flex items-center justify-center text-cream">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Subscriber Only Class</p>
                <p className="text-xs text-ink/60">Restrict access exclusively to subscribers.</p>
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

          <div className="p-4 rounded-2xl bg-ivory border border-mist space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cream/10 flex items-center justify-center text-cream">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Password Protection</p>
                  <p className="text-xs text-ink/60">Require an invitation access key.</p>
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
              <div className="pt-2">
                <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
                  Update Secret Password (Leave blank to keep existing password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (optional)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-cream/40 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Link
            href={`/courses/${id}`}
            className="px-6 py-3 rounded-xl border border-mist text-sm font-medium text-ink/70 hover:bg-mist/30 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-cream hover:bg-cream/90 text-black font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Class Details"}</span>
          </button>
        </div>
      </form>

      <LessonManager courseId={id} />
    </div>
  );
}
