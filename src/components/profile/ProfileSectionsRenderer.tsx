"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronUp, Play, Award, Quote } from "lucide-react";
import { ProfileSection, SectionItem } from "@/types/profileSections";

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const vid = u.searchParams.get("v");
      return vid ? `https://www.youtube.com/embed/${vid}` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video${u.pathname}`;
    }
  } catch {
    // invalid url
  }
  return null;
}

function BulletsDisplay({ items }: { items: SectionItem[] }) {
  const bullets = items.filter((i) => i.kind === "bullet");
  if (!bullets.length) return null;
  return (
    <ul className="space-y-2.5 mt-3">
      {bullets.map((b) =>
        b.kind === "bullet" ? (
          <li key={b.id} className="flex items-start gap-3 text-ink/85 text-sm leading-relaxed">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
            {b.text}
          </li>
        ) : null
      )}
    </ul>
  );
}

function TestimonialsDisplay({ items }: { items: SectionItem[] }) {
  const tests = items.filter((i) => i.kind === "testimonial");
  if (!tests.length) return null;
  return (
    <div className="grid gap-4 mt-4 sm:grid-cols-2">
      {tests.map((t) =>
        t.kind === "testimonial" ? (
          <div key={t.id} className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
            <Quote className="w-5 h-5 text-gold/40 shrink-0" />
            <p className="text-ink/85 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
            <div className="flex items-center gap-2.5 mt-auto pt-2 border-t border-white/5">
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 text-gold flex items-center justify-center text-xs font-bold shrink-0">
                {t.avatarInitial || t.author.charAt(0)}
              </div>
              <div>
                <div className="text-ink text-xs font-semibold">{t.author}</div>
                {t.role && <div className="text-text-muted text-[11px]">{t.role}</div>}
              </div>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

function FaqDisplay({ items }: { items: SectionItem[] }) {
  const faqs = items.filter((i) => i.kind === "faq");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!faqs.length) return null;
  return (
    <div className="space-y-2 mt-4">
      {faqs.map((f, idx) =>
        f.kind === "faq" ? (
          <div key={f.id} className="rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-sm text-ink font-medium hover:bg-white/[0.04] transition-colors"
            >
              <span>{f.question}</span>
              {openIdx === idx ? (
                <ChevronUp className="w-4 h-4 text-gold shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
              )}
            </button>
            {openIdx === idx && (
              <div className="px-4 pb-4 text-sm text-ink/80 leading-relaxed border-t border-white/5 pt-3">
                {f.answer}
              </div>
            )}
          </div>
        ) : null
      )}
    </div>
  );
}

function CredentialsDisplay({ items }: { items: SectionItem[] }) {
  const creds = items.filter((i) => i.kind === "credential");
  if (!creds.length) return null;
  return (
    <div className="space-y-2.5 mt-4">
      {creds.map((c) =>
        c.kind === "credential" ? (
          <div key={c.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/8">
            <Award className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <div>
              <div className="text-ink text-sm font-medium">{c.title}</div>
              {(c.institution || c.year) && (
                <div className="text-text-muted text-xs mt-0.5">
                  {c.institution}{c.institution && c.year ? " · " : ""}{c.year}
                </div>
              )}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

function VideoDisplay({ items }: { items: SectionItem[] }) {
  const vid = items.find((i) => i.kind === "video");
  if (!vid || vid.kind !== "video" || !vid.url) return null;
  const embedUrl = getYouTubeEmbedUrl(vid.url);
  if (!embedUrl) return (
    <a href={vid.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-gold underline mt-2">
      <Play className="w-4 h-4" /> Watch Video
    </a>
  );
  return (
    <div className="mt-4 rounded-2xl overflow-hidden aspect-video">
      <iframe
        src={embedUrl}
        title={vid.caption || "Video"}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function SectionContent({ section }: { section: ProfileSection }) {
  switch (section.type) {
    case "testimonials":
      return <TestimonialsDisplay items={section.items} />;
    case "faq":
      return (
        <>
          {section.content && <p className="text-ink/80 text-sm leading-relaxed">{section.content}</p>}
          <FaqDisplay items={section.items} />
        </>
      );
    case "credentials":
      return (
        <>
          {section.content && <p className="text-ink/80 text-sm leading-relaxed">{section.content}</p>}
          <CredentialsDisplay items={section.items} />
        </>
      );
    case "video_intro":
      return (
        <>
          {section.content && <p className="text-ink/80 text-sm leading-relaxed">{section.content}</p>}
          <VideoDisplay items={section.items} />
        </>
      );
    case "offerings":
    case "research":
      return (
        <>
          {section.content && (
            <div className="prose prose-invert prose-sm max-w-none text-ink/85 [&_strong]:text-gold [&_em]:text-gold/80">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          )}
          <BulletsDisplay items={section.items} />
        </>
      );
    default:
      return (
        <>
          {section.content && (
            <div className="prose prose-invert prose-sm max-w-none text-ink/85 [&_strong]:text-gold [&_em]:text-gold/80 [&_p]:leading-relaxed">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          )}
          <BulletsDisplay items={section.items} />
        </>
      );
  }
}

interface ProfileSectionsRendererProps {
  sections: ProfileSection[];
}

export function ProfileSectionsRenderer({ sections }: ProfileSectionsRendererProps) {
  const visible = sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  if (!visible.length) return null;

  return (
    <div className="space-y-8 mt-2">
      {visible.map((section) => (
        <div key={section.id} className="animate-fade-in">
          {/* Section heading */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl leading-none">{section.icon}</span>
            <h2 className="font-serif text-xl sm:text-2xl text-ink">{section.title}</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gold/20 to-transparent" />
          </div>

          {/* Section body */}
          <SectionContent section={section} />
        </div>
      ))}
    </div>
  );
}
