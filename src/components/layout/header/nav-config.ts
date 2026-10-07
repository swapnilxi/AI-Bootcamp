/** Primary site navigation, shared by the desktop bar and the mobile menu. */
export interface NavLink {
  href: string;
  label: string;
}

/**
 * The learning journey, in the order a learner moves through it: choose a path,
 * work the courses, build, experiment, drill, then check where you stand.
 */
export const NAV_LINKS: NavLink[] = [
  { href: "/paths", label: "Paths" },
  { href: "/courses", label: "Learn" },
  { href: "/projects", label: "Projects" },
  { href: "/labs", label: "AI Labs" },
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
];

/** Secondary links, shown in the mobile menu and the account area. */
export const SECONDARY_LINKS: NavLink[] = [
  { href: "/bootcamp", label: "Bootcamp" },
  { href: "/mentorship", label: "Mentorship" },
  { href: "/instructors", label: "Instructors" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const WHATSAPP_URL = "https://wa.me/15551234567";

/** A link is active on its own page and on any nested route beneath it. */
export const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
