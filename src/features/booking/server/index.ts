/**
 * Booking feature — server-only surface. Never import from a client component.
 */
import "server-only";

export {
  assertSlotStillFree,
  getAvailabilityRange,
  getDayAvailability,
  practiceToday,
  resolveSlot,
  SlotTakenError,
} from "./availability";
export {
  appUrl,
  bookingAccessToken,
  generateReferenceCode,
  manageBookingUrl,
  verifyBookingToken,
} from "./access";
export { serializeBooking } from "./serialize";
export {
  defaultBookingSettings,
  getBookingSettings,
  saveBookingSettings,
} from "./settings";
export type { BookingSettings } from "./settings";

// Pure timezone helpers, re-exported so server code can take everything it needs
// from this one entry point without touching the client barrel.
export {
  addDays,
  dayOfWeekOf,
  formatInZone,
  isValidTimeZone,
  minutesToTime,
  timeToMinutes,
  utcToZoned,
  zonedToUtc,
} from "../lib/time";
