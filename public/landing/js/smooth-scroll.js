/* smooth-scroll.js — Lenis smooth scrolling wired to GSAP ScrollTrigger, plus scrollToTarget()
   used by every in-page anchor (header offset aware, native fallback when Lenis is off). */
(function (MS) {
  "use strict";

  MS.lenis = null;

  MS.initSmoothScroll = function (animate) {
    if (!animate || typeof window.Lenis === "undefined") return;
    try {
      var lenis = new Lenis({
        duration: 1.15,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      MS.lenis = lenis;
    } catch (e) { MS.lenis = null; }
  };

  // Scrolls to an element (or 0). The header offset comes from html { scroll-padding-top } (base.css),
  // which both Lenis and native scrollIntoView honour. Keeps the header visible for the whole scroll.
  MS.scrollToTarget = function (target) {
    var done = function () { MS.programmaticScroll = false; if (MS.showHeader) MS.showHeader(); };
    MS.programmaticScroll = true;
    if (MS.showHeader) MS.showHeader();
    if (MS.lenis) {
      MS.lenis.scrollTo(target, { duration: 1.4, onComplete: done });
      setTimeout(done, 1800); // safety if onComplete never fires (already at limit)
      return;
    }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var behavior = reduce ? "auto" : "smooth";
    if (target === 0) window.scrollTo({ top: 0, behavior: behavior });
    else target.scrollIntoView({ behavior: behavior, block: "start" });
    setTimeout(done, reduce ? 50 : 1000);
  };

  MS.initAnchors = function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var wasOpen = MS.isMenuOpen && MS.isMenuOpen();
        if (MS.closeMenu) MS.closeMenu(false);
        setTimeout(function () {
          MS.scrollToTarget(target);
          if (id === "#main") { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
        }, wasOpen ? 120 : 0);
        if (history.replaceState) history.replaceState(null, "", id);
      });
    });
  };
})(window.AIBootcamp = window.AIBootcamp || {});
