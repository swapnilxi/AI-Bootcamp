"use client";

import React, { useState } from "react";
import { CheckCircle2, HelpCircle, MessageCircle, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { ChatThread } from "./ChatThread";
import { useAiEnabled, useStreamingChat } from "./useAi";

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

function Quiz({ endpoint }: { endpoint: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setAnswers({});
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create a quiz");
      setQuestions(data.questions);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!questions) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-text-muted">
          Check your understanding with five quick questions generated from this lesson.
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Writing your quiz…" : "Generate quiz"}
        </button>
        {error && <p className="text-xs text-text-muted">{error}</p>}
      </div>
    );
  }

  const answered = Object.keys(answers).length;
  const score = questions.reduce((s, q, i) => s + (answers[i] === q.answerIndex ? 1 : 0), 0);

  return (
    <div className="p-5 space-y-6">
      {questions.map((q, qi) => {
        const picked = answers[qi];
        const done = picked !== undefined;
        return (
          <div key={qi} className="space-y-2.5">
            <p className="text-sm text-text font-medium">
              {qi + 1}. {q.question}
            </p>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answerIndex;
                const state = !done
                  ? "border-white/10 hover:border-gold/40 text-text"
                  : isCorrect
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                  : oi === picked
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : "border-white/[0.06] text-text-muted";
                return (
                  <button
                    key={oi}
                    disabled={done}
                    onClick={() => setAnswers({ ...answers, [qi]: oi })}
                    className={`min-h-0 text-left px-3.5 py-2.5 rounded-xl border text-sm transition-colors flex items-center gap-2 ${state}`}
                  >
                    {done && isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    {done && !isCorrect && oi === picked && <XCircle className="w-4 h-4 shrink-0" />}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {done && <p className="text-xs text-text-muted leading-relaxed">{q.explanation}</p>}
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
        <p className="text-sm text-text-muted">
          {answered === questions.length ? (
            <>
              Score: <span className="text-text font-semibold">{score}/{questions.length}</span>
            </>
          ) : (
            `${answered}/${questions.length} answered`
          )}
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="min-h-0 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> {loading ? "Generating…" : "New quiz"}
        </button>
      </div>
    </div>
  );
}

/** AI study tools under a lesson: a grounded Q&A assistant and a generated quiz. */
export function LessonAiPanel({ courseId, lessonId, lessonTitle }: { courseId: string; lessonId: string; lessonTitle: string }) {
  const enabled = useAiEnabled();
  const [tab, setTab] = useState<"ask" | "quiz">("ask");
  const base = `/api/courses/${courseId}/lessons/${lessonId}`;
  const chat = useStreamingChat(`${base}/assistant`);

  if (!enabled) return null;

  return (
    <section className="rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 border-b border-white/[0.07]">
        <div className="flex gap-1" role="tablist">
          {(
            [
              ["ask", "Ask the study assistant", MessageCircle],
              ["quiz", "Quiz me", HelpCircle],
            ] as const
          ).map(([key, label, TabIcon]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-0 inline-flex items-center gap-2 px-3 pb-3 text-sm border-b-2 -mb-px transition-colors ${
                tab === key ? "border-text text-text" : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              <TabIcon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
        <span className="hidden sm:inline text-[11px] text-text-muted pb-3">AI · may make mistakes</span>
      </div>

      {tab === "ask" ? (
        <ChatThread
          className="h-[420px]"
          messages={chat.messages}
          streaming={chat.streaming}
          error={chat.error}
          onSend={chat.send}
          placeholder={`Ask about "${lessonTitle}"…`}
          suggestions={["Explain this lesson simply", "Give me a real-life example", "What should I remember most?"]}
          emptyState={
            <p className="text-sm text-text-muted">
              Questions about this lesson? The assistant answers from the lesson notes.
            </p>
          }
        />
      ) : (
        <Quiz endpoint={`${base}/quiz`} />
      )}
    </section>
  );
}
