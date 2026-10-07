import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SERVICES_HEADING, type ServiceItem } from "@/content/home";
import { revealDelay } from "@/lib/style";
import { CARD_GRID, orphanCardClass } from "./grid";

/** Index of the card highlighted with the rotating border. */
const FEATURED_INDEX = 1;

/** Difficulty enum values read better than their raw names on a marketing card. */
const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Start here",
  INTERMEDIATE: "Intermediate path",
  ADVANCED: "Advanced path",
  PRODUCTION: "Production path",
  PATH: "Learning Path",
};

/** Learning paths: database-driven path cards with the middle one featured. */
export function ServicesSection({ services }: { services: ServiceItem[] }) {
  return (
    <section id="services" className="py-14 sm:py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <SectionHeading {...SERVICES_HEADING} />

      <div className={CARD_GRID}>
        {services.map((service, idx) => (
          <ServiceCard
            key={service.id}
            service={service}
            featured={idx === FEATURED_INDEX}
            className={orphanCardClass(idx, services.length)}
            delayMs={idx * 120}
          />
        ))}
      </div>
    </section>
  );
}

interface ServiceCardProps {
  service: ServiceItem;
  featured: boolean;
  className?: string;
  delayMs: number;
}

function ServiceCard({ service, featured, className = "", delayMs }: ServiceCardProps) {
  return (
    <article
      className={`group reveal card-premium p-6 sm:p-8 flex flex-col justify-between ${featured ? "card-featured" : ""} ${className}`}
      style={revealDelay(delayMs)}
    >
      {featured && (
        <span className="badge-sheen absolute -top-3 left-6 sm:left-8 px-3.5 py-0.5 rounded-full text-[10px] uppercase tracking-[0.18em] font-bold text-black bg-[linear-gradient(180deg,#FFE5D1,#FF7315)] shadow-[0_2px_10px_rgba(255,115,21,0.3)]">
          Most Popular
        </span>
      )}
      <div>
        <div className="card-icon w-14 h-14 mb-6 flex items-center justify-center text-orange rounded-2xl border border-orange/30 bg-orange/10 shadow-[0_0_16px_-2px_rgba(255,115,21,0.22)] transition-all duration-300 group-hover:scale-105 group-hover:border-orange group-hover:shadow-[0_0_22px_0_rgba(255,115,21,0.32)]">
          <Icon name={service.iconName} variant="line" size={26} className="filter drop-shadow-[0_0_4px_rgba(255,115,21,0.4)]" />
        </div>

        <span className="text-[11px] uppercase tracking-wider font-semibold text-gold block mb-2">
          {LEVEL_LABEL[service.category] ?? "Learning Path"}
        </span>

        <h3 className="font-serif text-2xl text-text font-normal mb-3 text-balance">{service.title}</h3>

        <div className="font-serif text-3xl mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-gold-metal">{service.durationMinutes || 12}</span>
          <span className="font-sans text-xs text-text-muted font-normal">weeks, full-time pace</span>
        </div>

        <p className="text-sm text-text-muted leading-relaxed mb-8">{service.shortDesc}</p>
      </div>

      <Button
        href={`/paths/${service.slug}`}
        variant={featured ? "primary" : "secondary"}
        size="md"
        className="w-full"
      >
        <span>Explore path</span>
        <Icon name="arrow" variant="line" size={16} className="ml-1 nudge" />
      </Button>
    </article>
  );
}
