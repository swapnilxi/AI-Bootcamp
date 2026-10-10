"use client";

import { useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { wrapLessonFragment } from "@/lib/lessons/shared";

/** A swipeable flashcard deck over a lesson's breakdown chunks — each card stays sandboxed in its own iframe. */
export function SwipeDeck({ chunks, lessonTitle }: { chunks: { title: string; html: string }[]; lessonTitle: string }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  if (chunks.length === 0) return null;
  const chunk = chunks[index];

  function go(delta: number) {
    setDirection(delta);
    setIndex((i) => Math.max(0, Math.min(chunks.length - 1, i + delta)));
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -80 && index < chunks.length - 1) go(1);
    else if (info.offset.x > 80 && index > 0) go(-1);
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative h-[380px] w-full max-w-xl overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            initial={{ x: direction >= 0 ? 80 : -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction >= 0 ? -80 : 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={onDragEnd}
            className="editorial-card glow-tl absolute inset-0 flex cursor-grab flex-col overflow-hidden rounded-2xl active:cursor-grabbing"
          >
            <div className="shrink-0 border-b border-white/[0.07] px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Card {index + 1} of {chunks.length}
              </p>
              <h3 className="mt-1 font-serif text-lg text-text">{chunk.title}</h3>
            </div>
            <iframe
              title={`${lessonTitle} — ${chunk.title}`}
              srcDoc={wrapLessonFragment(chunk.html, chunk.title)}
              sandbox=""
              className="h-full w-full flex-1 bg-white"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-text-muted transition-colors hover:text-gold disabled:opacity-30"
          aria-label="Previous card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {chunks.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? "bg-gold" : "bg-white/15"}`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          disabled={index === chunks.length - 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-text-muted transition-colors hover:text-gold disabled:opacity-30"
          aria-label="Next card"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
