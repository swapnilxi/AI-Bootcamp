import { SectionHeading } from "@/components/ui/SectionHeading";
import { TESTIMONIALS, TESTIMONIALS_HEADING } from "@/content/home";
import { revealDelay } from "@/lib/style";
import { CARD_GRID, orphanCardClass } from "./grid";

/** Client reflections as editorial pull-quotes. */
export function TestimonialsSection() {
  return (
    <section className="py-14 sm:py-20 lg:py-24 section-band border-y">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading {...TESTIMONIALS_HEADING} />

        <div className={CARD_GRID}>
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.attribution}
              className={`group reveal card-premium p-6 sm:p-8 flex flex-col justify-between ${orphanCardClass(i, TESTIMONIALS.length)}`}
              style={revealDelay(i * 150)}
            >
              <span
                className="font-serif text-6xl leading-none text-gold/25 group-hover:text-gold/60 transition-colors duration-700 -mb-4 select-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <blockquote className="font-serif text-lg italic text-text leading-relaxed mb-6">{t.quote}</blockquote>
              <figcaption className="text-xs uppercase tracking-[0.16em] text-gold pt-4 border-t border-white/5 font-medium">
                — {t.attribution}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
