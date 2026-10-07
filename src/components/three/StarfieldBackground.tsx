"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  layer: number; // 0 = far, 1 = mid, 2 = near
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  tint: [number, number, number];
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  age: number;
}

// Per-layer: share of stars, scroll parallax factor, drift speed (px/s), mouse depth (px)
const LAYERS = [
  { share: 0.6, parallax: 0.04, drift: 1.2, mouse: 4 },
  { share: 0.3, parallax: 0.1, drift: 2.6, mouse: 10 },
  { share: 0.1, parallax: 0.2, drift: 4.5, mouse: 18 },
];

const TINTS: [number, number, number][] = [
  [242, 237, 227], // ivory
  [242, 237, 227],
  [226, 208, 168], // pale gold
  [200, 210, 235], // faint cool blue, for realism
];

/**
 * Full-page fixed starfield: three parallax depth layers that respond to scroll,
 * gentle twinkle, slow drift, and occasional fine shooting stars.
 */
export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    const shooting: ShootingStar[] = [];
    let nextShootAt = performance.now() + 2500;
    let isTabActive = !document.hidden;
    let animId = 0;

    const buildStars = () => {
      const count = Math.round(Math.min(420, (width * height) / 4200));
      stars = [];
      LAYERS.forEach((layer, li) => {
        const n = Math.round(count * layer.share);
        for (let i = 0; i < n; i++) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            layer: li,
            size:
              li === 0
                ? 0.35 + Math.random() * 0.35
                : li === 1
                ? 0.55 + Math.random() * 0.45
                : 0.9 + Math.random() * 0.6,
            baseAlpha: li === 0 ? 0.25 + Math.random() * 0.3 : 0.45 + Math.random() * 0.4,
            twinkleSpeed: 0.4 + Math.random() * 1.6,
            twinkleOffset: Math.random() * Math.PI * 2,
            tint: TINTS[Math.floor(Math.random() * TINTS.length)],
          });
        }
      });
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const onVisibilityChange = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const spawnShootingStar = () => {
      const angle = (20 + Math.random() * 25) * (Math.PI / 180);
      const speed = 620 + Math.random() * 380;
      shooting.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 80 + Math.random() * 90,
        life: 0.7 + Math.random() * 0.5,
        age: 0,
      });
    };

    // Cursor depth: target from pointer, eased every frame for a weighty feel
    let mouseTX = 0;
    let mouseTY = 0;
    let mouseX = 0;
    let mouseY = 0;
    const onPointerMove = (e: PointerEvent) => {
      mouseTX = e.clientX / width - 0.5;
      mouseTY = e.clientY / height - 0.5;
    };
    if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    let lastTime = performance.now();
    let driftOffset = 0;

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      if (!isTabActive) {
        lastTime = time;
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const t = time * 0.001;
      const scrollY = window.scrollY;
      if (!reducedMotion) driftOffset += dt;
      mouseX += (mouseTX - mouseX) * 0.04;
      mouseY += (mouseTY - mouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Stars: wrap positions so the field stays seamless while parallaxing
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const layer = LAYERS[s.layer];
        let x = (s.x + driftOffset * layer.drift - mouseX * layer.mouse) % width;
        let y = (s.y - scrollY * layer.parallax - mouseY * layer.mouse) % height;
        if (x < 0) x += width;
        if (y < 0) y += height;

        const twinkle = reducedMotion
          ? 1
          : 0.65 + 0.35 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        const alpha = s.baseAlpha * twinkle;
        const [r, g, b] = s.tint;

        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        if (s.size < 0.8) {
          ctx.fillRect(x, y, s.size * 1.6, s.size * 1.6);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, s.size, 0, Math.PI * 2);
          ctx.fill();
          // Only near stars get a very faint halo
          if (s.layer === 2) {
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.08})`;
            ctx.beginPath();
            ctx.arc(x, y, s.size * 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Shooting stars: fine, quick, understated
      if (!reducedMotion && time > nextShootAt) {
        spawnShootingStar();
        nextShootAt = time + 4500 + Math.random() * 6000;
      }

      for (let i = shooting.length - 1; i >= 0; i--) {
        const ss = shooting[i];
        ss.age += dt;
        ss.x += ss.vx * dt;
        ss.y += ss.vy * dt;
        const p = ss.age / ss.life;
        const fade = p < 0.15 ? p / 0.15 : Math.max(0, 1 - (p - 0.15) / 0.85);

        const speed = Math.hypot(ss.vx, ss.vy);
        const tx = ss.x - (ss.vx / speed) * ss.length;
        const ty = ss.y - (ss.vy / speed) * ss.length;
        const grad = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        grad.addColorStop(0, "rgba(242, 237, 227, 0)");
        grad.addColorStop(1, `rgba(255, 246, 240, ${0.75 * fade})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 246, 240, ${0.9 * fade})`;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.1, 0, Math.PI * 2);
        ctx.fill();

        if (p >= 1) shooting.splice(i, 1);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none select-none z-0"
      aria-hidden="true"
    />
  );
}
