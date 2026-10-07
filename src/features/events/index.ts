/**
 * Events feature — public, client-safe surface.
 *
 * Everything exported here is safe to import from a client component. Server
 * pieces (Prisma queries, access checks, route handlers) live behind
 * `@/features/events/server` so they never reach the browser bundle.
 */

// Types
export type { EventItem } from "./components/EventCard";
export type {
    EventSummary,
    EventDetail,
    EventRequestSummary,
    EventRequestStatus,
    EventCategory,
    EventFilter,
    HostRef,
    ApprovalStatus,
} from "./types";
export { EVENT_CATEGORIES } from "./types";

// Validation schemas (isomorphic — reusable on the client for form validation)
export {
    createEventSchema,
    updateEventSchema,
    eventApprovalSchema,
    createEventRequestSchema,
    updateEventRequestSchema,
} from "./schemas/event";

// Components
export { EventCard, formatEventDate, formatEventTime } from "./components/EventCard";
export { EventForm } from "./components/EventForm";
export { EventRequestForm } from "./components/EventRequestForm";
export { EventApprovalPanel } from "./components/EventApprovalPanel";
export { EventDashboardPanel } from "./components/EventDashboardPanel";

// Hooks
export { useEvents } from "./hooks/useEvents";
export { useEventRequests } from "./hooks/useEventRequests";

// Route and page paths the feature owns
export { EVENT_ROUTES, EVENT_PATHS } from "./routes";