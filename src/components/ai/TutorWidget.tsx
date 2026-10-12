"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { RobotHead } from "robot-heads";
import { ChatThread } from "./ChatThread";
import { useStreamingChat } from "./useAi";

/**
 * The persistent AI Tutor.
 *
 * It is contextual rather than a generic chatbot: the route the learner is on
 * is sent with every request, so the tutor knows whether it is being asked
 * about a lesson, a project, a lab or the catalogue, and the suggested openers
 * change to match.
 */

/** Maps the current route to the context the tutor is told about. */
function readContext(pathname: string): { kind: string; label: string; suggestions: string[] } {
  if (pathname.startsWith("/courses/") && pathname.includes("/lessons/")) {
    return {
      kind: "lesson",
      label: "this lesson",
      suggestions: ["Explain this more simply", "Give me a harder example", "Quiz me on this"],
    };
  }
  if (pathname.startsWith("/courses/")) {
    return {
      kind: "course",
      label: "this course",
      suggestions: ["What should I know first?", "How long will this take?", "What will I build?"],
    };
  }
  if (pathname.startsWith("/projects/")) {
    return {
      kind: "project",
      label: "this project",
      suggestions: ["How do I start?", "Review my architecture", "What am I likely to get wrong?"],
    };
  }
  if (pathname.startsWith("/labs/")) {
    return {
      kind: "lab",
      label: "this lab",
      suggestions: ["What should I notice here?", "Why did that change the output?", "What should I try next?"],
    };
  }
  if (pathname.startsWith("/practice")) {
    return {
      kind: "practice",
      label: "practice",
      suggestions: ["Why was my answer wrong?", "Give me a harder one", "Explain the concept behind this"],
    };
  }
  return {
    kind: "general",
    label: "your learning",
    suggestions: ["Where should I start?", "What is RAG, exactly?", "Quiz me on AI agents"],
  };
}

type RobotState = "idle" | "thinking" | "searching" | "listening" | "speaking" | "working" | "happy" | "error" | "sleeping";

/** Emotion sequence that plays on a loop while the bot is idle. */
const IDLE_CYCLE: RobotState[] = ["idle", "idle", "happy", "idle", "searching", "idle", "sleeping", "idle", "working", "idle"];
/** How long (ms) each step in the idle cycle lasts. */
const IDLE_STEP_MS = 3500;

export function TutorWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const context = readContext(pathname);
  const { messages, streaming, error, needsSetup, send, reset } = useStreamingChat("/api/ai/tutor", {
    contextKind: context.kind,
    contextPath: pathname,
  });

  // Flash "happy" for 2 s after a reply finishes streaming.
  const [justFinished, setJustFinished] = useState(false);
  useEffect(() => {
    if (!streaming && messages.length > 0) {
      setJustFinished(true);
      const t = setTimeout(() => setJustFinished(false), 2000);
      return () => clearTimeout(t);
    }
  }, [streaming, messages.length]);

  // Idle emotion cycler — rotates through IDLE_CYCLE when nothing is happening.
  const [cycleIdx, setCycleIdx] = useState(0);
  const isActuallyIdle = !streaming && !justFinished && !(open && messages.length > 0);
  useEffect(() => {
    if (!isActuallyIdle) return;
    const t = setInterval(() => {
      setCycleIdx((i) => (i + 1) % IDLE_CYCLE.length);
    }, IDLE_STEP_MS);
    return () => clearInterval(t);
  }, [isActuallyIdle]);

  const robotState: RobotState = streaming
    ? "thinking"
    : justFinished
    ? "happy"
    : open && messages.length > 0
    ? "listening"
    : IDLE_CYCLE[cycleIdx];

  // Close on Escape, the way every other dismissible panel on the site behaves.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* ── Floating robot-head trigger (hidden when chat is open) ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI Tutor"
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[60] flex flex-col items-center group cursor-pointer select-none bg-transparent border-0 p-0 focus:outline-none transition-transform duration-200 active:scale-95"
        >
          <span className="sr-only">AI Tutor</span>
          <div className="transition-transform duration-200 group-hover:scale-105">
            <RobotHead
              shape="rectangle"
              state={robotState}
              color="#e2762a"
              trimColor="#c45a14"
              screenColor="#fff7f0"
              size={120}
              speed={0.85}
              interactive
              antenna
              floorShadow
            />
          </div>

          {/* Refined pill badge */}
          <div className="mt-2.5 px-3.5 py-1.5 rounded-full flex items-center gap-2 bg-[#16161a]/95 border border-white/15 backdrop-blur-md shadow-[0_8px_20px_-4px_rgba(0,0,0,0.7),0_0_12px_rgba(226,118,42,0.15)] group-hover:border-[#e2762a]/60 group-hover:shadow-[0_8px_24px_-4px_rgba(226,118,42,0.35)] transition-all duration-200">
            <span className="w-2 h-2 rounded-full bg-[#e2762a] shadow-[0_0_8px_#e2762a] shrink-0" />
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200 group-hover:text-white leading-none">
              AI Tutor
            </span>
          </div>
        </button>
      )}

      {/* ── Chat panel — anchored at bottom, featuring the robot head at the top ── */}
      {open && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[60] w-[min(28rem,calc(100vw-2rem))] h-[min(38rem,calc(100vh-5rem))] flex flex-col rounded-3xl border border-white/10 bg-[#111114]/95 backdrop-blur-xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
          <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Single larger robot head sitting on the top */}
              <div className="shrink-0" style={{ lineHeight: 0 }}>
                <RobotHead
                  shape="rectangle"
                  state={robotState}
                  color="#e2762a"
                  trimColor="#c45a14"
                  screenColor="#fff7f0"
                  size={76}
                  speed={0.85}
                  antenna
                  interactive
                />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-white leading-tight">AI Tutor</p>
                <p className="text-xs text-white/50 truncate">Reading {context.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="min-h-0 px-2.5 py-1 rounded-full text-[11px] text-white/50 hover:text-[#e2762a] transition-colors"
                >
                  New
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close AI Tutor"
                className="min-h-0 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <ChatThread
            messages={messages}
            streaming={streaming}
            error={error}
            needsSetup={needsSetup}
            onSend={send}
            placeholder="Ask about anything you are learning…"
            suggestions={context.suggestions}
            linkify
            className="flex-1 min-h-0"
            emptyState={
              <p className="text-sm text-white/50 leading-relaxed">
                I know where you are in the curriculum. Ask me to explain something, quiz you, raise the
                difficulty, or tell you why an answer was wrong.
              </p>
            }
          />
        </div>
      )}
    </>
  );
}
