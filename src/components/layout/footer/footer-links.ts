/** Footer link columns and contact details. */
export interface FooterLink {
  href: string;
  label: string;
}

export const FOOTER_COLUMNS: { title: string; links: FooterLink[]; cta?: FooterLink }[] = [
  {
    title: "Learn",
    links: [
      { href: "/paths", label: "AI Career Paths" },
      { href: "/courses", label: "All Courses" },
      { href: "/labs", label: "AI Labs" },
      { href: "/practice", label: "AI Practice" },
      { href: "/projects", label: "Projects & Capstones" },
    ],
    cta: { href: "/bootcamp", label: "12-Week Bootcamp" },
  },
  {
    title: "Platform",
    links: [
      { href: "/progress", label: "Your Progress" },
      { href: "/mentorship", label: "1-on-1 Mentorship" },
      { href: "/instructors", label: "Instructors" },
      { href: "/blog", label: "Engineering Blog" },
      { href: "/about", label: "How We Teach" },
      { href: "/login", label: "Sign In" },
    ],
  },
];

export const FOOTER_CONTACT = {
  whatsappUrl: "https://wa.me/15551234567",
  whatsappLabel: "WhatsApp: +1 (555) 123-4567",
  email: "hello@aibootcamp.dev",
  hours: "Mentor hours: Mon – Fri, 10:00 – 18:00 UTC",
};

export const FOOTER_TAGLINE =
  "A project-driven AI engineering school. Learn the mechanism, practise until it sticks, build the system, measure it, and ship it.";
