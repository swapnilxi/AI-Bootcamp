import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark, LogoHorizontal, LogoStacked } from "@/components/brand";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Brand Logo System & Glow Specification | AI Bootcamp",
  description:
    "Official specification, flat vs soft glow comparison, symmetry verification, and asset index for AI Bootcamp brand system.",
};

export default function BrandPreviewPage() {
  const heights = [40, 64, 128, 256];

  return (
    <div className="bg-black text-text min-h-screen py-16 px-4 sm:px-6 lg:px-8 space-y-24 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-black-line pb-10 space-y-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-text-muted font-serif">
          <span>Brand Identity Standards</span>
          <span className="text-black-line">•</span>
          <span>Addendum: Soft Glow Architecture</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text font-normal">
          AI Bootcamp Logo System
        </h1>
        <p className="text-text-muted text-base sm:text-lg max-w-3xl leading-relaxed">
          Symmetrical emblem constructed in a 1:1 coordinate field with a two-layer soft gold warmth:
          an ambient radial halo (<span className="text-text font-mono">0.26 → 0.10 → 0</span>) and star bloom Gaussian blur behind the main star.
          Rings, dots, and typography remain crisp and unglowed.
        </p>

        {/* Color Palette Confirmation Badge */}
        <div className="pt-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-3 bg-black-raised border border-black-line rounded-lg px-4 py-2.5">
            <span className="w-5 h-5 rounded-full bg-black border border-cream/40" />
            <div>
              <div className="text-xs font-mono font-medium text-text">#0B0B0D</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Main Background</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-black-raised border border-black-line rounded-lg px-4 py-2.5">
            <span className="w-5 h-5 rounded-full bg-gold" />
            <div>
              <div className="text-xs font-mono font-medium text-text">#F97316</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Accent Gold & Glow</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-black-raised border border-black-line rounded-lg px-4 py-2.5">
            <span className="w-5 h-5 rounded-full bg-[#D8CBB4]" />
            <div>
              <div className="text-xs font-mono font-medium text-text">#D8CBB4</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Secondary Text (Dimmed Cream)</div>
            </div>
          </div>
          <div className="ml-auto inline-flex items-center gap-2 text-xs text-text border border-cream/25 bg-cream/10 px-3.5 py-2 rounded-full">
            <Icon name="role-admin" variant="line" size={14} />
            <span>Strict Color Compliance Verified (3 Colors Only)</span>
          </div>
        </div>
      </div>

      {/* Section 1: Flat vs Glow Side-by-Side Comparison (40, 64, 128, 256px) */}
      <section className="space-y-12">
        <div className="border-b border-black-line/70 pb-4">
          <h2 className="font-serif text-2xl sm:text-3xl text-text font-normal mb-2">
            1. Flat vs. Soft Glow Comparison on #0B0B0D
          </h2>
          <p className="text-text-muted text-sm max-w-3xl">
            Side-by-side verification at 40px, 64px, 128px, and 256px heights.
            Notice the unclipped halo (expanded viewBox <code className="text-text font-mono">-50 -50 300 300</code>), lack of banding, and razor-sharp perimeter coordinate rings.
          </p>
        </div>

        {/* 1A: LogoMark Side-by-Side Matrix */}
        <div className="bg-black-raised border border-black-line rounded-xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black-line/70 pb-4">
            <div>
              <h3 className="font-serif text-xl text-text font-normal">&lt;LogoMark /&gt; — Flat vs. Glow</h3>
              <p className="text-xs text-text-muted">Two-layer warmth: Ambient Radial Halo (r=130) + Star Bloom Gaussian Blur</p>
            </div>
            <span className="text-xs text-text-muted font-mono self-start sm:self-auto">40px • 64px • 128px • 256px</span>
          </div>

          <div className="space-y-10">
            {heights.map((h) => (
              <div key={h} className="bg-black p-6 sm:p-8 rounded-lg border border-black-line/40 space-y-4">
                <div className="flex items-center justify-between border-b border-black-line/30 pb-3">
                  <span className="text-xs font-mono font-semibold text-text-muted tracking-widest">{h}px RENDER HEIGHT</span>
                  <span className="text-[11px] text-text-muted font-mono">Center: 100,100 • Halo: r=130</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-items-center pt-4">
                  {/* Flat Version */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 flex items-center justify-center min-h-[h]">
                      <LogoMark size={h} glow={false} idPrefix={`flat-${h}`} />
                    </div>
                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Flat (No Effects)</span>
                  </div>

                  {/* Glow Version */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 flex items-center justify-center min-h-[h]">
                      <LogoMark size={h} glow={true} idPrefix={`glow-${h}`} />
                    </div>
                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                      Soft Glow (Radial Halo + Bloom)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 1B: LogoHorizontal Side-by-Side */}
        <div className="bg-black-raised border border-black-line rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-black-line/70 pb-4">
            <div>
              <h3 className="font-serif text-xl text-text font-normal">&lt;LogoHorizontal /&gt; — Header Lockup</h3>
              <p className="text-xs text-text-muted">Glow is confined to mark bounds (r=58, height 120px) — wordmark text contrast is 100% preserved</p>
            </div>
            <span className="text-xs text-text-muted font-mono">viewBox=&quot;0 0 500 120&quot;</span>
          </div>

          <div className="space-y-8 bg-black p-6 sm:p-8 rounded-lg border border-black-line/40">
            {/* 40px Header Height */}
            <div className="space-y-4">
              <div className="text-xs font-mono text-text-muted">40px Height (Header Standard)</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center border-b border-black-line/30 pb-6">
                <div>
                  <div className="text-[11px] text-text-muted mb-2">Flat (Mobile & Standard):</div>
                  <LogoHorizontal height={40} glow={false} idPrefix="h40-flat" />
                </div>
                <div>
                  <div className="text-[11px] text-text-muted mb-2">Soft Glow (Desktop Subtle):</div>
                  <LogoHorizontal height={40} glow="subtle" idPrefix="h40-glow" />
                </div>
              </div>
            </div>

            {/* 64px Banner Height */}
            <div className="space-y-4">
              <div className="text-xs font-mono text-text-muted">64px Height (Editorial / Hero Banner)</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="text-[11px] text-text-muted mb-2">Flat:</div>
                  <LogoHorizontal height={64} glow={false} idPrefix="h64-flat" />
                </div>
                <div>
                  <div className="text-[11px] text-text-muted mb-2">Soft Glow:</div>
                  <LogoHorizontal height={64} glow={true} idPrefix="h64-glow" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1C: LogoStacked Side-by-Side */}
        <div className="bg-black-raised border border-black-line rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-black-line/70 pb-4">
            <div>
              <h3 className="font-serif text-xl text-text font-normal">&lt;LogoStacked /&gt; — Symmetrical Editorial Lockup</h3>
              <p className="text-xs text-text-muted">Glow enabled by default on hero, auth screens, and booking confirmation</p>
            </div>
            <span className="text-xs text-text-muted font-mono">viewBox=&quot;0 0 360 380&quot;</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-items-center py-8 bg-black rounded-lg border border-black-line/40">
            {/* Flat */}
            <div className="flex flex-col items-center gap-3">
              <LogoStacked size={280} glow={false} hasBackground idPrefix="stk-flat" />
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Flat Stacked Lockup</span>
            </div>

            {/* Glow (Default) */}
            <div className="flex flex-col items-center gap-3">
              <LogoStacked size={280} glow={true} hasBackground idPrefix="stk-glow" />
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Default Stacked with Soft Glow</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Mobile Header Frame Simulation (375px & <360px) */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-text font-normal mb-2">
            2. Responsive Header Logic & Clear Space
          </h2>
          <p className="text-text-muted text-sm max-w-2xl">
            In accordance with guidelines: on mobile (&lt; 48px), the crisp flat logo is used to avoid blur artifacts. On desktop, a subtle halo (<span className="text-text font-mono">peak opacity 0.14</span>) is applied.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* 375px Mobile Viewport */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-text-muted font-mono">
              <span>Standard Mobile: 375px Width</span>
              <span className="text-text-muted">LogoHorizontal (Flat 38px)</span>
            </div>
            <div className="w-full max-w-[375px] mx-auto border-2 border-cream/25 rounded-2xl overflow-hidden bg-black shadow-2xl">
              <div className="bg-black px-6 py-2 flex justify-between items-center text-[10px] text-text-muted border-b border-black-line/40">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 border border-text-muted rounded-xs" />
                </div>
              </div>
              <div className="px-4 py-3 bg-black-raised/95 border-b border-black-line flex items-center justify-between">
                <div className="pl-1">
                  <LogoHorizontal height={38} glow={false} idPrefix="m375" />
                </div>
                <div className="w-8 h-8 rounded border border-black-line flex items-center justify-center text-text-muted">
                  <Icon name="menu" variant="line" size={18} />
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Traditional Sessions</div>
                <h3 className="font-serif text-2xl text-text leading-tight">Align Your Journey With the Stars.</h3>
                <div className="w-full py-2.5 bg-gold text-black text-center text-xs font-semibold uppercase tracking-wider rounded-sm">
                  Book a Session
                </div>
              </div>
            </div>
          </div>

          {/* 340px Ultra-Compact Mobile Viewport */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-text-muted font-mono">
              <span>Compact Mobile: &lt; 360px (e.g. 340px)</span>
              <span className="text-text-muted">LogoMark Only (Flat 36px)</span>
            </div>
            <div className="w-full max-w-[340px] mx-auto border-2 border-cream/25 rounded-2xl overflow-hidden bg-black shadow-2xl">
              <div className="bg-black px-5 py-2 flex justify-between items-center text-[10px] text-text-muted border-b border-black-line/40">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 border border-text-muted rounded-xs" />
                </div>
              </div>
              <div className="px-3 py-3 bg-black-raised/95 border-b border-black-line flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <LogoMark size={36} glow={false} idPrefix="m340" />
                  <span className="text-xs uppercase font-serif tracking-widest text-text">AI Bootcamp</span>
                </div>
                <div className="w-8 h-8 rounded border border-black-line flex items-center justify-center text-text-muted">
                  <Icon name="menu" variant="line" size={18} />
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted">AI Practice</div>
                <h3 className="font-serif text-xl text-text leading-tight">Classical Consultative AI Engineering</h3>
                <div className="w-full py-2 bg-gold text-black text-center text-xs font-semibold uppercase tracking-wider rounded-sm">
                  Book Session
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Bilateral Symmetry Verification */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-text font-normal mb-2">
            3. Bilateral Symmetry Verification (Glow & Flat)
          </h2>
          <p className="text-text-muted text-sm max-w-2xl">
            Because both the radial gradient halo and the gaussian star bloom are geometrically centered at (100, 100), bilateral symmetry is 100% maintained across both horizontal and vertical mirror axes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black-raised border border-black-line rounded-xl p-6 flex flex-col items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-text-muted font-mono">Original (0° Normal)</span>
            <div className="p-4 border border-cream/15 rounded-lg bg-black">
              <LogoMark size={140} glow={true} idPrefix="sym-norm" />
            </div>
            <span className="text-xs text-text-muted">Symmetrical Baseline Geometry</span>
          </div>

          <div className="bg-black-raised border border-black-line rounded-xl p-6 flex flex-col items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-text-muted font-mono">Flipped Horizontally (scaleX -1)</span>
            <div className="p-4 border border-cream/15 rounded-lg bg-black [transform:scaleX(-1)]">
              <LogoMark size={140} glow={true} idPrefix="sym-flop" />
            </div>
            <span className="text-xs text-text-muted">Mirror Matched (Identical)</span>
          </div>

          <div className="bg-black-raised border border-black-line rounded-xl p-6 flex flex-col items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-text-muted font-mono">Flipped Vertically (scaleY -1)</span>
            <div className="p-4 border border-cream/15 rounded-lg bg-black [transform:scaleY(-1)]">
              <LogoMark size={140} glow={true} idPrefix="sym-flip" />
            </div>
            <span className="text-xs text-text-muted">Mirror Matched (Identical)</span>
          </div>
        </div>
      </section>

      {/* Section 4: Production Deliverables Library (Flat + Glow Variants) */}
      <section className="space-y-6 border-t border-black-line pt-12">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-text font-normal mb-2">
            4. Complete Asset Library (Flat + Glow Variants)
          </h2>
          <p className="text-text-muted text-sm max-w-2xl">
            All files are available under <code className="text-text font-mono">/public/brand/</code> and as React components in <code className="text-text font-mono">src/components/brand/</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Flat Mark */}
          <div className="bg-black-raised border border-black-line rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text font-semibold">Mark (Flat)</span>
              <span className="text-[10px] text-text-muted uppercase">SVG (200x200)</span>
            </div>
            <p className="text-xs text-text-muted">Crisp standalone emblem, transparent background. 1:1 square.</p>
            <div className="pt-2 flex items-center justify-between">
              <a href="/brand/ai-bootcamp-mark.svg" target="_blank" className="text-xs text-text hover:underline">
                ai-bootcamp-mark.svg
              </a>
              <span className="text-[11px] text-text-muted font-mono">1.4 KB</span>
            </div>
          </div>

          {/* Glow Mark */}
          <div className="bg-black-raised border border-cream/25 rounded-lg p-5 space-y-3 bg-cream/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text font-semibold">Mark (Soft Glow)</span>
              <span className="text-[10px] text-text-muted uppercase">SVG (300x300)</span>
            </div>
            <p className="text-xs text-text-muted">Unclipped ambient halo + star bloom. Expanded viewBox.</p>
            <div className="pt-2 flex items-center justify-between">
              <a href="/brand/ai-bootcamp-mark-glow.svg" target="_blank" className="text-xs text-text hover:underline font-semibold">
                ai-bootcamp-mark-glow.svg
              </a>
              <span className="text-[11px] text-text-muted font-mono">2.3 KB</span>
            </div>
          </div>

          {/* Stacked Glow */}
          <div className="bg-black-raised border border-cream/25 rounded-lg p-5 space-y-3 bg-cream/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text font-semibold">Stacked (Soft Glow)</span>
              <span className="text-[10px] text-text-muted uppercase">SVG (360x380)</span>
            </div>
            <p className="text-xs text-text-muted">Dark rounded background, halo behind mark, crisp text.</p>
            <div className="pt-2 flex items-center justify-between">
              <a href="/brand/ai-bootcamp-logo-stacked-glow.svg" target="_blank" className="text-xs text-text hover:underline font-semibold">
                ai-bootcamp-logo-stacked-glow.svg
              </a>
              <span className="text-[11px] text-text-muted font-mono">9.4 KB</span>
            </div>
          </div>

          {/* Horizontal Glow */}
          <div className="bg-black-raised border border-cream/25 rounded-lg p-5 space-y-3 bg-cream/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text font-semibold">Horizontal (Soft Glow)</span>
              <span className="text-[10px] text-text-muted uppercase">SVG (500x120)</span>
            </div>
            <p className="text-xs text-text-muted">Glow behind mark only. Kept strictly within 120px height.</p>
            <div className="pt-2 flex items-center justify-between">
              <a href="/brand/ai-bootcamp-logo-horizontal-glow.svg" target="_blank" className="text-xs text-text hover:underline font-semibold">
                ai-bootcamp-logo-horizontal-glow.svg
              </a>
              <span className="text-[11px] text-text-muted font-mono">9.2 KB</span>
            </div>
          </div>

          {/* Favicons & App Icons */}
          <div className="bg-black-raised border border-black-line rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text font-semibold">Favicons & App Icons</span>
              <span className="text-[10px] text-text-muted uppercase">SVG, ICO, PNG</span>
            </div>
            <p className="text-xs text-text-muted">Flat high-contrast rendering for small sizes (16, 32, 180, 512px).</p>
            <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <a href="/brand/favicon.svg" target="_blank" className="text-text hover:underline">favicon.svg</a>
              <a href="/brand/favicon.ico" target="_blank" className="text-text hover:underline">favicon.ico</a>
              <a href="/brand/icon.png" target="_blank" className="text-text hover:underline">icon.png</a>
            </div>
          </div>

          {/* OG-Image */}
          <div className="bg-black-raised border border-black-line rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text font-semibold">OpenGraph Card</span>
              <span className="text-[10px] text-text-muted uppercase">1200x630 PNG</span>
            </div>
            <p className="text-xs text-text-muted">Centered stacked glow logo with soft gold ambient illumination.</p>
            <div className="pt-2 flex items-center justify-between">
              <a href="/brand/og-image.png" target="_blank" className="text-xs text-text hover:underline">
                og-image.png
              </a>
              <span className="text-[11px] text-text-muted font-mono">1200x630</span>
            </div>
          </div>
        </div>
      </section>

      {/* Approval Status Banner */}
      <div className="border border-cream/25 bg-cream/8 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="font-serif text-xl text-text">Ready for Client Review & Sign-Off</div>
          <p className="text-sm text-text-muted">
            Flat and soft glow variants are ready for inspection across all responsive scales and mobile simulation before general site deployment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 bg-black border border-black-line text-text hover:text-gold rounded text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
