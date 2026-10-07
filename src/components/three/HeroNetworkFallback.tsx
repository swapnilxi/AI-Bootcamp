import React from "react";

/**
 * The hero visual for browsers without WebGL, and the loading state while the
 * 3D scene's chunk arrives.
 *
 * It mirrors the WebGL scene: a wireframe globe with a network running inside
 * it, activation travelling the edges, and a core at the centre. Points of
 * light are cream with an orange halo, matching the neon treatment used
 * elsewhere, so the two never read as different illustrations.
 */

const C = 150; // centre
const R = 132; // globe radius

/** Nodes on two shells, spread by golden angle so they do not clump. */
function shell(count: number, radius: number, offset: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const a = golden * i + offset;
    // Flattened on Y to suggest a sphere seen slightly from above.
    return {
      x: C + Math.cos(a) * radius,
      y: C + Math.sin(a) * radius * 0.88,
      r: radius,
    };
  });
}

const NODES = [...shell(13, R * 0.86, 0), ...shell(8, R * 0.5, 1.7)];

/** Edges between nodes close enough to read as a connection. */
const EDGES = NODES.flatMap((a, i) =>
  NODES.slice(i + 1)
    .map((b, j) => ({ a, b, key: `${i}-${j}`, d: Math.hypot(a.x - b.x, a.y - b.y) }))
    .filter((e) => e.d < R * 0.78)
).map((e, i) => ({ ...e, delay: (i % 13) * 0.38 }));

/** Latitude ellipses that make the globe read as a sphere. */
const LATITUDES = [-0.62, -0.32, 0, 0.32, 0.62].map((lat) => ({
  rx: R * Math.cos(lat * Math.PI * 0.5),
  ry: R * Math.cos(lat * Math.PI * 0.5) * 0.22,
  cy: C + R * Math.sin(lat * Math.PI * 0.5) * 0.88,
  key: `lat${lat}`,
}));

export function HeroNetworkFallback() {
  return (
    <div
      className="w-full aspect-square mx-auto flex items-center justify-center relative select-none"
      aria-label="A globe containing a neural network, with activation travelling between its nodes"
      role="img"
    >
      <style>{`
        @keyframes nnFire {
          0%   { stroke-dashoffset: 320; opacity: 0; }
          15%  { opacity: 0.95; }
          65%  { opacity: 0.95; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes nnBreathe {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes nnCore {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%      { transform: scale(1.14) rotate(180deg); }
        }
        @keyframes nnSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nn-pulse, .nn-node, .nn-core, .nn-shell { animation: none !important; }
          .nn-pulse { opacity: 0.4; stroke-dashoffset: 0; }
        }
      `}</style>

      <svg viewBox="0 0 300 300" className="w-full h-full" aria-hidden="true">
        <defs>
          <radialGradient id="nn-halo">
            <stop offset="0%" stopColor="var(--orange, #F97316)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--orange, #F97316)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nn-core-glow">
            <stop offset="0%" stopColor="var(--cream, #FAF6F0)" stopOpacity="0.5" />
            <stop offset="45%" stopColor="var(--orange, #F97316)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--orange, #F97316)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Globe shell */}
        <g
          className="nn-shell"
          stroke="var(--orange, #F97316)"
          fill="none"
          style={{ transformOrigin: "150px 150px", animation: "nnSpin 54s linear infinite" }}
        >
          <circle cx={C} cy={C} r={R} strokeWidth="0.9" opacity="0.4" />
          <circle cx={C} cy={C} r={R * 0.74} strokeWidth="0.5" opacity="0.16" />
          {LATITUDES.map((l) => (
            <ellipse key={l.key} cx={C} cy={l.cy} rx={l.rx} ry={l.ry} strokeWidth="0.5" opacity="0.16" />
          ))}
          {[0, 36, 72, 108, 144].map((deg) => (
            <ellipse
              key={deg}
              cx={C}
              cy={C}
              rx={R}
              ry={R * 0.3}
              strokeWidth="0.5"
              opacity="0.14"
              transform={`rotate(${deg} ${C} ${C})`}
            />
          ))}
        </g>

        {/* Resting edges */}
        <g stroke="var(--orange, #F97316)" strokeWidth="0.55" opacity="0.2">
          {EDGES.map((e) => (
            <line key={e.key} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} />
          ))}
        </g>

        {/* Activation travelling the edges */}
        <g stroke="var(--cream, #FAF6F0)" strokeWidth="1.4" strokeLinecap="round" fill="none">
          {EDGES.filter((_, i) => i % 3 === 0).map((e) => (
            <line
              key={`p-${e.key}`}
              className="nn-pulse"
              x1={e.a.x}
              y1={e.a.y}
              x2={e.b.x}
              y2={e.b.y}
              strokeDasharray="12 308"
              style={{ animation: `nnFire 4.4s linear ${e.delay}s infinite` }}
            />
          ))}
        </g>

        {/* Neurons: cream cores in orange haloes */}
        {NODES.map((n, i) => (
          <g key={`n-${i}`}>
            <circle cx={n.x} cy={n.y} r="11" fill="url(#nn-halo)" />
            <circle
              className="nn-node"
              cx={n.x}
              cy={n.y}
              r="3.1"
              fill="var(--cream, #FAF6F0)"
              style={{ animation: `nnBreathe 3.4s ease-in-out ${(i % 7) * 0.3}s infinite` }}
            />
          </g>
        ))}

        {/* The core at the centre */}
        <circle cx={C} cy={C} r="34" fill="url(#nn-core-glow)" />
        <g
          className="nn-core"
          style={{ transformOrigin: "150px 150px", animation: "nnCore 6s ease-in-out infinite" }}
        >
          <polygon
            points="150,134 164,142 164,158 150,166 136,158 136,142"
            fill="none"
            stroke="var(--cream, #FAF6F0)"
            strokeWidth="1.1"
            opacity="0.9"
          />
          <circle cx={C} cy={C} r="5.5" fill="var(--cream, #FAF6F0)" />
        </g>
      </svg>
    </div>
  );
}
