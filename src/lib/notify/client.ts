// Client-safe notification types/helpers (no server imports).

export interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export type NotificationCategory = "learning" | "reviews" | "bookings" | "events" | "account" | "announcements";

export const CATEGORIES: { key: NotificationCategory; label: string }[] = [
  { key: "learning", label: "Learning" },
  { key: "reviews", label: "Reviews" },
  { key: "bookings", label: "Bookings" },
  { key: "events", label: "Events" },
  { key: "account", label: "Account" },
  { key: "announcements", label: "Announcements" },
];

export type NotificationIconName =
  | "graduation" | "trophy" | "users" | "card" | "chart" | "clipboard" | "badge" | "calendar" | "event" | "user" | "megaphone" | "alert" | "bell";

const RULES: { match: (k: string) => boolean; category: NotificationCategory; icon: NotificationIconName }[] = [
  { match: (k) => k === "course_completed" || k === "learner_completed", category: "learning", icon: "trophy" },
  { match: (k) => k === "enrollment_milestone", category: "learning", icon: "trophy" },
  { match: (k) => k.includes("enroll"), category: "learning", icon: "graduation" },
  { match: (k) => k === "payment_received", category: "learning", icon: "card" },
  { match: (k) => k === "creator_digest", category: "learning", icon: "chart" },
  { match: (k) => k.startsWith("review_submitted") || k.startsWith("class_"), category: "reviews", icon: "clipboard" },
  { match: (k) => k.startsWith("profile_") || k === "instructor_applied", category: "reviews", icon: "badge" },
  { match: (k) => k === "admin_alert", category: "reviews", icon: "alert" },
  { match: (k) => k.startsWith("booking_") || k.startsWith("admin_booking_"), category: "bookings", icon: "calendar" },
  { match: (k) => k.startsWith("event_"), category: "events", icon: "event" },
  { match: (k) => k === "welcome" || k === "role_changed", category: "account", icon: "user" },
  { match: (k) => k === "broadcast" || k === "custom", category: "announcements", icon: "megaphone" },
];

/** Category + icon for a notification kind. Unknown kinds fall back to "announcements" / bell. */
export function kindMeta(kind: string): { category: NotificationCategory; icon: NotificationIconName } {
  return RULES.find((r) => r.match(kind)) ?? { category: "announcements", icon: "bell" };
}

/** "Today" / "Yesterday" / "Earlier this week" / "Older" bucket for grouping. */
export function dayGroup(iso: string): string {
  const d = new Date(iso);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "Earlier this week";
  return "Older";
}
