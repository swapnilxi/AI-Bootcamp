"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, X, Lightbulb, ArrowRight, Loader2 } from "lucide-react";
import { DifficultyPill, MetaPill } from "./primitives";

/**
 * The practice loop: ask, commit, reveal, explain, next.
 *
 * Confidence is captured before the answer is revealed, because asking
 * afterwards only measures hindsight. The explanation is always shown — on a
 * correct answer as much as a wrong one — since a right answer for the wrong
 * reason is the failure this is meant to catch.
 */

interface Question {
  id: string;
  kind: string;
  difficulty: string;
  prompt: string;
  options: string[];
  hint: string | null;
  estimatedMinutes: number;
  skill: { slug: string; name: string } | null;
}

interface Verdict {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  recorded: boolean;
}

type Mode = "mixed" | "weak";

const KIND_LABEL: Record<string, string> = {
  CONCEPT: "Concept",
  SCENARIO: "Scenario",
  CODING: "Coding",
  ARCHITECTURE: "Architecture",
  DEBUGGING: "Debugging",
  DESIGN: "Design",
  INTERVIEW: "Interview",
  CASE_STUDY: "Case study",
};

export function PracticeRunner({
  skills,
}: {
  skills: { slug: string; name: string; _count: { questions: number } }[];
}) {
  const searchParams = useSearchParams();
  const initialSkill = searchParams?.get("skill") ?? "";

  const [mode, setMode] = useState<Mode>("mixed");
  const [skill, setSkill] = useState(initialSkill);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState({ answered: 0, correct: 0 });
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ mode });
      if (skill) params.set("skill", skill);
      const res = await fetch(`/api/practice?${params}`);
      if (!res.ok) throw new Error("Could not load practice questions.");
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setIndex(0);
      setSelected(null);
      setConfidence(null);
      setVerdict(null);
      setShowHint(false);
      setScore({ answered: 0, correct: 0 });
      setStartedAt(Date.now());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [mode, skill]);

  useEffect(() => {
    load();
  }, [load]);

  const current = questions[index];

  async function submit() {
    if (!current || selected === null || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/practice/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          answer: selected,
          confidence,
          timeSpentSec: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
      if (!res.ok) throw new Error("Could not record that answer.");
      const data: Verdict = await res.json();
      setVerdict(data);
      setScore((s) => ({ answered: s.answered + 1, correct: s.correct + (data.isCorrect ? 1 : 0) }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    setIndex((i) => i + 1);
    setSelected(null);
    setConfidence(null);
    setVerdict(null);
    setShowHint(false);
    setStartedAt(Date.now());
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 border-b border-black-line pb-6">
        <div className="flex gap-2">
          {(["mixed", "weak"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`min-h-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === m
                  ? "border-cream bg-cream/15 text-text"
                  : "border-white/10 text-text-muted hover:border-gold/40 hover:text-gold"
              }`}
            >
              {m === "mixed" ? "Quick practice" : "Weak areas"}
            </button>
          ))}
        </div>

        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          aria-label="Filter by skill"
          className="min-h-0 border border-white/10 bg-black/60 px-4 py-2 text-xs text-text focus:border-gold focus:outline-none"
        >
          <option value="">All skills</option>
          {skills.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name} ({s._count.questions})
            </option>
          ))}
        </select>

        {score.answered > 0 && (
          <span className="ml-auto text-xs tabular-nums text-text-muted">
            {score.correct} / {score.answered} correct
          </span>
        )}
      </div>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-text-muted" /> Loading questions…
        </p>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && !error && questions.length === 0 && (
        <div className="editorial-card glow-tl space-y-3 rounded-2xl p-8 text-center">
          <h2 className="font-serif text-xl text-text">Nothing to drill here yet</h2>
          <p className="text-sm text-text-muted">
            {mode === "weak"
              ? "Weak-area mode needs some practice history first. Try quick practice to establish a baseline."
              : "No questions match that filter."}
          </p>
        </div>
      )}

      {!loading && current && (
        <article className="card-premium glow-tl space-y-6 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <MetaPill className="!border-cream/25 !bg-cream/10 !text-cream">
              {KIND_LABEL[current.kind] ?? current.kind}
            </MetaPill>
            <DifficultyPill level={current.difficulty} />
            {current.skill && <MetaPill>{current.skill.name}</MetaPill>}
            <span className="ml-auto text-xs tabular-nums text-text-muted">
              {index + 1} of {questions.length}
            </span>
          </div>

          <h2 className="font-serif text-xl leading-relaxed text-text">{current.prompt}</h2>

          <div className="space-y-2.5">
            {current.options.map((option) => {
              const isChosen = selected === option;
              const isAnswer = verdict?.correctAnswer === option;
              const showWrong = verdict && isChosen && !verdict.isCorrect;

              return (
                <button
                  key={option}
                  onClick={() => !verdict && setSelected(option)}
                  disabled={!!verdict}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm transition-colors ${
                    verdict && isAnswer
                      ? "border-emerald-500/50 bg-emerald-500/10 text-text"
                      : showWrong
                        ? "border-red-500/50 bg-red-500/10 text-text"
                        : isChosen
                          ? "border-cream bg-cream/10 text-text"
                          : "border-white/10 text-text-muted hover:border-gold/40 hover:text-text"
                  } ${verdict ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span className="mt-0.5 shrink-0">
                    {verdict && isAnswer ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : showWrong ? (
                      <X className="h-4 w-4 text-red-400" />
                    ) : (
                      <span
                        className={`block h-4 w-4 rounded-full border ${
                          isChosen ? "border-cream bg-cream" : "border-white/25"
                        }`}
                      />
                    )}
                  </span>
                  <span className="flex-1 leading-relaxed">{option}</span>
                </button>
              );
            })}
          </div>

          {!verdict && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-text-muted">How sure are you?</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setConfidence(n)}
                    aria-label={`Confidence ${n} of 5`}
                    className={`min-h-0 h-8 w-8 rounded-full border text-xs font-semibold transition-colors ${
                      confidence === n
                        ? "border-cream bg-cream text-[#0C0B0A]"
                        : "border-white/15 text-text-muted hover:border-gold/50 hover:text-gold"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={submit}
                  disabled={selected === null || submitting}
                  className="inline-flex min-h-0 items-center gap-2 rounded-full bg-[linear-gradient(180deg,#FFFFFF_0%,#FAF6F0_55%,#F0E6D4_100%)] px-6 py-2.5 text-sm font-semibold text-[#0C0B0A] transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Check answer
                </button>

                {current.hint && !showHint && (
                  <button
                    onClick={() => setShowHint(true)}
                    className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs text-text-muted transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Hint
                  </button>
                )}
              </div>

              {showHint && current.hint && (
                <p className="rounded-2xl border border-cream/20 bg-cream/[0.08] p-4 text-sm text-text-muted">
                  {current.hint}
                </p>
              )}
            </>
          )}

          {verdict && (
            <div className="space-y-5">
              <div
                className={`rounded-2xl border p-5 ${
                  verdict.isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/[0.07]"
                    : "border-red-500/30 bg-red-500/[0.07]"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    verdict.isCorrect ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {verdict.isCorrect ? "Correct" : "Not quite"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{verdict.explanation}</p>
              </div>

              {!verdict.recorded && (
                <p className="text-xs text-text-muted">
                  Sign in to have this count toward your skill graph.
                </p>
              )}

              {index + 1 < questions.length ? (
                <button
                  onClick={next}
                  className="inline-flex min-h-0 items-center gap-2 rounded-full border border-cream/40 px-6 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-gold/10"
                >
                  Next question
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="font-serif text-lg text-text">
                    Set finished — {score.correct} of {score.answered} correct.
                  </p>
                  <button
                    onClick={load}
                    className="inline-flex min-h-0 items-center gap-2 rounded-full border border-cream/40 px-6 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-gold/10"
                  >
                    Another set
                  </button>
                </div>
              )}
            </div>
          )}
        </article>
      )}
    </div>
  );
}
