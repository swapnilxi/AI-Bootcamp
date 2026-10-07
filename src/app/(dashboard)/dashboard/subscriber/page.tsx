"use client";

import React, { useState, useEffect } from "react";
import { isSubscriberRole } from "@/lib/roles";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  Star,
  BookOpen,
  Calendar,
  Lock,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { ClassCard, type ClassItem } from "@/features/courses";

export default function SubscriberDashboardPage() {
  const { data: session } = useSession();
  const [subscriberClasses, setSubscriberClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const role = session?.user?.role;
  const isSubscriber = isSubscriberRole(role);

  useEffect(() => {
    async function loadSubscriberClasses() {
      try {
        const res = await fetch("/api/courses?filter=subscriber");
        if (res.ok) {
          const data = await res.json();
          setSubscriberClasses(data.classes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSubscriberClasses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="p-8 sm:p-12 rounded-3xl shadow-lg relative overflow-hidden bg-[linear-gradient(135deg,#21140f_0%,#141417_55%,#0f0f12_100%)] text-text border border-cream/25">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-cream border border-cream/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Member Member Area</span>
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
              AI Engineering Circle Membership
            </h1>
            <p className="text-white/80 text-base max-w-2xl leading-relaxed">
              Unrestricted access to the full course catalogue, every AI lab, unlimited practice, and priority mentor booking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/user"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-colors"
            >
              View Basic Dashboard
            </Link>
          </div>
        </div>
      </div>

      {!isSubscriber && (
        <div className="p-6 rounded-2xl bg-cream/10 border border-cream/30 text-ink text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-cream shrink-0" />
            <span>
              You are currently viewing this preview with a free account. Upgrade or contact administration to activate your Member membership.
            </span>
          </div>
          <Link
            href="/courses"
            className="px-5 py-2.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-xs shrink-0 shadow-sm transition-colors"
          >
            Explore courses
          </Link>
        </div>
      )}

      {/* Subscriber Exclusive Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-xl bg-cream/10 flex items-center justify-center text-cream">
            <Star className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-ink">Full Course Access</h3>
          <p className="text-sm text-ink/70 leading-relaxed">
            Every course, lab and project on every path, with no per-course fee.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-xl bg-cream/10 flex items-center justify-center text-cream">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-ink">Monthly Field Report</h3>
          <p className="text-sm text-ink/70 leading-relaxed">
            A monthly read on what changed in AI engineering, filtered to the skills on your path.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-xl bg-cream/10 flex items-center justify-center text-cream">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-ink">Direct Mentor Exchanges</h3>
          <p className="text-sm text-ink/70 leading-relaxed">
            Submit your project for live review during the bi-weekly member session with a verified instructor.
          </p>
        </div>
      </div>

      {/* Subscriber Courses Catalog */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between pb-3 border-b border-mist">
          <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cream" />
            <span>Exclusive Subscriber Courses</span>
          </h2>
          <span className="text-xs text-ink/60 font-medium">
            {subscriberClasses.length} Course(s) Available
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Sparkles className="w-8 h-8 text-cream animate-spin mx-auto mb-4" />
            <p className="text-base text-ink/60">Loading courses...</p>
          </div>
        ) : subscriberClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriberClasses.map((item) => (
              <ClassCard key={item.id} classItem={item} userRole={role} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] text-center text-ink/60 text-sm shadow-sm">
            No exclusive subscriber courses currently scheduled. Check back soon for the next seasonal curriculum.
          </div>
        )}
      </div>
    </div>
  );
}
