/* effects.js — Interaction effects: FAQ smooth-height accordion, card cursor spotlight,
   magnetic CTAs, process line draw (scrub) and hero parallax. Hover effects only on fine pointers. */
(function (MS) {
  "use strict";

  var EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  MS.initFaq = function (reduceMotion) {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var summary = item.querySelector("summary");
      var panel = item.querySelector(".faq-answer");
      var busy = false;
      if (!summary || !panel) return;
      summary.addEventListener("click", function (e) {
        if (reduceMotion || !panel.animate) return; // native <details> behaviour
        e.preventDefault();
        if (busy) return;
        busy = true;
        if (!item.open) {
          item.open = true;
          var h = panel.scrollHeight;
          panel.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 650, easing: EASE })
            .onfinish = function () { busy = false; };
        } else {
          var h2 = panel.scrollHeight;
          panel.animate([{ height: h2 + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 450, easing: EASE })
            .onfinish = function () { item.open = false; busy = false; };
        }
      });
    });
  };

  MS.initSpotlight = function () {
    if (!MS.finePointer) return;
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  };

  MS.initMagnetic = function () {
    if (!MS.finePointer || !MS.animate) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (wrap) {
      var strength = parseFloat(wrap.getAttribute("data-magnetic")) || 0.3;
      var xTo = gsap.quickTo(wrap, "x", { duration: 0.8, ease: "power3.out" });
      var yTo = gsap.quickTo(wrap, "y", { duration: 0.8, ease: "power3.out" });
      wrap.addEventListener("pointermove", function (e) {
        var r = wrap.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      wrap.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  };

  MS.initScrollScenes = function () {
    if (!MS.animate) return;
    var processList = document.getElementById("process-list");
    if (processList) {
      gsap.fromTo(processList, { "--p": 0 }, {
        "--p": 1, ease: "none",
        scrollTrigger: { trigger: processList, start: "top 75%", end: "bottom 60%", scrub: 0.8 }
      });
    }
    var heroScrub = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    gsap.to(".hero-visual", { yPercent: 12, ease: "none", scrollTrigger: heroScrub });
    gsap.to(".hero-glow", { yPercent: -30, ease: "none", scrollTrigger: Object.assign({}, heroScrub) });
  };
})(window.AIBootcamp = window.AIBootcamp || {});
