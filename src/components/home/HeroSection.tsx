import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CountUp } from "@/components/motion/CountUp";
import { HeroSphereClient } from "@/components/three/HeroSphereClient";
import { HERO } from "@/content/home";
import { revealDelay } from "@/lib/style";

/** Hero: word-by-word headline, staggered intro, trust stats and the Three.js armillary sphere. */
export function HeroSection() {
  const accentDelay = 200 + HERO.headlineWords.length * 70;

  return (
    <section className="relative pt-10 sm:pt-16 lg:pt-20 pb-14 sm:pb-20 lg:pb-24 overflow-hidden">
      {/* Very soft warm haze behind the sphere */}
      <div
        className="absolute top-1/2 right-[8%] -translate-y-1/2 w-[min(520px,90vw)] aspect-square rounded-full pointer-events-none blur-[80px] opacity-40"
        data-speed="0.3"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 115, 21, 0.10) 0%, rgba(255, 115, 21, 0.03) 45%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 text-left" data-speed="-0.35" data-speed-min="1024" data-scroll-fade>
            <span
              className="intro inline-flex items-center gap-3 text-[11px] sm:text-xs font-medium tracking-[0.18em] sm:tracking-[0.22em] uppercase text-text-muted"
              style={revealDelay(100)}
            >
              <span className="w-8 h-px shrink-0 bg-gradient-to-r from-transparent to-cream/40" aria-hidden="true" />
              {/* Seat for the travelling star (see StarJourney); it reserves the
                  space, the star itself lives at the page root so it can leave. */}
              <span className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" data-star-anchor aria-hidden="true" />
              <span>{HERO.eyebrow}</span>
            </span>

            <h1 className="font-serif text-[clamp(2.25rem,8.5vw,3.75rem)] lg:text-[clamp(3.5rem,5.2vw,4.5rem)] font-normal text-text tracking-tight leading-[1.1] text-balance">
              {HERO.headlineWords.map((word, i) => (
                <React.Fragment key={word}>
                  <span className="word-mask">
                    <span style={revealDelay(200 + i * 70)}>{word}</span>
                  </span>{" "}
                </React.Fragment>
              ))}
              <span className="word-mask">
                <span style={revealDelay(accentDelay)}>
                  <span className="text-shimmer italic pr-[0.08em]">{HERO.headlineAccent}</span>
                </span>
              </span>
            </h1>

            <p className="intro text-base sm:text-lg text-text-muted max-w-xl leading-relaxed" style={revealDelay(750)}>
              {HERO.lede}
            </p>

            <HeroActions />
            <HeroStats />
          </div>

          {/* Three.js armillary sphere */}
          <div className="lg:col-span-5 flex items-center justify-center relative" data-speed="-0.2" data-speed-min="1024">
            <div className="w-full max-w-[min(580px,92vw)] mx-auto">
              <HeroSphereClient />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroActions() {
  return (
    <div
      className="intro pt-2 flex flex-col min-[480px]:flex-row min-[480px]:flex-wrap items-stretch min-[480px]:items-center gap-3"
      style={revealDelay(880)}
    >
      <span className="magnetic flex min-[480px]:inline-flex">
        <Button href={HERO.primaryCta.href} variant="primary" size="md" className="btn-sheen-auto w-full">
          <span>{HERO.primaryCta.label}</span>
          <Icon name="arrow" variant="line" size={16} className="ml-1.5 nudge" />
        </Button>
      </span>

      <span className="magnetic flex min-[480px]:inline-flex">
        <Button href={HERO.secondaryCta.href} variant="secondary" size="md" className="w-full">
          <span>{HERO.secondaryCta.label}</span>
        </Button>
      </span>

      <Link
        href="/bootcamp"
        className="btn-sheen inline-flex items-center justify-center gap-2 px-6 py-3 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider font-semibold text-text-muted hover:text-gold hover:border-gold/60 transition-[color,border-color] duration-500 min-h-[48px]"
      >
        <Icon name="calendar" variant="line" size={15} className="text-text-muted" />
        <span>12-week bootcamp</span>
      </Link>
    </div>
  );
}

function HeroStats() {
  return (
    <div className="intro max-w-lg" style={revealDelay(1020)}>
      <div className="shimmer-line mb-6 sm:mb-8" aria-hidden="true" />
      <dl className="grid grid-cols-3 gap-3 sm:gap-6">
        {HERO.stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse">
            <dt className="text-[10px] sm:text-[11px] uppercase tracking-wider text-text-muted mt-1 leading-tight">
              {stat.label}
            </dt>
            <dd className="font-serif text-[clamp(1.4rem,5.5vw,1.9rem)] font-normal text-gold-metal">
              {"value" in stat ? <CountUp to={stat.value} suffix={stat.suffix} delay={1150} /> : stat.text}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
