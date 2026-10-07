import React from "react";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon } from "@/components/ui/Icon";

export const metadata = {
  title: "How We Teach | AI Bootcamp",
  description:
    "Mechanism before recipe, measurement before claims, and a project at the end of every stage. How AI Bootcamp teaches AI engineering.",
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16">
      {/* 1. Header & Lead */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted px-3.5 py-1.5 rounded-full bg-black-raised border border-black-line inline-block">
          How We Teach
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text font-normal leading-tight">
          Not another course platform
        </h1>
        <p className="text-base sm:text-lg text-text-muted leading-relaxed font-sans">
          Most AI material teaches an API surface and stops. We teach the mechanism underneath it, because
          that is the part that still works when the API changes.
        </p>
      </div>

      {/* 2. The approach */}
      <div className="editorial-card glow-tl p-8 sm:p-14 space-y-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 sm:gap-12">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-black text-cream font-serif text-4xl font-normal flex items-center justify-center shrink-0 border border-cream/30">
            AI
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h2 className="font-serif text-3xl text-text font-normal">
              Written by engineers who run this in production
            </h2>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed">
              The curriculum comes from people who operate retrieval systems, agent platforms and evaluation
              harnesses under real load. What is taught here is what survived contact with that load — not a
              summary of last month&apos;s papers.
            </p>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed">
              That shows up in the unglamorous parts. Chunking is taught as a retrieval decision, not
              preprocessing. Agents come with a section on when not to use one. Evaluation arrives before the
              architecture, because a system you cannot measure is a system you cannot improve.
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-black-line">
          <div className="p-5 rounded-2xl bg-black border border-black-line space-y-2">
            <Icon name="role-admin" variant="line" size={24} className="text-text-muted" />
            <h3 className="font-serif text-lg text-text font-normal">Mechanism first</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Why attention scales, why dense retrieval misses a product code, why an agent picks the wrong
              tool. A rule you can apply is worth less than a mechanism you can reason from.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black border border-black-line space-y-2">
            <Icon name="check" variant="line" size={24} className="text-text-muted" />
            <h3 className="font-serif text-lg text-text font-normal">Measured, not asserted</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Every project carries an evaluation. If a change cannot be shown to have helped on a fixed test
              set, it is a preference rather than an improvement, and we say so.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black border border-black-line space-y-2">
            <Icon name="clock" variant="line" size={24} className="text-text-muted" />
            <h3 className="font-serif text-lg text-text font-normal">Something that runs</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Each stage ends in working code — a pipeline, an agent, a deployed service — rather than a
              completed progress bar.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Principles */}
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Principles"
          title="What this platform will and will not do"
          subtitle="The opinions behind the curriculum, stated plainly."
          align="left"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-black-raised border border-black-line space-y-2">
            <h3 className="font-serif text-xl text-text font-normal">1. The tutor will not do it for you</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Inside coding work the AI gives progressive hints, explains errors and reviews what you wrote. It
              withholds the finished solution, because writing it yourself is the entire point of the exercise.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black-raised border border-black-line space-y-2">
            <h3 className="font-serif text-xl text-text font-normal">2. Difficulty is honest</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              When you ask for something harder, you get a new failure mode rather than more words. Weak-area
              practice aims at the gaps you have been avoiding, not the material you already enjoy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black-raised border border-black-line space-y-2">
            <h3 className="font-serif text-xl text-text font-normal">3. Trade-offs get named</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Where a technique is contested or version-dependent, that is said out loud along with the
              trade-off, instead of being flattened into a confident rule that fails quietly later.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black-raised border border-black-line space-y-2">
            <h3 className="font-serif text-xl text-text font-normal">4. You leave with a portfolio</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              The capstone is a deployed application with retrieval, agents, evaluation, auth and
              observability. Work you can walk a hiring panel through — not a certificate.
            </p>
          </div>
        </div>
      </div>

      {/* 4. CTA */}
      <div className="editorial-card glow-br px-6 py-10 sm:p-12 text-center space-y-6 bg-black-raised border border-cream/40">
        <h2 className="font-serif text-3xl sm:text-4xl text-text font-normal">Start with the path, not a course</h2>
        <p className="text-text-muted text-base max-w-xl mx-auto leading-relaxed">
          Pick a career track and the platform sequences the courses, labs, practice and projects against it.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-2">
          <Button href="/paths" variant="primary" size="lg" className="!whitespace-normal">
            <span>Choose a path</span>
            <Icon name="arrow" variant="line" size={16} className="ml-1.5" />
          </Button>
          <Button href="/bootcamp" variant="secondary" size="lg" className="!whitespace-normal">
            <span>See the 12-week bootcamp</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
