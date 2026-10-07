/**
 * Every URL the booking feature talks to. A host application mounting the
 * handlers under a different prefix only changes the constants here.
 */
const bookings = "/api/bookings";
const availability = "/api/availability";

export const BOOKING_ROUTES = {
  bookings,
  availability,
  list: (view?: string) => (view ? `${bookings}?view=${view}` : bookings),
  detail: (id: string, token?: string | null) =>
    token ? `${bookings}/${id}?t=${encodeURIComponent(token)}` : `${bookings}/${id}`,
  notify: (id: string) => `${bookings}/${id}/notify`,
  day: (date: string, duration: number) =>
    `${availability}?date=${date}&duration=${duration}`,
  range: (from: string, days: number, duration: number) =>
    `${availability}?from=${from}&days=${days}&duration=${duration}`,
} as const;
