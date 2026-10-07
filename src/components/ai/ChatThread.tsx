"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import type { ChatMessage } from "./useAi";

interface ChatThreadProps {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  onSend: (text: string) => void;
  placeholder: string;
  suggestions?: string[];
  emptyState?: React.ReactNode;
  /** Turn relative links (/book?service=...) in replies into clickable links */
  linkify?: boolean;
  className?: string;
}

function renderText(text: string, linkify: boolean) {
  if (!linkify) return text;
  const parts = text.split(/(\/(?:book|classes|services|about|contact)[^\s,.)]*)/g);
  return parts.map((part, i) =>
    /^\/(book|classes|services|about|contact)/.test(part) ? (
      <a key={i} href={part} className="text-cream underline underline-offset-2 hover:text-cream/80">
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

/** Shared chat transcript + composer used by the concierge and study assistant. */
export function ChatThread({
  messages,
  streaming,
  error,
  onSend,
  placeholder,
  suggestions = [],
  emptyState,
  linkify = false,
  className = "",
}: ChatThreadProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit(text: string) {
    if (!text.trim() || streaming) return;
    onSend(text);
    setInput("");
  }

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4" data-lenis-prevent aria-live="polite">
        {messages.length === 0 && (
          <div className="space-y-4">
            {emptyState}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="min-h-0 px-3 py-1.5 rounded-full border border-cream/20 text-xs text-text-muted hover:text-text hover:border-cream/40 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-cream/15 border border-cream/20 text-text rounded-br-md"
                  : "bg-white/[0.04] border border-white/[0.07] text-text rounded-bl-md"
              }`}
            >
              {m.content ? (
                renderText(m.content, linkify && m.role === "assistant")
              ) : (
                <span className="inline-flex items-center gap-2 text-text-muted">
                  <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" /> Thinking…
                </span>
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-xs text-cream px-1">{error}</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-end gap-2 p-3 border-t border-white/[0.07]"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder={placeholder}
          aria-label={placeholder}
          className="flex-1 resize-none min-h-[44px] max-h-32 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm text-text focus:outline-none focus:border-gold/60"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="shrink-0 w-11 h-11 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] flex items-center justify-center transition-colors disabled:opacity-40"
          aria-label="Send"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
