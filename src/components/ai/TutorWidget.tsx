"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GraduationCap, X } from "lucide-react";
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

export function TutorWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const context = readContext(pathname);
  const { messages, streaming, error, needsSetup, send, reset } = useStreamingChat("/api/ai/tutor", {
    contextKind: context.kind,
    contextPath: pathname,
  });

  // Close on Escape, the way every other dismissible panel on the site behaves.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI Tutor"
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[60] inline-flex items-center justify-center gap-2.5 w-12 h-12 sm:w-auto sm:h-auto sm:pl-4 sm:pr-5 sm:py-3 rounded-full bg-[linear-gradient(180deg,#FFFFFF_0%,#FAF6F0_55%,#F0E6D4_100%)] text-[#0C0B0A] font-semibold text-sm shadow-[0_10px_30px_-8px_rgba(249, 115, 22,0.55)] hover:-translate-y-0.5 transition-transform"
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-[60] w-[min(26rem,calc(100vw-2.5rem))] h-[min(34rem,calc(100vh-6rem))] flex flex-col rounded-3xl border border-cream/12 bg-[#111114]/95 backdrop-blur-xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cream/10 border border-cream/20 text-text shrink-0">
                <GraduationCap className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text leading-tight">AI Tutor</p>
                <p className="text-[11px] text-text-muted truncate">Reading {context.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="min-h-0 px-2.5 py-1 rounded-full text-[11px] text-text-muted hover:text-gold transition-colors"
                >
                  New
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close AI Tutor"
                className="min-h-0 w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text transition-colors"
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
              <p className="text-sm text-text-muted leading-relaxed">
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
