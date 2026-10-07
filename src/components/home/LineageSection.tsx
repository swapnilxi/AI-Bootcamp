import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LINEAGE } from "@/content/home";
import { cssVars } from "@/lib/style";
import { LineageEmblem } from "./LineageEmblem";

/** How the school teaches, in a single premium card. */
export function LineageSection() {
  return (
    <section id="about" className="py-14 sm:py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="group reveal card-premium p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <div className="lg:col-span-4 flex items-center justify-center" data-speed="0.14" data-speed-min="1024">
          <LineageEmblem />
        </div>

        <div className="lg:col-span-8 space-y-4 text-left">
          <span className="text-xs uppercase tracking-[0.14em] font-semibold text-gold block">{LINEAGE.eyebrow}</span>
          <h2 className="font-serif text-3xl sm:text-4xl text-text font-normal text-balance">
            {LINEAGE.titleStart}{" "}
            <span className="text-shimmer italic" style={cssVars({ "--shimmer-delay": "3s" })}>
              {LINEAGE.titleAccent}
            </span>{" "}
            {LINEAGE.titleEnd}
          </h2>
          {LINEAGE.paragraphs.map((text) => (
            <p key={text.slice(0, 24)} className="text-sm sm:text-base text-text-muted leading-relaxed">
              {text}
            </p>
          ))}
          <div className="pt-2">
            <Button
              href={LINEAGE.cta.href}
              variant="secondary"
              size="md"
              className="!whitespace-normal text-center max-w-full"
            >
              <span>{LINEAGE.cta.label}</span>
              <Icon name="arrow" variant="line" size={16} className="ml-1.5 nudge shrink-0" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
