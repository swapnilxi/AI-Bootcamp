/**
 * Server-only surface for the events feature. Everything here touches Prisma
 * or the session, so it must never be imported from a client component.
 */
export { GET, POST } from "./routes/events";
export { GET as getEvent, PATCH as patchEvent, DELETE as deleteEvent } from "./routes/event-detail";
export { GET as getEventApproval, PUT as putEventApproval } from "./routes/event-approval";
export { POST as addInterest, DELETE as removeInterest } from "./routes/event-interest";
export { GET as getRequests, POST as createRequest } from "./routes/event-requests";
export {
    GET as getRequest,
    PATCH as patchRequest,
    DELETE as deleteRequest,
} from "./routes/event-request-detail";

export { canApproveEvents, canHostEvents, canManageEvent } from "./access";
export { hostSelect, serializeEvent, slugify, uniqueSlug } from "./serialize";
export {
    alertAdminsOfSubmission,
    notifyHostOfDecision,
    notifyRequesterOfApproval,
    notifyRequesterOfStatus,
    notifyTaggedUserOfRequest,
} from "./notify";