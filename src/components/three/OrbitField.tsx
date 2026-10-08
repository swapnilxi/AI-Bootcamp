"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createOrbitWheel, ORBIT_WHEEL_EXTENT } from "@/lib/three/orbit-wheel";
import { createGlowTexture } from "@/lib/three/glow-texture";
import { DisposableBag } from "@/lib/three/disposables";
import { cappedPixelRatio, isWebGLAvailable } from "@/lib/three/webgl";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const MIN_CAMERA_DISTANCE = 96;

/**
 * Orbit-field background, filling its positioned parent. Rotation is
 * scrubbed by the scroll position of the enclosing <section>.
 * Scene geometry lives in src/lib/three/orbit-wheel.ts.
 */
export default function OrbitField() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !isWebGLAvailable()) return; // the section reads fine without the wheel

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
        premultipliedAlpha: false,
      });
    } catch {
      return;
    }

    const drift = !prefersReducedMotion();
    const bag = new DisposableBag();
    renderer.setPixelRatio(cappedPixelRatio());
    Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%" });
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000);
    const wheel = createOrbitWheel(bag.add(createGlowTexture(64)), bag);
    scene.add(wheel.group);

    // Keep the whole wheel in frame on narrow (portrait) screens
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const fitWidth = ORBIT_WHEEL_EXTENT / Math.tan((camera.fov * Math.PI) / 360) / camera.aspect;
      camera.position.set(0, -6, Math.max(fitWidth, MIN_CAMERA_DISTANCE));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    // Smoothed scroll progress through the section drives the rotation
    const scrub = { turn: 0 };
    const trigger = ScrollTrigger.create({
      trigger: mount.closest("section") ?? mount,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => gsap.to(scrub, { turn: self.progress, duration: 1.2, ease: "power3.out", overwrite: true }),
    });

    let visible = false;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: "120px" });
    io.observe(mount);

    const clock = new THREE.Clock();
    let rafId = 0;
    const render = () => {
      rafId = requestAnimationFrame(render);
      if (!visible || document.hidden) return;
      wheel.update(Math.min(clock.getDelta(), 0.05), clock.elapsedTime, scrub.turn, drift);
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(rafId);
      trigger.kill();
      gsap.killTweensOf(scrub);
      io.disconnect();
      resizeObserver.disconnect();
      bag.disposeAll();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
