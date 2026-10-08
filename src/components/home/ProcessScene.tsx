"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PROCESS_HEADING, PROCESS_STEPS } from "@/content/home";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Scroll distance as a multiple of the track's horizontal travel. Above 1 the
 *  cards move slower than the page, which reads as deliberate rather than slow. */
const TRAVEL_RATIO = 1.3;
/** Dwell before the walk starts, so step 01 registers as a step rather than a
 *  frame the reader passes straight through. */
const LEAD_PX = 160;
/** Dwell after the walk ends. Without it the section lets go the instant step 03
 *  arrives, which is what makes the handover to the next section feel abrupt. */
const HOLD_PX = 260;
/** Scrub lag. Low enough that the track feels attached to the wheel, high enough
 *  that it still glides to a stop. */
const SCRUB = 0.7;
/** How an inactive card sits against the active one. */
const DIM_OPACITY = 0.5;
const DIM_SCALE = 0.965;
const ACTIVE_SCALE = 1.02;
/** How far below its settled position a card sits before it activates, so each
 *  one reads as rising into place rather than just fading/scaling up. */
const RISE_PX = 28;
/** Activation crossings at which the rim glint fires and re-arms. */
const GLINT_ON = 0.9;
const GLINT_OFF = 0.45;

/** Smoothstep: eases the activation ramp so cards swell in rather than fade linearly. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * The three engagement steps as one horizontal scene.
 *
 * The stage holds the viewport with `position: sticky` while the reader's vertical
 * scroll is spent moving a track sideways, so each scroll carries them to the next
 * step rather than down the page. The hold is sticky rather than ScrollTrigger's
 * `pin` because <body> sets overflow-x: hidden, which makes the body a scroll
 * container and leaves a pinned (fixed) element measured against the wrong box.
 * All the script has to do here is scrub `x` and keep the section tall enough.
 *
 * Which card is active is measured, not scheduled: every frame each card's centre
 * is compared to the viewport centre and the distance is normalised into an
 * activation value. That one number drives glow, rim, opacity, scale, copy
 * contrast and the medallion together, so exactly one card ever reads as current
 * and the handover between two is continuous.
 *
 * Without JS, or under reduced motion, `data-scene` is never set and the markup
 * stays the responsive grid it is written as.
 */
