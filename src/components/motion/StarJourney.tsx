"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";
import { LOGO_STAR_PATH, LOGO_STAR_VIEWBOX } from "@/components/ui/logo-star";

gsap.registerPlugin(ScrollTrigger);

/** How far above the footer's first line of content the star comes to rest. */
const DOCK_GAP = 36;

/** Below this much scrollable page there is no journey worth making. */
const MIN_TRAVEL = 240;

/** Clearance held between the edge of the star's own mark and the first column of copy. */
const COPY_CLEARANCE = 10;

/** Scroll distance over which the star steps out of the eyebrow into the margin. */
const LANE_IN = 340;

type Track = {
  /** Ceiling on the sideways play in the margin lane; the available room may allow less. */
  wander: number;
  /** Peak lead/lag against the scroll, in px — the star breathing, not parallax. */
  drift: number;
  /** Progress at which the footer starts drawing the star towards its centre. */
  approach: number;
  /** Viewport fraction the star settles at when it reaches the footer. */
  landing: number;
  /** Keeps the star clear of both viewport edges, so it can never widen the document. */
  edgePad: number;
  /** Half the mark's rendered size (matches --star-journey-size in effects.css), so the
   *  lane math keeps the star's actual edge clear of copy, not just its centre point. */
  radius: number;
};

const DESKTOP: Track = { wander: 62, drift: 38, approach: 0.76, landing: 0.58, edgePad: 13, radius: 20 };
const TABLET: Track = { wander: 32, drift: 24, approach: 0.78, landing: 0.57, edgePad: 11, radius: 20 };
// Phones have no real margin beside the content column — it runs edge to edge — so the
// mark itself shrinks (see effects.css) and hugs the true viewport edge instead of a lane.
const MOBILE: Track = { wander: 6, drift: 10, approach: 0.82, landing: 0.55, edgePad: 3, radius: 8 };

type Metrics = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  /** Scroll position at which the star has arrived and stops. */
  endScroll: number;
  /** Viewport y the star holds once docked. */
  endVY: number;
  /** The margin the star runs down for most of the page. */
  laneX: number;
  /** Sideways play around that lane, already fitted to the gutter. */
  laneWander: number;
  minX: number;
  maxX: number;
  track: Track;
  /** Scales the path's flourishes down on pages too short to carry them. */
  flourish: number;
};

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = (v: number) => clamp(v, 0, 1);
const smoothstep = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Document-space box from the offset chain rather than `getBoundingClientRect`,
 * because the hero's eyebrow rides a parallax transform: we want where the row
 * is laid out, not where it happens to be painted at this scroll position.
 */
function layoutBox(el: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

function measure(): Metrics | null {
  const anchor = document.querySelector<HTMLElement>("[data-star-anchor]");
  const dock = document.querySelector<HTMLElement>("[data-star-dock]");
  if (!anchor || !dock) return null;

  const vh = window.innerHeight;
  const vw = document.documentElement.clientWidth;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);

  const a = layoutBox(anchor);
  const d = layoutBox(dock);

  const endY = d.y - DOCK_GAP;
  const track = vw >= 1024 ? DESKTOP : vw >= 640 ? TABLET : MOBILE;

  // The dock spans the page's content column, so its left edge is where copy
  // begins. The lane and its sideways play are fitted to the gutter left of it —
  // accounting for the mark's own radius, not just a point — which is how the
  // star keeps its actual edge off the text without ever measuring the text.
  const contentLeft = d.x;
  // The right-most centre position whose mark still clears the copy, even at
  // the peak of its sideways wander (place() swings up to ±laneWander from
  // laneX, so the wander itself must come out of this budget, not sit on top).
  const safeLaneX = contentLeft - COPY_CLEARANCE - track.radius;
  // Wide gutters hold the whole swing, centred with room either side. Narrow
  // ones (mostly phones) may have no room at all — then the wander collapses
  // to 0 and the mark just holds the safe line, rather than being pushed past it.
  const laneWander = clamp((safeLaneX - track.edgePad) / 2, 0, track.wander);
  const laneX = safeLaneX - laneWander;

  // Arrive while the footer's crown is comfortably on screen, not at the very
  // bottom of the document — so the last of the travel is visible, and the rest
  // of the scroll simply carries the docked star up with the page.
  const landingVY = Math.min(vh * track.landing, endY);
  const endScroll = clamp(endY - landingVY, 0, maxScroll);

  return {
    startX: a.x + a.w / 2,
    startY: a.y + a.h / 2,
    endX: d.x + d.w / 2,
    endY,
    endScroll,
    endVY: endY - endScroll,
    laneX,
    laneWander,
    minX: track.edgePad,
    maxX: Math.max(track.edgePad, vw - track.edgePad),
    track,
    flourish: maxScroll < MIN_TRAVEL ? 0 : Math.min(1, endScroll / 1600),
  };
}

