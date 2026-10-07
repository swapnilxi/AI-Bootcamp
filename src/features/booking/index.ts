/**
 * Booking feature — public, client-safe surface.
 *
 * Server pieces (Prisma access, availability resolution, route handlers) live
 * behind `@/features/booking/server` and must not be imported from the browser.
 */

// Types
export type {
  BookingRecord,
  BookingStatus,
  BookingView,
  DayAvailability,
  NotifyChannel,
  MentorRef,
  Slot,
} from "./types";
export type { SlotValue } from "./components/SlotPicker";

// Components
export { SlotPicker } from "./components/SlotPicker";
export { MentorBookingModal } from "./components/MentorBookingModal";

// Timezone helpers — pure Intl, no server dependency, safe on the client
export {
  addDays,
  dayOfWeekOf,
  formatInZone,
  isValidTimeZone,
  minutesToTime,
  timeToMinutes,
  utcToZoned,
  zonedToUtc,
} from "./lib/time";

// Validation schemas, shared between client forms and server handlers
export { createBookingSchema, clientActionSchema } from "./schemas/booking";

export { BOOKING_ROUTES } from "./routes";
