import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { FOOTER_COLUMNS, FOOTER_CONTACT, FOOTER_TAGLINE } from "./footer-links";

const linkClass = "hover:text-gold transition-colors";

/**
 * Site footer. Brand spans the full row on tablets; on desktop the brand
 * column is wider than the link columns so nothing wraps awkwardly.
 */
export function EditorialFooter() {
  return (
    <footer className="relative z-10 bg-black/80 backdrop-blur-sm text-text border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Journey's end: StarJourney docks the hero's star just above this line. */}
        <div className="h-0 pointer-events-none" data-star-dock aria-hidden="true" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.25fr] gap-x-8 gap-y-10">
          {/* Brand & ethos */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-4">
            <Logo />
            <p className="text-text-muted text-sm leading-relaxed max-w-sm">{FOOTER_TAGLINE}</p>
            <div className="flex items-start gap-2 pt-2 text-xs text-text-muted">
              <Icon name="role-admin" variant="line" size={16} className="text-text-muted shrink-0" />
              <span>Project-based · Evaluated · Portfolio-ready</span>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <h3 className="font-serif text-base text-text font-medium tracking-wide">{column.title}</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                {column.cta && (
                  <li>
                    <Link
                      href={column.cta.href}
                      className="group text-text font-medium hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>{column.cta.label}</span>
                      <Icon name="arrow" variant="line" size={14} className="nudge" />
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          ))}

          {/* Direct contact & hours */}
          <div className="space-y-3">
            <h3 className="font-serif text-base text-text font-medium tracking-wide">Direct Inquiries</h3>
            <ul className="space-y-2.5 text-sm text-text-muted">
              <li>
                <a
                  href={FOOTER_CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} flex items-center gap-2`}
                >
                  <Icon name="whatsapp" variant="filled" size={15} className="text-text-muted shrink-0" />
                  <span>{FOOTER_CONTACT.whatsappLabel}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${FOOTER_CONTACT.email}`} className={`${linkClass} flex items-center gap-2`}>
                  <Icon name="mail" variant="filled" size={15} className="text-text-muted shrink-0" />
                  <span className="min-w-0 break-all">{FOOTER_CONTACT.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2 pt-1 text-xs text-text-muted">
                <Icon name="clock" variant="filled" size={14} className="text-text-muted shrink-0 mt-0.5" />
                <span>{FOOTER_CONTACT.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 pt-8 border-t border-black-line flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted text-center md:text-left">
          <p>© {new Date().getFullYear()} AI Bootcamp. Built for engineers who ship.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span>Encrypted Zoom Video</span>
            <span>Lifetime Session Archives</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