/**
 * One star, the same one that opens the hero eyebrow, carried down the page by
 * scroll progress until it settles above the footer's first line of content.
 *
 * Position is a pure function of ScrollTrigger's progress — no layout is read
 * while scrolling — and the element is absolutely positioned in document space,
 * so once it reaches the footer it simply belongs to the footer.
 */
export function StarJourney() {
  const starRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const star = starRef.current;
    if (!star) return;

    let m = measure();
    if (!m) {
      star.dataset.state = "hidden";
      return;
    }
    star.dataset.state = "ready";

    /** Writes transform + opacity only; `p` is 0 in the hero, 1 at the footer. */
    const place = (p: number) => {
      if (!m) return;
      const { track, flourish } = m;
      const envelope = Math.sin(Math.PI * p) * flourish;

      // Horizontal, in three movements: leave the eyebrow for the margin, run
      // the margin with a little sideways play, then let the footer draw it in.
      const intoLane = smoothstep((p * m.endScroll) / LANE_IN);
      const approach = smoothstep((p - track.approach) / (1 - track.approach));
      // Two out-of-phase waves: a long lobe out and back, a shorter one riding it,
      // so the lane reads as drawn by hand rather than oscillated.
      const wander =
        envelope *
        (1 - approach) *
        (0.72 * Math.sin(p * Math.PI * 1.9 + 0.25) + 0.28 * Math.sin(p * Math.PI * 4.3 + 2.1)) *
        m.laneWander;
      const lane = lerp(m.startX, m.laneX, intoLane) + wander;
      const x = clamp(lerp(lane, m.endX, approach), m.minX, m.maxX);

      // Vertical: a viewport height that eases downward, plus the scroll itself,
      // so the star stays in view on the way and lands on an exact page position.
      const vy =
        lerp(m.startY, m.endVY, smoothstep(p)) +
        envelope * Math.sin(p * Math.PI * 3 + 0.8) * track.drift;
      const y = vy + p * m.endScroll;

      const rotate = envelope * 9;
      // Presence is held back until the star has all but arrived, so the one
      // stretch where it must cross the column is also its quietest.
      const arrived = approach * approach * approach;
      const scale = 1 + 0.2 * arrived;
      const opacity = p < 0.22 ? lerp(1, 0.6, smoothstep(p / 0.22)) : lerp(0.6, 1, arrived);

      star.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      star.style.opacity = opacity.toFixed(3);
    };

    // Reduced motion: the star is a logo detail in the hero and stays one.
    if (prefersReducedMotion()) {
      place(0);
      return;
    }

    place(0);

    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => Math.max(m?.endScroll ?? 1, 1),
      onRefreshInit: () => {
        m = measure();
      },
      onRefresh: (self) => place(self.progress),
      onUpdate: (self) => place(self.progress),
    });

    let cancelled = false;
    const remeasure = () => {
      if (cancelled) return;
      m = measure();
      trigger.refresh();
    };

    // Web fonts land after the first paint and move the eyebrow a few pixels.
    document.fonts?.ready.then(remeasure).catch(() => {});

    // Accordions and lazy sections change the page height without a resize, which
    // would otherwise leave the footer dock measured against a stale document.
    let timer = 0;
    let lastHeight = document.documentElement.scrollHeight;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const height = document.documentElement.scrollHeight;
        if (height === lastHeight) return;
        lastHeight = height;
        remeasure();
      }, 200);
    });
    observer.observe(document.body);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      observer.disconnect();
      trigger.kill();
    };
  }, [pathname]);

  return (
    <div ref={starRef} className="star-journey" data-state="hidden" aria-hidden="true">
      <span className="star-journey__mark">
        <svg viewBox={LOGO_STAR_VIEWBOX} fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <path d={LOGO_STAR_PATH} fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}
