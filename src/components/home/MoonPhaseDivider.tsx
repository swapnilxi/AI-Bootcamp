/** Decorative moon-phase hairline that draws itself when scrolled into view. */
export function MoonPhaseDivider() {
  return (
    <div
      className="flex items-center justify-center px-4 py-8 sm:py-10 text-gold/75"
      data-speed="0.16"
      aria-hidden="true"
    >
      <svg
        className="draw-on w-full max-w-[480px] h-7 fill-none stroke-current"
        viewBox="0 0 600 30"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="0" y1="15" x2="220" y2="15" opacity="0.4" />
        <circle cx="240" cy="15" r="7" opacity="0.4" />
        <path d="M 264 8 A 7 7 0 0 0 264 22 A 5 7 0 0 1 264 8" />
        <path d="M 285 8 A 7 7 0 0 0 285 22 Z" />
        <circle cx="300" cy="15" r="7" />
        <circle className="pulse-dot" cx="300" cy="15" r="2" fill="var(--gold)" />
        <path d="M 315 8 A 7 7 0 0 1 315 22 Z" />
        <path d="M 336 8 A 7 7 0 0 1 336 22 A 5 7 0 0 0 336 8" />
        <circle cx="360" cy="15" r="7" opacity="0.4" />
        <line x1="380" y1="15" x2="600" y2="15" opacity="0.4" />
      </svg>
    </div>
  );
}
