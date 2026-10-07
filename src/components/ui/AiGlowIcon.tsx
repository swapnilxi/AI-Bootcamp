"use client";

import React from "react";

export type AiIconType =
  | "spark"
  | "genai"
  | "agent"
  | "network"
  | "rag"
  | "vector"
  | "tensor"
  | "tool"
  | "workflow";

interface AiGlowIconProps {
  type: AiIconType;
  size?: "sm" | "md" | "lg";
  className?: string;
  glow?: "subtle" | "none";
}

export function AiGlowIcon({
  type,
  size = "md",
  className = "",
  glow = "subtle",
}: AiGlowIconProps) {
  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
  };

  const svgSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const glowStyle =
    glow === "subtle"
      ? "filter drop-shadow-[0_0_5px_var(--orange-glow,rgba(255,115,21,0.35))]"
      : "";

  return (
    <div
      className={`inline-flex items-center justify-center border transition-all duration-300 ${sizeClasses[size]} bg-orange/10 border-orange/30 text-orange shadow-[0_0_14px_-2px_var(--orange-soft,rgba(255,115,21,0.18))] hover:border-orange hover:shadow-[0_0_20px_0_var(--orange-glow,rgba(255,115,21,0.3))] ${className}`}
    >
      <svg
        width={svgSizes[size]}
        height={svgSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 ${glowStyle}`}
      >
        {renderSvgPath(type)}
      </svg>
    </div>
  );
}

function renderSvgPath(type: AiIconType): React.ReactNode {
  switch (type) {
    // 4-point Gen AI intelligence spark with synaptic nodes
    case "spark":
    case "genai":
      return (
        <>
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
          <circle cx="19" cy="5" r="1.5" fill="currentColor" />
          <circle cx="5" cy="19" r="1" fill="currentColor" />
        </>
      );

    // Autonomous AI Agent Loop (Plan -> Act -> Observe)
    case "agent":
      return (
        <>
          <rect x="6" y="6" width="12" height="12" rx="3" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <path d="M18 6a8 8 0 0 1 2 4M4 14a8 8 0 0 1 2 4" />
        </>
      );

    // Deep Neural Network synapses and layers
    case "network":
      return (
        <>
          <circle cx="5" cy="7" r="1.8" />
          <circle cx="5" cy="17" r="1.8" />
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
          <path d="M6.5 7.5l4 3.5M6.5 6.5l4-1M6.5 16.5l4-3.5M6.5 17.5l4 1" />
          <path d="M13.8 6l4 5M13.8 12h4M13.8 18l4-5" />
        </>
      );

    // RAG: Document chunk embeddings to vector store
    case "rag":
      return (
        <>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </>
      );

    // High-dimensional vector space with distance connections
    case "vector":
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="16" cy="7" r="1.5" />
          <circle cx="10" cy="15" r="1.5" />
          <circle cx="16" cy="16" r="1.5" />
          <path d="M8 8l2 7M16 7l-6 8M10 15h6" />
        </>
      );

    // Hardware Tensor Accelerators (CUDA/MPS tensor grid)
    case "tensor":
      return (
        <>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </>
      );

    // Tool calling schema / MCP contracts
    case "tool":
      return (
        <>
          <path d="M4 17l6-6-6-6M12 19h8" />
          <circle cx="18" cy="7" r="2" />
          <path d="M16 7h-2M18 9v2" />
        </>
      );

    // Multi-Agent Workflow orchestration
    case "workflow":
      return (
        <>
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="12" cy="18" r="3" />
          <path d="M9 6h6M7.5 8.5l3 7M16.5 8.5l-3 7" />
        </>
      );
  }
}
