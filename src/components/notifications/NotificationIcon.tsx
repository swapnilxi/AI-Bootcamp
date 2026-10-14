import { AlertCircle, BadgeCheck, Bell, BarChart3, CalendarDays, ClipboardCheck, CreditCard, GraduationCap, Megaphone, PartyPopper, Trophy, User, Users } from "lucide-react";
import { kindMeta, type NotificationIconName } from "@/lib/notify/client";

const ICONS: Record<NotificationIconName, typeof Bell> = {
  graduation: GraduationCap,
  trophy: Trophy,
  users: Users,
  card: CreditCard,
  chart: BarChart3,
  clipboard: ClipboardCheck,
  badge: BadgeCheck,
  calendar: CalendarDays,
  event: PartyPopper,
  user: User,
  megaphone: Megaphone,
  alert: AlertCircle,
  bell: Bell,
};

/** Round icon chip chosen from the notification's kind. */
export function NotificationIcon({ kind, size = 14 }: { kind: string; size?: number }) {
  const Cmp = ICONS[kindMeta(kind).icon];
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange/25 bg-orange/10 text-orange">
      <Cmp size={size} />
    </span>
  );
}
