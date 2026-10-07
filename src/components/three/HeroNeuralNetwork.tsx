"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { HeroNetworkFallback } from "./HeroNetworkFallback";
import { createNeuralScene } from "@/lib/three/neural-scene";
import { createGlowTexture } from "@/lib/three/glow-texture";
import { DisposableBag } from "@/lib/three/disposables";
import { cappedPixelRatio, isWebGLAvailable } from "@/lib/three/webgl";
import { prefersReducedMotion } from "@/lib/motion";

const INTRO_SECONDS = 2.2;
const POINTER_EASE = 0.04;

/**
 * Hero neural network. This component owns the renderer lifecycle
 * (sizing, visibility pausing, pointer/scroll input, cleanup); the scene
 * itself is built in src/lib/three/neural-scene.ts.
 */
export default function HeroNeuralNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => setHasWebGL(isWebGLAvailable()), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!hasWebGL || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      setHasWebGL(false);
      return;
    }

    const reducedMotion = prefersReducedMotion();
    const bag = new DisposableBag();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 1000);
    // Framed on the nebula disc rather than the globe: the bright ring spans
    // the canvas edge to edge (~99%) and the faint outer ring bleeds past it,
    // which is what suggests the disc continues beyond the frame.
    camera.position.z = 148;

    renderer.setPixelRatio(cappedPixelRatio());
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { display: "block", width: "100%", height: "100%", opacity: "0" });
    container.replaceChildren(canvas);

    const network = createNeuralScene(bag.add(createGlowTexture()), bag);
    scene.add(network.group);

    // Square canvas that follows its container's width
    const resize = () => {
      const size = container.clientWidth;
      if (size > 0) renderer.setSize(size, size, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // Only render while on screen and the tab is visible
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting), { threshold: 0.05 });
    io.observe(container);

    // Pointer tilt (mouse only) and scroll-velocity spin
    let targetTiltX = 0;
    let targetTiltY = 0;
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = container.getBoundingClientRect();
      targetTiltY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.45;
      targetTiltX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.35;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const input = { tiltX: 0, tiltY: 0, scrollY: window.scrollY, spinBoost: 0 };
    let lastScrollY = window.scrollY;
    const clock = new THREE.Clock();
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!onScreen || document.hidden) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const motionScale = reducedMotion ? 0.15 : 1;

      const scrollY = window.scrollY;
      const scrollVel = scrollY - lastScrollY;
      lastScrollY = scrollY;
      input.spinBoost += (Math.min(Math.abs(scrollVel), 60) * 0.004 - input.spinBoost) * 0.08;
      input.tiltX += (targetTiltX - input.tiltX) * POINTER_EASE;
      input.tiltY += (targetTiltY - input.tiltY) * POINTER_EASE;
      input.scrollY = scrollY;

      network.update(delta * motionScale, elapsed, input);

      // Cinematic intro: ease-out scale + fade
      const intro = Math.min(elapsed / INTRO_SECONDS, 1);
      const eased = 1 - Math.pow(1 - intro, 3);
      network.group.scale.setScalar(0.82 + 0.18 * eased);
      canvas.style.opacity = String(eased);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.remove();
      bag.disposeAll();
      renderer.dispose();
    };
  }, [hasWebGL]);

  if (hasWebGL === false) return <HeroNetworkFallback />;

  return (
    <div
      ref={containerRef}
      className="w-full aspect-square mx-auto relative select-none overflow-hidden"
      role="img"
      aria-label="Animated neural network"
    />
  );
}
