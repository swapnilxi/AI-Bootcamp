/* reveal.js — Entrance motion: hero intro timeline (word-mask headline, staggered fade-ups, stat count-up)
   and ScrollTrigger.batch scroll reveals (fade + 24px rise + blur clear). Only runs when motion is allowed. */
(function (MS) {
  "use strict";

  MS.initHeroIntro = function () {
    var counters = document.querySelectorAll("[data-count]");
    counters.forEach(function (el) { el.textContent = "0" + (el.getAttribute("data-suffix") || ""); });

    var fontsReady = document.fonts && document.fonts.ready
      ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 700); })])
      : Promise.resolve();

    fontsReady.then(function () {
      var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.to(".hero [data-hero].eyebrow", { opacity: 1, y: 0, duration: 1.2 }, 0.1)
        .to(".hero h1 .wm > span", { y: 0, duration: 1.4, stagger: 0.08 }, 0.2)
        .to(".hero-lede", { opacity: 1, y: 0, duration: 1.2 }, 0.75)
        .to(".hero-actions", { opacity: 1, y: 0, duration: 1.2 }, 0.88)
        .to(".hero-metrics-wrap", { opacity: 1, y: 0, duration: 1.2 }, 1.0)
        .to("#hero-canvas-container", { opacity: 1, duration: 2.2, ease: "power2.out" }, 0.3);

      counters.forEach(function (el) {
        var to = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var obj = { v: 0 };
        tl.to(obj, {
          v: to, duration: 2, ease: "power3.out",
          onUpdate: function () { el.textContent = Math.round(obj.v).toLocaleString("en-US") + suffix; }
        }, 1.1);
      });
    });
  };

  MS.initReveals = function () {
    gsap.set("[data-reveal]", { opacity: 0, y: 24, filter: "blur(6px)" });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, filter: "blur(0px)",
          duration: 1.2, ease: "expo.out", stagger: 0.1, overwrite: true,
          onComplete: function () {
            batch.forEach(function (el) { el.classList.add("revealed"); });
            gsap.set(batch, { clearProps: "opacity,filter,transform" });
          }
        });
      }
    });
  };
})(window.AIBootcamp = window.AIBootcamp || {});
