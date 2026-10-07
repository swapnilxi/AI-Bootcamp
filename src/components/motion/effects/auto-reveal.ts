/**
 * Tags common content blocks with `.reveal` so every page gets scroll reveals
 * without per-page markup. Opt out with `data-no-reveal` on any ancestor.
 */
const AUTO_REVEAL_SELECTOR = "main .editorial-card, main .grid > *, main section h2";
const AUTO_REVEAL_EXCLUDE = ".reveal, .intro, [data-no-reveal], form, [role='dialog'], header, nav";
const STAGGER_MS = 110;
const STAGGER_COLUMNS = 3;

let initialScanDone = false;

export function autoTagReveals() {
  const firstScan = !initialScanDone;
  initialScanDone = true;
  const vh = window.innerHeight;

  document.querySelectorAll<HTMLElement>(AUTO_REVEAL_SELECTOR).forEach((el) => {
    if (el.dataset.autoReveal) return;
    el.dataset.autoReveal = "1";
    if (el.closest(AUTO_REVEAL_EXCLUDE) || el.parentElement?.closest(".reveal")) return;
    const pos = getComputedStyle(el).position;
    if (pos === "absolute" || pos === "fixed") return;
    // Server-rendered content already on screen at first paint stays put (no flash)
    if (firstScan && el.getBoundingClientRect().top < vh) return;

    const siblings = el.parentElement ? Array.from(el.parentElement.children) : [el];
    const index = Math.max(0, siblings.indexOf(el));
    el.style.setProperty("--d", `${(index % STAGGER_COLUMNS) * STAGGER_MS}ms`);
    el.classList.add("reveal");
  });
}