export function ProcessScene() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const section = root.current;
      const trackEl = track.current;
      if (!section || !trackEl) return;

      const steps = gsap.utils.toArray<HTMLElement>(".scene-step");
      const cards = gsap.utils.toArray<HTMLElement>(".scene-card");
      const marks = gsap.utils.toArray<HTMLElement>(".scene-mark");
      if (steps.length < 2) return;

      // Switches the track from grid to horizontal. Must happen before anything
      // is measured, since the travel below depends on the flex layout.
      section.dataset.scene = "on";

      const setOpacity = steps.map((el) => gsap.quickSetter(el, "opacity"));
      const setScale = steps.map((el) => gsap.quickSetter(el, "scale"));
      const setY = steps.map((el) => gsap.quickSetter(el, "y", "px"));
      const lit = steps.map(() => false);

      /** Horizontal distance the track travels to bring the last card to centre. */
      const travel = () => Math.max(0, steps[steps.length - 1].offsetLeft - steps[0].offsetLeft);
      /** Scroll spent on the walk itself. */
      const walkPx = () => Math.round(travel() * TRAVEL_RATIO);

      /** The section is taller than the walk by the two dwells, so the stage stays
       *  stuck for a beat at each end instead of snapping in and out. */
      const sizeSection = () =>
        section.style.setProperty("--scene-travel", `${LEAD_PX + walkPx() + HOLD_PX}px`);

      let walk: gsap.core.Tween | undefined;

      const sync = () => {
        const centre = window.innerWidth / 2;
        // Read every rect before writing anything, so the loop does not force a
        // fresh layout on each card.
        const rects = steps.map((el) => el.getBoundingClientRect());
        const gap = rects.length > 1 ? rects[1].left - rects[0].right : 0;
        const falloff = rects[0].width + Math.max(gap, 0);

        rects.forEach((rect, i) => {
          const distance = Math.abs(rect.left + rect.width / 2 - centre);
          const activation = falloff > 0 ? smooth(1 - Math.min(distance / falloff, 1)) : 1;

          cards[i]?.style.setProperty("--glow-lit", activation.toFixed(3));
          marks[i]?.style.setProperty("--glow-lit", activation.toFixed(3));
          setOpacity[i](DIM_OPACITY + (1 - DIM_OPACITY) * activation);
          setScale[i](DIM_SCALE + (ACTIVE_SCALE - DIM_SCALE) * activation);
          setY[i]((1 - activation) * RISE_PX);

          // One glint as a card takes over, re-armed once it has clearly handed off
          if (!lit[i] && activation >= GLINT_ON) {
            cards[i]?.classList.add("is-lit");
            lit[i] = true;
          } else if (lit[i] && activation < GLINT_OFF) {
            cards[i]?.classList.remove("is-lit");
            lit[i] = false;
          }
        });

        const currentP = walk?.progress() ?? 0;
        section.style.setProperty("--scene-p", currentP.toFixed(4));

        // Progressive connecting lines between step cards
        const lineEls = section.querySelectorAll<HTMLElement>(".scene-step-line-fill");
        const numLines = lineEls.length;
        if (numLines > 0) {
          lineEls.forEach((el, i) => {
            const startP = i / numLines;
            const endP = (i + 1) / numLines;
            const fill = Math.min(1, Math.max(0, (currentP - startP) / (endP - startP)));
            el.style.setProperty("--line-fill", fill.toFixed(3));
          });
        }
      };

      sizeSection();

      walk = gsap.to(trackEl, {
        x: () => -travel(),
        ease: "none",
        onUpdate: sync,
        scrollTrigger: {
          trigger: section,
          // The walk occupies only the middle of the sticky range; the lead and
          // hold either side are sticky scroll with nothing animating.
          start: () => `top top-=${LEAD_PX}`,
          end: () => `+=${walkPx()}`,
          scrub: SCRUB,
          invalidateOnRefresh: true,
          // Resize the section before ScrollTrigger measures, not after, or the
          // trigger would be laid out against last refresh's height.
          onRefreshInit: sizeSection,
          onRefresh: sync,
        },
      });

      sync();

      return () => {
        delete section.dataset.scene;
        section.style.removeProperty("--scene-p");
        section.style.removeProperty("--scene-travel");
        steps.forEach((el) => gsap.set(el, { clearProps: "opacity,transform" }));
        cards.forEach((el) => {
          el.classList.remove("is-lit");
          el.style.removeProperty("--glow-lit");
        });
        marks.forEach((el) => el.style.removeProperty("--glow-lit"));
      };
    },
    { scope: root }
  );

  return (
    <section id="process" ref={root} className="scene section-band border-y">
      <div className="scene-stage flex flex-col justify-center py-14 sm:py-20 lg:py-24">
        <div className="scene-head max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading {...PROCESS_HEADING} className="!mb-0" />
        </div>

        {/* Full-bleed: the track centres its cards against the viewport, so it
            must not inherit the page gutter. */}
        <ol ref={track} className="scene-track">
          {PROCESS_STEPS.map((step, i) => (
            <li key={step.title} className="scene-step relative">
              {/* Progressive subtle connecting line to the next step */}
              {i < PROCESS_STEPS.length - 1 && (
                <div className="scene-step-line" aria-hidden="true">
                  <div className="scene-step-line-fill" />
                </div>
              )}

              <article className="scene-card card-premium glow-walk group h-full p-6 sm:p-8 lg:p-10 relative z-0">
                <span className="card-icon relative z-20 shrink-0 inline-flex items-center justify-center w-12 h-12 mb-5 rounded-full border border-orange/40 font-mono text-base font-semibold">
                  <span className="text-orange">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <h3 className="step-title relative z-20 font-serif text-xl sm:text-2xl font-medium mb-2 text-balance">
                  {step.title}
                </h3>
                <p className="step-body relative z-20 text-sm leading-relaxed">{step.body}</p>
              </article>
            </li>
          ))}
        </ol>

        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
          <div className="scene-progress max-w-xl mx-auto">
            <div className="scene-marks">
              {PROCESS_STEPS.map((step, i) => (
                <span key={step.title} className="scene-mark">
                  {String(i + 1).padStart(2, "0")}
                </span>
              ))}
            </div>
            <div className="scene-rail" aria-hidden="true" />
          </div>

          <div className="mt-6 flex justify-center">
            <p className="scene-cue">
              Scroll to explore
              <span className="scene-cue-line" aria-hidden="true" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
