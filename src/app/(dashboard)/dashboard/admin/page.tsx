"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  BookOpen,
  Sparkles,
  ExternalLink,
  Shield,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { AdminClients } from "@/components/admin/AdminClients";
import { AdminAvailability } from "@/components/admin/AdminAvailability";
import { AdminMentors } from "@/components/admin/AdminMentors";
import { AdminClassesReview } from "@/components/admin/AdminClassesReview";
import { EventDashboardPanel } from "@/features/events";

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<
    "bookings" | "clients" | "availability" | "services" | "classes" | "faculty" | "curriculum" | "events"
  >("bookings");
  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pendingFacultyCount, setPendingFacultyCount] = useState(0);
  const [pendingClassesCount, setPendingClassesCount] = useState(0);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [services, setServices] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const [bookRes, servRes, classRes, instRes, classRevRes] = await Promise.all([
        fetch("/api/bookings?view=upcoming"),
        fetch("/api/mentorship"),
        fetch("/api/courses"),
        fetch("/api/admin/instructors"),
        fetch("/api/admin/classes"),
      ]);

      if (bookRes.ok) {
        const bData = await bookRes.json();
        setUpcomingCount((bData.bookings || []).length);
        setPendingCount(bData.pendingCount ?? 0);
      }
      if (servRes.ok) {
        const sData = await servRes.json();
        setServices(sData.services || []);
      }
      if (classRes.ok) {
        const cData = await classRes.json();
        setClasses(cData.classes || []);
      }
      if (instRes.ok) {
        const iData = await instRes.json();
        setPendingFacultyCount(iData.pendingCount ?? 0);
      }
      if (classRevRes.ok) {
        const crData = await classRevRes.json();
        setPendingClassesCount((crData.pendingClassesCount ?? 0) + (crData.pendingModulesCount ?? 0));
      }
      const eventRes = await fetch("/api/events?filter=pending");
      if (eventRes.ok) {
        const eData = await eventRes.json();
        setPendingEventsCount((eData.events || []).length);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load administration data");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClass(id: string, title: string) {
    if (!confirm(`Are you sure you want to remove "${title}"?`)) return;

    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Top Console Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-mist pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo px-3 py-1 rounded-full bg-mist/60 border border-mist inline-block mb-2">
            Mentor Management Console
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal">
            AI Practice Operations
          </h1>
          <p className="text-sm text-ink/70 mt-1">
            Manage sessions, appointment rosters, client coordinates, and academy classes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button href="/book" variant="primary" size="md">
            <span>New Booking</span>
          </Button>
          <Button href="/courses/new" variant="secondary" size="md">
            <span>Author Class</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-clay/15 text-clay text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="editorial-card p-6 space-y-2">
          <span className="text-xs font-semibold uppercase text-indigo tracking-wider">
            Sessions
          </span>
          <div className="font-serif text-3xl font-medium text-ink">
            {upcomingCount}
            {pendingCount > 0 && <span className="text-base text-amber-300 ml-2">+{pendingCount} pending</span>}
          </div>
          <span className="text-xs text-ink/60">Upcoming confirmed sessions</span>
        </div>

        <div className="editorial-card p-6 space-y-2">
          <span className="text-xs font-semibold uppercase text-indigo tracking-wider">
            Active Services
          </span>
          <div className="font-serif text-3xl font-medium text-ink">{services.length}</div>
          <span className="text-xs text-ink/60">Session catalog offerings</span>
        </div>

        <div className="editorial-card p-6 space-y-2">
          <span className="text-xs font-semibold uppercase text-indigo tracking-wider">
            Academy Classes
          </span>
          <div className="font-serif text-3xl font-medium text-ink">{classes.length}</div>
          <span className="text-xs text-ink/60">Scheduled curriculums & workshops</span>
        </div>
      </div>

      {/* Console Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-mist pb-2">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "bookings"
            ? "bg-gold text-black shadow-sm"
            : "text-ink/70 hover:text-ink hover:bg-mist/40"
            }`}
        >
          Bookings
          {pendingCount > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "bookings" ? "bg-black/20" : "bg-amber-500/20 text-amber-300"}`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("clients")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "clients" ? "bg-gold text-black shadow-sm" : "text-ink/70 hover:text-ink hover:bg-mist/40"
            }`}
        >
          Clients
        </button>
        <button
          onClick={() => setActiveTab("availability")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "availability" ? "bg-gold text-black shadow-sm" : "text-ink/70 hover:text-ink hover:bg-mist/40"
            }`}
        >
          Availability
        </button>
        <button
          onClick={() => setActiveTab("faculty")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === "faculty"
            ? "bg-gold text-black shadow-sm"
            : "text-ink/70 hover:text-ink hover:bg-mist/40"
            }`}
        >
          <span>Instructors</span>
          {pendingFacultyCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "faculty" ? "bg-black text-amber-300" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
            >
              {pendingFacultyCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === "curriculum"
            ? "bg-gold text-black shadow-sm"
            : "text-ink/70 hover:text-ink hover:bg-mist/40"
            }`}
        >
          <span>Curriculum Approvals</span>
          {pendingClassesCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "curriculum" ? "bg-black text-amber-300" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
            >
              {pendingClassesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === "events"
            ? "bg-gold text-black shadow-sm"
            : "text-ink/70 hover:text-ink hover:bg-mist/40"
            }`}
        >
          <span>Events</span>
          {pendingEventsCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "events" ? "bg-black text-amber-300" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
            >
              {pendingEventsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "services"
            ? "bg-gold text-black shadow-sm"
            : "text-ink/70 hover:text-ink hover:bg-mist/40"
            }`}
        >
          Services Menu ({services.length})
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "classes"
            ? "bg-gold text-black shadow-sm"
            : "text-ink/70 hover:text-ink hover:bg-mist/40"
            }`}
        >
          All Classes ({classes.length})
        </button>
      </div>

      {/* TAB: FACULTY & HEALERS APPROVALS */}
      {activeTab === "faculty" && <AdminMentors />}

      {/* TAB: CURRICULUM & MODULES APPROVALS */}
      {activeTab === "curriculum" && <AdminClassesReview />}

      {/* TAB: EVENT APPROVALS & COMMUNITY REQUESTS */}
      {activeTab === "events" && <EventDashboardPanel />}

      {/* TAB 1: CONSULTATION BOOKINGS */}
      {activeTab === "bookings" && (
        <Suspense fallback={<p className="text-sm text-text-muted">Loading bookings…</p>}>
          <AdminBookings onPendingCount={setPendingCount} />
        </Suspense>
      )}

      {activeTab === "clients" && <AdminClients />}

      {activeTab === "availability" && <AdminAvailability />}

      {/* TAB 2: SERVICES MENU */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-ink font-medium">Session Offerings</h2>
            <Link
              href="/mentorship"
              className="text-xs font-semibold text-indigo hover:underline flex items-center gap-1"
            >
              <span>View Public Menu</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => (
              <div key={svc.id} className="editorial-card p-6 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo">
                    {svc.category}
                  </span>
                  <h3 className="font-serif text-xl text-ink font-medium mt-1">{svc.title}</h3>
                  <p className="text-xs text-ink/70 mt-1 line-clamp-2">{svc.shortDesc}</p>
                </div>
                <div className="pt-3 border-t border-mist flex items-baseline justify-between text-sm">
                  <span className="font-serif text-2xl font-bold text-ink">${svc.price}</span>
                  <span className="text-xs text-ink/60">{svc.durationMinutes} mins</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLASSES */}
      {activeTab === "classes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-ink font-medium">Academy Curriculums</h2>
            <Button href="/courses/new" variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              <span>Create New Class</span>
            </Button>
          </div>

          <div className="editorial-card overflow-hidden">
            <table className="w-full text-left text-sm text-ink/80">
              <thead className="bg-mist/40 text-xs font-semibold uppercase text-indigo tracking-wider border-b border-mist">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Lessons</th>
                  <th className="py-3 px-4">Access Tier</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">{c.title}</td>
                    <td className="py-3 px-4 text-xs text-ink/70">{c.instructor?.name || "—"}</td>
                    <td className="py-3 px-4 text-xs text-ink/70">{c.lessonCount ?? 0}</td>
                    <td className="py-3 px-4 text-xs">
                      {c.isPasswordProtected ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold">
                          Key Protected
                        </span>
                      ) : c.isSubscriberOnly ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25 font-semibold">
                          Subscriber
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-semibold">
                          Public Free
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-ink/70">
                      {new Date(c.schedule).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-serif font-medium">
                      {c.price === 0 ? "Free" : `$${c.price}`}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/courses/${c.id}`}
                          className="p-1.5 rounded hover:bg-mist text-ink/70"
                          title="View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/courses/${c.id}/edit`}
                          className="p-1.5 rounded hover:bg-mist text-indigo"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClass(c.id, c.title)}
                          className="p-1.5 rounded hover:bg-clay/20 text-clay"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
