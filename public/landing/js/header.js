/* header.js — Header scroll states (glass + shrink after 24px, hide on scroll-down / show on scroll-up),
   scroll progress hairline, and the full-screen mobile menu (GSAP stagger, scroll lock, Esc, focus trap). */
(function (MS) {
  "use strict";

  var header, menu, toggle, menuItems, menuOpen = false;

  MS.isMenuOpen = function () { return menuOpen; };
  MS.showHeader = function () { if (header) header.classList.remove("is-hidden"); };

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menu.hidden = false;
    void menu.offsetWidth; // reflow so the opacity transition runs
    menu.classList.add("is-open");
    document.body.classList.add("menu-open");
    MS.showHeader();
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    if (MS.lenis) MS.lenis.stop();
    if (MS.animate) {
      gsap.fromTo(menuItems, { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.08, overwrite: true });
    }
    var first = menu.querySelector("a");
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
  }

  function closeMenu(returnFocus) {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    if (MS.lenis) MS.lenis.start();
    setTimeout(function () { if (!menuOpen) menu.hidden = true; }, 500);
    if (returnFocus) toggle.focus();
  }
  MS.closeMenu = closeMenu;

  function initMenu() {
    menu = document.getElementById("mobile-menu");
    toggle = document.getElementById("menu-toggle");
    if (!menu || !toggle) return;
    menuItems = menu.querySelectorAll(".mm-item");
    toggle.addEventListener("click", function () { menuOpen ? closeMenu(false) : openMenu(); });
    document.addEventListener("keydown", function (e) {
      if (!menuOpen) return;
      if (e.key === "Escape") { closeMenu(true); return; }
      if (e.key !== "Tab") return;
      var f = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll("a")));
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    var mq = window.matchMedia("(min-width: 1024px)");
    var onMq = function (m) { if (m.matches) closeMenu(false); };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  function initScrollState() {
    var progress = document.querySelector(".scroll-progress");
    var lastY = window.pageYOffset, ticking = false;
    function update() {
      var y = window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
      header.classList.toggle("is-scrolled", y > 24);
      if (!menuOpen && !MS.programmaticScroll) {
        var dy = y - lastY;
        if (y > 160 && dy > 4) header.classList.add("is-hidden");
        else if (dy < -4 || y <= 160) header.classList.remove("is-hidden");
      }
      lastY = y;
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    header.addEventListener("focusin", MS.showHeader);
    update();
  }

  MS.initHeader = function () {
    header = document.getElementById("site-header");
    if (!header) return;
    initMenu();
    initScrollState();
  };
})(window.AIBootcamp = window.AIBootcamp || {});
