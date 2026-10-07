"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Shield,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { Role } from "@prisma/client";
import Link from "next/link";
import { InstructorApplicationNotice } from "@/components/ui/InstructorApplicationNotice";
import { Avatar } from "@/components/ui/Avatar";

interface UserProfileData {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
  approvalStatus?: string;
  rejectionReason?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  timezone?: string | null;
  enrollments: Array<{
    id: string;
    enrolledAt: string;
    course: {
      id: string;
      title: string;
      slug: string;
      schedule: string;
      isSubscriberOnly: boolean;
      isPasswordProtected: boolean;
    };
  }>;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleChanging, setRoleChanging] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");

      const data = await res.json();
      setProfile(data.user);

      // Populate form
      setName(data.user.name || "");
      setAvatarUrl(data.user.avatarUrl || "");
      setPhone(data.user.phone || "");
      setBio(data.user.bio || "");
      setTimezone(data.user.timezone || "America/New_York");
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not load AI profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatarUrl: avatarUrl || undefined,
          phone,
          bio: bio || undefined,
          timezone: timezone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update profile");
      } else {
        setSuccessMsg("Profile updated.");
        setProfile((prev) => (prev ? { ...prev, ...data.user } : null));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(newRole: "INSTRUCTOR" | "USER") {
    setRoleChanging(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update role");
        return;
      }

      const nextRole = data.user?.role ?? profile?.role;
      setProfile((prev) =>
        prev ? { ...prev, role: nextRole, approvalStatus: data.user?.approvalStatus ?? prev.approvalStatus, rejectionReason: null } : null
      );
      await update?.({ user: { role: nextRole } });

      if (newRole === "INSTRUCTOR") {
        setSuccessMsg("Application submitted. Your profile is under verification; the Instructor Studio unlocks once an administrator approves it.");
      } else {
        setSuccessMsg("Your role has been set to Learner / Student.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not update role");
    } finally {
      setRoleChanging(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
        <p className="text-ink/60 text-base">Retrieving AI profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <Avatar src={profile?.avatarUrl} name={profile?.name} size="lg" glow />

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                  {profile?.name || "Learner"}
                </h1>
                <span className="text-xs px-3 py-1 rounded-full bg-mist text-ink font-semibold">
                  {profile?.role}
                </span>
              </div>
              <p className="text-sm text-ink/60">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {profile?.role === "INSTRUCTOR" && (
              <Link
                href="/dashboard/instructor"
                className="px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-xs font-semibold text-[#0C0B0A] flex items-center gap-2 transition-colors shadow-sm"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Instructor Studio</span>
              </Link>
            )}
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-ivory hover:bg-mist/60 text-xs font-semibold text-ink border border-mist flex items-center gap-2 transition-colors"
            >
              <Shield className="w-4 h-4 text-cream" />
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      <InstructorApplicationNotice
        role={profile?.role}
        approvalStatus={profile?.approvalStatus}
        rejectionReason={profile?.rejectionReason}
      />

      {/* Instructor Studio Activation & Status Banner */}
      <div id="instructor-activation" className="p-6 sm:p-8 rounded-3xl bg-[linear-gradient(135deg,#21140f_0%,#141417_50%,#0f0f12_100%)] border border-cream/20 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted font-semibold">
              <GraduationCap className="w-4 h-4" />
              <span>Academy Teaching Status</span>
            </span>
            <h3 className="font-serif text-2xl text-ink">
              {profile?.role === "INSTRUCTOR"
                ? "Active Academy Faculty Instructor"
                : profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN"
                ? "Faculty & Administrator"
                : "Teach at AI Bootcamp Academy"}
            </h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              {profile?.role === "INSTRUCTOR" || profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN"
                ? "You have full instructor privileges to design courses, manage lesson curricula, upload lecture recordings, and guide students."
                : "Transform your account into an Instructor profile to author AI engineering courses, share traditional methodology, and mentor students worldwide."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {profile?.role === "INSTRUCTOR" ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard/instructor"
                  className="px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Open Instructor Studio</span>
                </Link>
                <Link
                  href="/dashboard/instructor#profile-sections"
                  className="px-4 py-2.5 rounded-xl bg-black-raised hover:border-cream/40 border border-cream/25 text-cream text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Edit Profile Sections</span>
                </Link>
                {profile?.id && (
                  <Link
                    href={`/instructors/${profile.id}`}
                    className="px-4 py-2.5 rounded-xl bg-black-raised hover:border-gold/40 border border-white/10 text-ink text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cream" />
                    <span>Public Profile</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleRoleChange("USER")}
                  disabled={roleChanging}
                  className="px-3 py-2 text-xs text-text-muted hover:text-ink underline transition-colors"
                >
                  {roleChanging ? "Updating..." : "Switch to Learner"}
                </button>
              </div>
            ) : profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN" ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard/instructor"
                  className="px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Open Instructor Studio</span>
                </Link>
                {profile?.id && (
                  <Link
                    href={`/instructors/${profile.id}`}
                    className="px-4 py-2.5 rounded-xl bg-black-raised hover:border-gold/40 border border-white/10 text-ink text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cream" />
                    <span>Public Profile</span>
                  </Link>
                )}
              </div>
            ) : profile?.approvalStatus === "PENDING" ? (
              <>
                <span className="px-4 py-2.5 rounded-xl bg-cream/10 border border-cream/30 text-cream text-xs font-semibold uppercase tracking-wider">
                  Profile under verification
                </span>
                <button
                  type="button"
                  onClick={() => handleRoleChange("USER")}
                  disabled={roleChanging}
                  className="px-3 py-2 text-xs text-text-muted hover:text-ink underline transition-colors"
                >
                  Withdraw application
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleRoleChange("INSTRUCTOR")}
                disabled={roleChanging}
                className="px-6 py-3 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{roleChanging ? "Submitting..." : profile?.approvalStatus === "REJECTED" ? "Re-apply as Instructor" : "Apply to Become an Instructor"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Form + AI Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Edit Form */}
        <div className="lg:col-span-2 p-8 sm:p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-6">
          <div className="border-b border-mist pb-4">
            <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2.5">
              <UserIcon className="w-5 h-5 text-cream" />
              <span>Contact & Preferences</span>
            </h2>
            <p className="text-xs text-ink/60 mt-1">
              Used for session reminders and to schedule in your own time zone.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-cream/10 border border-cream/25 text-cream text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
                Phone / WhatsApp (with country code)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                autoComplete="tel"
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60"
              />
              <p className="text-[11px] text-text-muted mt-1">Used for session reminders and cohort updates.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2 flex flex-wrap items-center justify-between gap-1">
                <span>Preferred Time Zone</span>
                <span className="text-[11px] text-text-muted font-normal">Default: Eastern Time (Virginia & Surrounding)</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60 cursor-pointer"
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
              <p className="text-[11px] text-text-muted mt-1">
                Session schedules and course lecture times will display in this timezone.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
                AI Biography & Study Goals
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your AI background, areas of focus, or study goals..."
                className="w-full p-4 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Coordinates..." : "Save AI Profile"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* AI Insight Sidebar */}
        <div className="space-y-6">
          {/* Learning snapshot */}
          <div className="p-6 sm:p-8 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-4">
            <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cream" />
              <span>Learning Snapshot</span>
            </h3>

            <p className="text-xs text-ink/60 leading-relaxed">
              Your skill graph, learning strength and recommended next action live on your progress
              dashboard.
            </p>

            <Link
              href="/progress"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-cream/30 text-cream text-xs font-semibold uppercase tracking-wider hover:bg-cream/10 transition-colors"
            >
              Open progress
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Enrolled Classes Summary */}
          <div className="p-6 sm:p-8 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-4">
            <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cream" />
              <span>Your Courses ({profile?.enrollments?.length || 0})</span>
            </h3>

            {profile?.enrollments && profile.enrollments.length > 0 ? (
              <div className="space-y-2.5">
                {profile.enrollments.map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    href={`/courses/${enrollment.course.id}`}
                    className="block p-3.5 rounded-xl bg-ivory hover:bg-mist/40 border border-mist hover:border-gold/40 transition-all text-xs"
                  >
                    <p className="font-semibold text-ink truncate">{enrollment.course.title}</p>
                    <p className="text-[11px] text-ink/60 mt-1 flex items-center justify-between">
                      <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cream" />
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-ink/60 space-y-3">
                <p>You have not enrolled in any academy classes yet.</p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cream text-[#0C0B0A] font-medium hover:bg-cream/90 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Browse Catalog</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
