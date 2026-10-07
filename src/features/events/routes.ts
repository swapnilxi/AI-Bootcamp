/**
 * Every URL the events feature talks to, in one place. A host application that
 * mounts the feature's route handlers under a different prefix only has to
 * change `base` here.
 */
const base = "/api/events";
const requests = "/api/event-requests";

export const EVENT_ROUTES = {
    base,
    list: (filter?: string) => (filter && filter !== "all" ? `${base}?filter=${filter}` : base),
    detail: (id: string) => `${base}/${id}`,
    interest: (id: string) => `${base}/${id}/interest`,
    approval: (id: string) => `${base}/${id}/approval`,

    /** Community requests. */
    requests,
    request: (id: string) => `${requests}/${id}`,
} as const;

/** Page paths the events feature owns. */
export const EVENT_PATHS = {
    list: "/events",
    detail: (id: string) => `/events/${id}`,
    create: "/events/new",
    request: "/events/request",
} as const;