"use client";

import React, { useEffect, useRef, useState } from "react";

interface CountUpProps {
  to: number;
  suffix?: string;
  duration?: number;
  delay?: number;
}

/** Counts from 0 to `to` with an ease-out curve once visible. */
export function CountUp({ to, suffix = "", duration = 2000, delay = 0 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }

    let raf = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      timeout = setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setValue(Math.round(to * (1 - Math.pow(1 - p, 4))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }, delay);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [to, duration, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
