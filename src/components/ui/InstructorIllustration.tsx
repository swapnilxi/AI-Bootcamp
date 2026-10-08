import React from "react";

interface InstructorIllustrationProps {
  type: "arun" | "swapnil" | "shresth" | "rag" | "agent" | "neural" | string;
  className?: string;
  size?: number | string;
}

export function InstructorIllustration({
  type,
  className = "",
  size = "100%",
}: InstructorIllustrationProps) {
  const normType = type.toLowerCase();

  // 1. Arun Chauhan — Enterprise RAG & AI Architecture
  if (normType.includes("arun") || normType.includes("rag")) {
    return (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${className}`}
        style={size !== "100%" ? { width: size, height: size } : undefined}
        role="img"
        aria-label="Enterprise RAG Architecture"
      >
        <defs>
          <linearGradient id="arun-bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E140F" />
            <stop offset="50%" stopColor="#141113" />
            <stop offset="100%" stopColor="#0D0C10" />
          </linearGradient>
          <linearGradient id="arun-orange" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="60%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
          <linearGradient id="arun-purple" x1="0" y1="120" x2="120" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <radialGradient id="arun-glow" cx="60" cy="60" r="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Dark Canvas */}
        <rect width="120" height="120" fill="url(#arun-bg)" />
        <circle cx="60" cy="60" r="45" fill="url(#arun-glow)" />

        {/* Outer Hexagon / Matrix Lattice */}
        <polygon
          points="60,18 96,39 96,81 60,102 24,81 24,39"
          stroke="url(#arun-orange)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
          strokeOpacity="0.45"
        />

        {/* Mid Concentric Hexagon */}
        <polygon
          points="60,28 88,44 88,76 60,92 32,76 32,44"
          stroke="url(#arun-orange)"
          strokeWidth="1.75"
          fill="rgba(249,115,22,0.06)"
        />

        {/* Internal Cross-Lattice Streams (RAG Retrieval Mesh) */}
        <line x1="60" y1="28" x2="60" y2="92" stroke="url(#arun-orange)" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="32" y1="44" x2="88" y2="76" stroke="url(#arun-orange)" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="32" y1="76" x2="88" y2="44" stroke="url(#arun-orange)" strokeWidth="1.2" strokeOpacity="0.6" />

        {/* Semantic Vector Nodes (Outer Points) */}
        <circle cx="60" cy="18" r="3.5" fill="#FB923C" />
        <circle cx="96" cy="39" r="3" fill="#F97316" />
        <circle cx="96" cy="81" r="3" fill="#F97316" />
        <circle cx="60" cy="102" r="3.5" fill="#FB923C" />
        <circle cx="24" cy="81" r="3" fill="#F97316" />
        <circle cx="24" cy="39" r="3" fill="#F97316" />

        {/* Central Luminous Retrieval Diamond */}
        <polygon
          points="60,42 75,60 60,78 45,60"
          fill="url(#arun-purple)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        {/* Core Jewel Sparkle */}
        <circle cx="60" cy="60" r="3.5" fill="#FFFFFF" />
        <circle cx="60" cy="60" r="6" stroke="#FB923C" strokeWidth="1.2" strokeOpacity="0.75" />
      </svg>
    );
  }

  // 2. Swapnil Gupta — Autonomous AI Agents & Multi-Agent Loops
  if (normType.includes("swapnil") || normType.includes("agent")) {
    return (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${className}`}
        style={size !== "100%" ? { width: size, height: size } : undefined}
        role="img"
        aria-label="Autonomous Multi-Agent Systems"
      >
        <defs>
          <linearGradient id="swapnil-bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#161224" />
            <stop offset="50%" stopColor="#111019" />
            <stop offset="100%" stopColor="#0B0912" />
          </linearGradient>
          <linearGradient id="swapnil-purple" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <radialGradient id="swapnil-glow" cx="60" cy="60" r="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9333EA" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Dark Canvas */}
        <rect width="120" height="120" fill="url(#swapnil-bg)" />
        <circle cx="60" cy="60" r="48" fill="url(#swapnil-glow)" />

        {/* Orbital Agent Loops */}
        <ellipse
          cx="60"
          cy="60"
          rx="42"
          ry="18"
          stroke="url(#swapnil-purple)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeOpacity="0.6"
          transform="rotate(-25 60 60)"
        />
        <ellipse
          cx="60"
          cy="60"
          rx="42"
          ry="18"
          stroke="#F97316"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          transform="rotate(35 60 60)"
        />

        {/* Central Coordinator Core */}
        <circle cx="60" cy="60" r="18" fill="rgba(147, 51, 234, 0.2)" stroke="url(#swapnil-purple)" strokeWidth="2" />
        <circle cx="60" cy="60" r="9" fill="url(#swapnil-purple)" />
        <circle cx="60" cy="60" r="3.5" fill="#FFFFFF" />

        {/* Orbiting Specialist Sub-Agents */}
        {/* Agent 1 (Top Left) */}
        <circle cx="28" cy="38" r="5" fill="#A855F7" stroke="#FFFFFF" strokeWidth="1.2" />
        <line x1="33" y1="41" x2="51" y2="52" stroke="#A855F7" strokeWidth="1.2" strokeDasharray="2 2" />

        {/* Agent 2 (Top Right) */}
        <circle cx="92" cy="42" r="5.5" fill="#F97316" stroke="#FFFFFF" strokeWidth="1.2" />
        <line x1="87" y1="45" x2="69" y2="55" stroke="#F97316" strokeWidth="1.2" strokeDasharray="2 2" />

        {/* Agent 3 (Bottom Right) */}
        <circle cx="86" cy="84" r="5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.2" />
        <line x1="81" y1="80" x2="67" y2="67" stroke="#6366F1" strokeWidth="1.2" strokeDasharray="2 2" />

        {/* Agent 4 (Bottom Left) */}
        <circle cx="34" cy="80" r="4.5" fill="#EC4899" stroke="#FFFFFF" strokeWidth="1.2" />
        <line x1="39" y1="76" x2="53" y2="66" stroke="#EC4899" strokeWidth="1.2" strokeDasharray="2 2" />

        {/* Sparkle Synthesis Mark */}
        <path
          d="M60 22L61.5 27L66.5 28.5L61.5 30L60 35L58.5 30L53.5 28.5L58.5 27L60 22Z"
          fill="#FDE047"
        />
      </svg>
    );
  }

  // 3. Shresth Sahai — Deep Learning & Neural Architectures
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full ${className}`}
      style={size !== "100%" ? { width: size, height: size } : undefined}
      role="img"
      aria-label="Deep Learning and Neural Architectures"
    >
      <defs>
        <linearGradient id="shresth-bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B1A17" />
          <stop offset="50%" stopColor="#0D1516" />
          <stop offset="100%" stopColor="#080E10" />
        </linearGradient>
        <linearGradient id="shresth-emerald" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
        <radialGradient id="shresth-glow" cx="60" cy="60" r="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Dark Canvas */}
      <rect width="120" height="120" fill="url(#shresth-bg)" />
      <circle cx="60" cy="60" r="48" fill="url(#shresth-glow)" />

      {/* Deep Learning Layer Synapses (Interconnections) */}
      {/* Input Layer (X: 28) to Hidden Layer 1 (X: 48) */}
      <line x1="28" y1="36" x2="48" y2="30" stroke="#34D399" strokeWidth="1" strokeOpacity="0.45" />
      <line x1="28" y1="36" x2="48" y2="60" stroke="#34D399" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="28" y1="60" x2="48" y2="30" stroke="#34D399" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="28" y1="60" x2="48" y2="60" stroke="#34D399" strokeWidth="1.3" strokeOpacity="0.6" />
      <line x1="28" y1="60" x2="48" y2="90" stroke="#34D399" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="28" y1="84" x2="48" y2="60" stroke="#34D399" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="28" y1="84" x2="48" y2="90" stroke="#34D399" strokeWidth="1" strokeOpacity="0.45" />

      {/* Hidden Layer 1 (X: 48) to Hidden Layer 2 (X: 72) */}
      <line x1="48" y1="30" x2="72" y2="30" stroke="#10B981" strokeWidth="1.2" strokeOpacity="0.6" />
      <line x1="48" y1="30" x2="72" y2="60" stroke="#10B981" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="48" y1="60" x2="72" y2="30" stroke="#10B981" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="48" y1="60" x2="72" y2="60" stroke="#F97316" strokeWidth="1.5" strokeOpacity="0.8" />
      <line x1="48" y1="60" x2="72" y2="90" stroke="#10B981" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="48" y1="90" x2="72" y2="60" stroke="#10B981" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="48" y1="90" x2="72" y2="90" stroke="#10B981" strokeWidth="1.2" strokeOpacity="0.6" />

      {/* Hidden Layer 2 (X: 72) to Output Layer (X: 92) */}
      <line x1="72" y1="30" x2="92" y2="46" stroke="#34D399" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="72" y1="60" x2="92" y2="46" stroke="#34D399" strokeWidth="1.2" strokeOpacity="0.6" />
      <line x1="72" y1="60" x2="92" y2="74" stroke="#34D399" strokeWidth="1.2" strokeOpacity="0.6" />
      <line x1="72" y1="90" x2="92" y2="74" stroke="#34D399" strokeWidth="1" strokeOpacity="0.5" />

      {/* Nodes (Neurons) */}
      {/* Input Layer */}
      <circle cx="28" cy="36" r="3.5" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
      <circle cx="28" cy="60" r="4" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
      <circle cx="28" cy="84" r="3.5" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />

      {/* Hidden 1 */}
      <circle cx="48" cy="30" r="4" fill="#047857" stroke="#10B981" strokeWidth="1.5" />
      <circle cx="48" cy="60" r="5.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
      <circle cx="48" cy="90" r="4" fill="#047857" stroke="#10B981" strokeWidth="1.5" />

      {/* Hidden 2 */}
      <circle cx="72" cy="30" r="4" fill="#047857" stroke="#10B981" strokeWidth="1.5" />
      <circle cx="72" cy="60" r="6" fill="#F97316" stroke="#FFFFFF" strokeWidth="1.5" />
      <circle cx="72" cy="90" r="4" fill="#047857" stroke="#10B981" strokeWidth="1.5" />

      {/* Output / Foundation Model Nodes */}
      <circle cx="92" cy="46" r="4.5" fill="#34D399" stroke="#FFFFFF" strokeWidth="1.5" />
      <circle cx="92" cy="74" r="4.5" fill="#34D399" stroke="#FFFFFF" strokeWidth="1.5" />

      {/* Central Attention Flash */}
      <circle cx="60" cy="60" r="2" fill="#FFFFFF" />
    </svg>
  );
}
