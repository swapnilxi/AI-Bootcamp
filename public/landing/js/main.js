/* main.js — Boot order. Detects capabilities (reduced motion, fine pointer, GSAP), wires every module,
   and marks <html class="anim-ready">. The <head> inline script holds the 4s failsafe that drops the
   `js` class (revealing all content) if this never runs, e.g. a CDN or one of these files fails to load. */
(function (MS) {
  "use strict";

  function safe(fn, name) {
    try { if (typeof fn === "function") { fn(); return true; } }
    catch (e) { if (window.console) console.warn("[AIBootcamp] " + name + " failed:", e); }
    return false;
  }

  function boot() {
    var root = document.documentElement;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    MS.reduceMotion = reduceMotion;
    MS.finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    MS.animate = !reduceMotion && hasGsap;

    if (!MS.animate) root.classList.remove("js"); // show everything statically
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    safe(MS.applyLinks, "links");
    safe(function () { MS.initSmoothScroll(MS.animate); }, "smooth-scroll");
    safe(MS.initHeader, "header");
    safe(MS.initAnchors, "anchors");
    safe(function () { MS.initFaq(reduceMotion); }, "faq");
    safe(MS.initSpotlight, "spotlight");
    safe(function () { MS.initStarfield(reduceMotion); }, "starfield");
    safe(function () { MS.initHeroSphere(reduceMotion); }, "hero-sphere");

    if (!MS.animate) return;

    safe(MS.initMagnetic, "magnetic");
    var introOk = safe(MS.initHeroIntro, "hero-intro");
    var revealOk = safe(MS.initReveals, "reveals");
    if (!introOk || !revealOk) { root.classList.remove("js"); return; } // never leave content hidden
    safe(MS.initScrollScenes, "scroll-scenes");

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    root.classList.add("anim-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window.AIBootcamp = window.AIBootcamp || {});
