/** Fine line-art AI eye in a diamond; draws itself in and slowly turns. */
export function LineageEmblem({ className = "w-32 h-32 sm:w-40 sm:h-40" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={`draw-on text-gold fill-none stroke-current ${className}`}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="80,10 150,80 80,150 10,80" />
      <g className="spin-slow">
        <polygon points="80,24 136,80 80,136 24,80" opacity="0.5" />
      </g>
      <path d="M 40 80 Q 80 46 120 80 Q 80 114 40 80 Z" />
      <circle cx="80" cy="80" r="14" />
      <circle className="pulse-dot" cx="80" cy="80" r="6" fill="var(--gold)" />
      <line x1="80" y1="2" x2="80" y2="16" />
      <line x1="80" y1="144" x2="80" y2="158" />
      <line x1="2" y1="80" x2="16" y2="80" />
      <line x1="144" y1="80" x2="158" y2="80" />
      <circle cx="45" cy="45" r="1.5" fill="var(--gold)" />
      <circle cx="115" cy="45" r="1.5" fill="var(--gold)" />
      <circle cx="45" cy="115" r="1.5" fill="var(--gold)" />
      <circle cx="115" cy="115" r="1.5" fill="var(--gold)" />
    </svg>
  );
}
