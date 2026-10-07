/** Technical AI Processor & Neural Core Emblem; draws itself in and features a slowly turning data bus. */
export function LineageEmblem({ className = "w-32 h-32 sm:w-40 sm:h-40" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={`draw-on text-orange fill-none stroke-current filter drop-shadow-[0_0_8px_var(--orange-glow,rgba(255,115,21,0.32))] ${className}`}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* 1. Precision Corner Alignment Brackets */}
      <path d="M 22 36 L 22 22 L 36 22" opacity="0.6" />
      <path d="M 124 22 L 138 22 L 138 36" opacity="0.6" />
      <path d="M 22 124 L 22 138 L 36 138" opacity="0.6" />
      <path d="M 124 138 L 138 138 L 138 124" opacity="0.6" />

      {/* 2. Cardinal Crosshairs & Telemetry Ticks */}
      <line x1="80" y1="4" x2="80" y2="16" />
      <line x1="80" y1="144" x2="80" y2="156" />
      <line x1="4" y1="80" x2="16" y2="80" />
      <line x1="144" y1="80" x2="156" y2="80" />

      {/* 3. Outer Circular Coordinate Ring */}
      <circle cx="80" cy="80" r="72" strokeDasharray="3 7" opacity="0.35" />

      {/* 4. Slowly Rotating Telemetry & Synaptic Orbit Ring */}
      <g className="spin-slow">
        {/* Segmented data bus ring */}
        <circle cx="80" cy="80" r="54" strokeDasharray="24 12 48 12" opacity="0.55" />
        <circle cx="80" cy="80" r="58" strokeDasharray="6 14" opacity="0.3" />

        {/* Orbiting data nodes at diagonals */}
        <circle cx="42" cy="42" r="2" fill="var(--orange, #FF7315)" />
        <circle cx="118" cy="42" r="2" fill="var(--orange, #FF7315)" />
        <circle cx="118" cy="118" r="2" fill="var(--orange, #FF7315)" />
        <circle cx="42" cy="118" r="2" fill="var(--orange, #FF7315)" />

        {/* Diagonal bus traces */}
        <line x1="44" y1="44" x2="54" y2="54" opacity="0.4" />
        <line x1="116" y1="44" x2="106" y2="54" opacity="0.4" />
        <line x1="116" y1="116" x2="106" y2="106" opacity="0.4" />
        <line x1="44" y1="116" x2="54" y2="106" opacity="0.4" />
      </g>

      {/* 5. Central AI Tensor Chip Package */}
      <rect
        x="54"
        y="54"
        width="52"
        height="52"
        rx="8"
        strokeWidth="1.5"
        className="fill-orange/5"
      />

      {/* 6. Processor Bus Pins (Top, Bottom, Left, Right) */}
      {/* Top pins */}
      <line x1="64" y1="54" x2="64" y2="44" opacity="0.7" />
      <line x1="74" y1="54" x2="74" y2="42" opacity="0.9" />
      <line x1="86" y1="54" x2="86" y2="42" opacity="0.9" />
      <line x1="96" y1="54" x2="96" y2="44" opacity="0.7" />

      {/* Bottom pins */}
      <line x1="64" y1="106" x2="64" y2="116" opacity="0.7" />
      <line x1="74" y1="106" x2="74" y2="118" opacity="0.9" />
      <line x1="86" y1="106" x2="86" y2="118" opacity="0.9" />
      <line x1="96" y1="106" x2="96" y2="116" opacity="0.7" />

      {/* Left pins */}
      <line x1="54" y1="64" x2="44" y2="64" opacity="0.7" />
      <line x1="54" y1="74" x2="42" y2="74" opacity="0.9" />
      <line x1="54" y1="86" x2="42" y2="86" opacity="0.9" />
      <line x1="54" y1="96" x2="44" y2="96" opacity="0.7" />

      {/* Right pins */}
      <line x1="106" y1="64" x2="116" y2="64" opacity="0.7" />
      <line x1="106" y1="74" x2="118" y2="74" opacity="0.9" />
      <line x1="106" y1="86" x2="118" y2="86" opacity="0.9" />
      <line x1="106" y1="96" x2="116" y2="96" opacity="0.7" />

      {/* 7. Neural Synapse Pathways Inside Chip */}
      <line x1="66" y1="66" x2="74" y2="74" opacity="0.5" />
      <line x1="94" y1="66" x2="86" y2="74" opacity="0.5" />
      <line x1="66" y1="94" x2="74" y2="86" opacity="0.5" />
      <line x1="94" y1="94" x2="86" y2="86" opacity="0.5" />

      {/* Corner neural nodes */}
      <circle cx="66" cy="66" r="2" fill="var(--cream, #FAF6F0)" />
      <circle cx="94" cy="66" r="2" fill="var(--cream, #FAF6F0)" />
      <circle cx="66" cy="94" r="2" fill="var(--cream, #FAF6F0)" />
      <circle cx="94" cy="94" r="2" fill="var(--cream, #FAF6F0)" />

      {/* 8. Inner Gen-AI Spark / Neural Octa-Core */}
      <polygon
        points="80,66 85,75 94,80 85,85 80,94 75,85 66,80 75,75"
        strokeWidth="1.2"
        opacity="0.85"
      />

      {/* 9. Central Processing Core Ring */}
      <circle cx="80" cy="80" r="8" stroke="var(--orange, #FF7315)" strokeWidth="1.2" />

      {/* 10. Live Pulsing Core Tensor Emitter */}
      <circle
        className="pulse-dot"
        cx="80"
        cy="80"
        r="4"
        fill="var(--orange, #FF7315)"
      />
    </svg>
  );
}
