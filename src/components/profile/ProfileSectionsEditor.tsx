"use client";

import React, { useState, useCallback } from "react";
import {
  Plus, Trash2, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp,
  Save, Check, X, Edit3, LayoutGrid, PlusCircle, ChevronRight,
} from "lucide-react";
import {
  ProfileSection, SectionItem, SectionType,
  PREDEFINED_SECTION_TEMPLATES, SectionTemplate,
} from "@/types/profileSections";

// ─── helpers ────────────────────────────────────────────────────────────────
const uid = () => `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function defaultSection(tmpl: SectionTemplate): ProfileSection {
  return {
    id: uid(),
    type: tmpl.type,
    title: tmpl.title,
    icon: tmpl.icon,
    content: tmpl.defaultContent,
    items: tmpl.defaultItems.map((it) => ({ ...it, id: uid() } as SectionItem)),
    visible: true,
    order: 0,
  };
}

// ─── Sub-editors ─────────────────────────────────────────────────────────────
function BulletEditor({
  items, onChange,
}: {
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
}) {
  const bullets = items.filter((i) => i.kind === "bullet");
  const addBullet = () =>
    onChange([...items, { id: uid(), kind: "bullet", text: "" }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, text: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));

  return (
    <div className="space-y-2 mt-3">
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Bullet Points</p>
      {bullets.map((b) =>
        b.kind === "bullet" ? (
          <div key={b.id} className="flex items-center gap-2">
            <span className="text-text-muted text-sm">•</span>
            <input
              value={b.text}
              onChange={(e) => update(b.id, e.target.value)}
              placeholder="Enter a bullet point…"
              className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
            />
            <button onClick={() => remove(b.id)} className="text-text-muted hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null
      )}
      <button
        onClick={addBullet}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors mt-1"
      >
        <PlusCircle className="w-3.5 h-3.5" /> Add bullet
      </button>
    </div>
  );
}

function TestimonialEditor({
  items, onChange,
}: {
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
}) {
  const tests = items.filter((i) => i.kind === "testimonial");
  const add = () =>
    onChange([...items, { id: uid(), kind: "testimonial", quote: "", author: "", role: "", avatarInitial: "" }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, field: string, val: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, [field]: val } : i)));

  return (
    <div className="space-y-3 mt-3">
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Testimonials</p>
      {tests.map((t) =>
        t.kind === "testimonial" ? (
          <div key={t.id} className="p-3 rounded-xl border border-white/10 bg-black/30 space-y-2">
            <textarea
              rows={3}
              value={t.quote}
              onChange={(e) => update(t.id, "quote", e.target.value)}
              placeholder="Client testimonial quote…"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                value={t.author}
                onChange={(e) => update(t.id, "author", e.target.value)}
                placeholder="Client Name"
                className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
              />
              <input
                value={t.role || ""}
                onChange={(e) => update(t.id, "role", e.target.value)}
                placeholder="Role / Title"
                className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
              />
              <input
                value={t.avatarInitial || ""}
                onChange={(e) => update(t.id, "avatarInitial", e.target.value.slice(0, 2))}
                placeholder="A"
                maxLength={2}
                className="w-14 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm text-center focus:border-gold focus:outline-none"
                title="Avatar initial (1-2 chars)"
              />
              <button onClick={() => remove(t.id)} className="text-text-muted hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null
      )}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors">
        <PlusCircle className="w-3.5 h-3.5" /> Add testimonial
      </button>
    </div>
  );
}

function FaqEditor({
  items, onChange,
}: {
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
}) {
  const faqs = items.filter((i) => i.kind === "faq");
  const add = () =>
    onChange([...items, { id: uid(), kind: "faq", question: "", answer: "" }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, field: string, val: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, [field]: val } : i)));

  return (
    <div className="space-y-3 mt-3">
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">FAQ Items</p>
      {faqs.map((f) =>
        f.kind === "faq" ? (
          <div key={f.id} className="p-3 rounded-xl border border-white/10 bg-black/30 space-y-2">
            <div className="flex gap-2 items-start">
              <input
                value={f.question}
                onChange={(e) => update(f.id, "question", e.target.value)}
                placeholder="Question…"
                className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
              />
              <button onClick={() => remove(f.id)} className="text-text-muted hover:text-red-400 mt-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={2}
              value={f.answer}
              onChange={(e) => update(f.id, "answer", e.target.value)}
              placeholder="Answer…"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
            />
          </div>
        ) : null
      )}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors">
        <PlusCircle className="w-3.5 h-3.5" /> Add FAQ
      </button>
    </div>
  );
}

function CredentialEditor({
  items, onChange,
}: {
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
}) {
  const creds = items.filter((i) => i.kind === "credential");
  const add = () =>
    onChange([...items, { id: uid(), kind: "credential", title: "", institution: "", year: "" }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, field: string, val: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, [field]: val } : i)));

  return (
    <div className="space-y-2 mt-3">
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Credentials</p>
      {creds.map((c) =>
        c.kind === "credential" ? (
          <div key={c.id} className="flex gap-2 items-center">
            <input
              value={c.title}
              onChange={(e) => update(c.id, "title", e.target.value)}
              placeholder="Certification title…"
              className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
            />
            <input
              value={c.institution || ""}
              onChange={(e) => update(c.id, "institution", e.target.value)}
              placeholder="Institution"
              className="w-28 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
            />
            <input
              value={c.year || ""}
              onChange={(e) => update(c.id, "year", e.target.value)}
              placeholder="Year"
              className="w-16 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
            />
            <button onClick={() => remove(c.id)} className="text-text-muted hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null
      )}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors">
        <PlusCircle className="w-3.5 h-3.5" /> Add credential
      </button>
    </div>
  );
}

function VideoEditor({ items, onChange }: { items: SectionItem[]; onChange: (items: SectionItem[]) => void }) {
  const vid = items.find((i) => i.kind === "video");
  const update = (field: string, val: string) =>
    onChange(items.map((i) => (i.kind === "video" ? { ...i, [field]: val } : i)));
  const addIfMissing = () => {
    if (!vid) onChange([...items, { id: uid(), kind: "video", url: "", caption: "" }]);
  };

  return (
    <div className="space-y-2 mt-3">
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Video</p>
      {vid && vid.kind === "video" ? (
        <>
          <input
            value={vid.url}
            onChange={(e) => update("url", e.target.value)}
            placeholder="YouTube or Vimeo URL"
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
          />
          <input
            value={vid.caption || ""}
            onChange={(e) => update("caption", e.target.value)}
            placeholder="Caption (optional)"
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
          />
        </>
      ) : (
        <button onClick={addIfMissing} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors">
          <PlusCircle className="w-3.5 h-3.5" /> Add video
        </button>
      )}
    </div>
  );
}

// ─── Single Section Card ─────────────────────────────────────────────────────
function SectionCard({
  section,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  section: ProfileSection;
  index: number;
  total: number;
  onUpdate: (s: ProfileSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [open, setOpen] = useState(true);

  const set = (patch: Partial<ProfileSection>) => onUpdate({ ...section, ...patch });

  const renderItemEditor = () => {
    const sectionTypes = {
      "bullet": ["offerings", "research", "custom"],
      "testimonial": ["testimonials"],
      "faq": ["faq"],
      "credential": ["credentials"],
      "video": ["video_intro"],
    };

    const bullets = ["offerings", "research", "custom", "philosophy", "journey", "mantra"];
    const hasBullets = ["offerings", "research"].includes(section.type) || 
      section.items.some(i => i.kind === "bullet");

    if (section.type === "testimonials") {
      return <TestimonialEditor items={section.items} onChange={(items) => set({ items })} />;
    }
    if (section.type === "faq") {
      return <FaqEditor items={section.items} onChange={(items) => set({ items })} />;
    }
    if (section.type === "credentials") {
      return <CredentialEditor items={section.items} onChange={(items) => set({ items })} />;
    }
    if (section.type === "video_intro") {
      return <VideoEditor items={section.items} onChange={(items) => set({ items })} />;
    }
    // For offerings, research, custom → bullet editor
    if (section.type === "offerings" || section.type === "research" || hasBullets) {
      return <BulletEditor items={section.items} onChange={(items) => set({ items })} />;
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0e0e12] shadow-lg overflow-hidden transition-all">
      {/* Card Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border-b border-white/5">
        <GripVertical className="w-4 h-4 text-white/20 shrink-0 cursor-grab" />

        <span className="text-xl leading-none">{section.icon}</span>

        <input
          value={section.title}
          onChange={(e) => set({ title: e.target.value })}
          className="flex-1 bg-transparent text-ink font-semibold text-sm focus:outline-none min-w-0 placeholder:text-text-muted"
          placeholder="Section title…"
        />

        <div className="flex items-center gap-1 shrink-0">
          {/* Emoji / icon picker */}
          <input
            value={section.icon}
            onChange={(e) => set({ icon: e.target.value })}
            className="w-9 px-1.5 py-1 rounded-full bg-black/40 border border-white/10 text-sm text-center focus:border-gold focus:outline-none"
            title="Section emoji icon"
            maxLength={2}
          />

          {/* Move up */}
          <button
            disabled={index === 0}
            onClick={onMoveUp}
            className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-white/5 transition-colors disabled:opacity-25"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* Move down */}
          <button
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-white/5 transition-colors disabled:opacity-25"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Visibility toggle */}
          <button
            onClick={() => set({ visible: !section.visible })}
            title={section.visible ? "Hide from public profile" : "Show on public profile"}
            className={`p-1.5 rounded-lg transition-colors ${
              section.visible
                ? "text-emerald-400 hover:bg-emerald-500/10"
                : "text-text-muted hover:bg-white/5"
            }`}
          >
            {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Collapse/expand */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-white/5 transition-colors"
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Remove */}
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      {open && (
        <div className="p-4 space-y-3">
          {/* Not-visible notice */}
          {!section.visible && (
            <div className="text-[11px] text-yellow-200/90 bg-yellow-500/10 border border-yellow-500/25 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <EyeOff className="w-3 h-3 shrink-0" /> This section is hidden from your public profile.
            </div>
          )}

          {/* Main content textarea (shown for prose-type sections) */}
          {section.type !== "testimonials" && section.type !== "faq" && section.type !== "credentials" && (
            <div>
              <label className="text-[11px] uppercase tracking-widest text-text-muted font-semibold mb-1.5 block">
                Content
              </label>
              <textarea
                rows={4}
                value={section.content}
                onChange={(e) => set({ content: e.target.value })}
                placeholder="Write your content here…"
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-ink text-sm leading-relaxed focus:border-gold focus:outline-none resize-y"
              />
            </div>
          )}

          {/* Type-specific item editor */}
          {renderItemEditor()}
        </div>
      )}
    </div>
  );
}

// ─── Template Picker Modal ───────────────────────────────────────────────────
function TemplatePicker({ onAdd, onClose }: { onAdd: (t: SectionTemplate) => void; onClose: () => void }) {
  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-[#121217] border border-cream/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl text-ink">Add a Profile Section</h2>
            <p className="text-xs text-text-muted mt-0.5">Choose a template or start from scratch</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PREDEFINED_SECTION_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.type}
              onClick={() => { onAdd(tmpl); onClose(); }}
              className="text-left p-4 rounded-2xl bg-white/[0.03] hover:bg-gold/10 border border-white/10 hover:border-gold/40 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">{tmpl.icon}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-ink text-sm group-hover:text-gold transition-colors">{tmpl.title}</div>
                  <div className="text-xs text-text-muted mt-0.5 leading-relaxed">{tmpl.description}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-gold shrink-0 mt-0.5 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
interface ProfileSectionsEditorProps {
  instructorId: string;
  initialSections: ProfileSection[];
  onSaved?: (sections: ProfileSection[]) => void;
}

export function ProfileSectionsEditor({
  instructorId,
  initialSections,
  onSaved,
}: ProfileSectionsEditorProps) {
  const [sections, setSections] = useState<ProfileSection[]>(
    initialSections.map((s, i) => ({ ...s, order: i }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const addSection = useCallback((tmpl: SectionTemplate) => {
    const s = defaultSection(tmpl);
    setSections((prev) => [...prev, { ...s, order: prev.length }]);
  }, []);

  const updateSection = useCallback((id: string, s: ProfileSection) => {
    setSections((prev) => prev.map((x) => (x.id === id ? s : x)));
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const moveUp = useCallback((index: number) => {
    setSections((prev) => {
      if (index === 0) return prev;
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setSections((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/instructors/${instructorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSections: JSON.stringify(sections) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSaved(true);
      onSaved?.(sections);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl text-ink flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-text" />
            Profile Sections
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Customise what appears on your public mentor &amp; instructor profile
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cream/40 text-text hover:bg-gold/10 text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4" /> Add Section
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Saved!</>
            ) : saving ? (
              <><span className="animate-spin">⏳</span> Saving…</>
            ) : (
              <><Save className="w-4 h-4" /> Save Sections</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Empty state */}
      {sections.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-ink font-semibold">No sections yet</p>
          <p className="text-text-muted text-sm mt-1 mb-5">
            Add predefined templates or create custom sections to enrich your profile.
          </p>
          <button
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black text-xs font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Your First Section
          </button>
        </div>
      )}

      {/* Section list */}
      <div className="space-y-3">
        {sections.map((s, i) => (
          <SectionCard
            key={s.id}
            section={s}
            index={i}
            total={sections.length}
            onUpdate={(updated) => updateSection(s.id, updated)}
            onRemove={() => removeSection(s.id)}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
          />
        ))}
      </div>

      {/* Template Picker Modal */}
      {showPicker && (
        <TemplatePicker onAdd={addSection} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
