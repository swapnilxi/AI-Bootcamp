"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles, Upload, Plus, X, Loader2 } from "lucide-react";
import { AiSetupNotice } from "@/components/ai/AiSetupNotice";
import { InlineAiContextEditor } from "@/components/ai/InlineAiContextEditor";
import { AI_NOT_CONFIGURED_CODE } from "@/lib/ai/constants";
import { isAdminRole, isInstructorRole } from "@/lib/roles";
import { InteractivityPicker } from "@/components/lessons/InteractivityPicker";
import { DEFAULT_INTERACTIVITY, type InteractivityOptions } from "@/lib/lessons/shared";
import { PROJECT_MODULES } from "@/app/projects/[slug]/modules";

const MAX_DOCUMENT_CHARS = 20000;
const STAGE_MODULES = PROJECT_MODULES.filter((m) => m.stage);

interface PathOption {
  id: string;
  slug: string;
  title: string;
  courseCount: number;
  projectCount: number;
}
interface CourseOption {
  id: string;
  title: string;
  lessonCount: number;
  canManage: boolean;
}
interface ProjectOption {
  id: string;
  slug: string;
  title: string;
}

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60";
const labelClass = "block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5";

function GenerateLessonForm() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const canManageAll = isAdminRole(session?.user?.role);

  const [mode, setMode] = useState<"course" | "project">(searchParams.get("mode") === "project" ? "project" : "course");
  const [paths, setPaths] = useState<PathOption[]>([]);
  const [pathId, setPathId] = useState("");

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState(searchParams.get("course") ?? "");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectSlug, setProjectSlug] = useState(searchParams.get("project") ?? "");
  const [stage, setStage] = useState(STAGE_MODULES[0]?.stage ?? "REQUIREMENTS");

  const [topic, setTopic] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [showAuthor, setShowAuthor] = useState(true);
  const [interactive, setInteractive] = useState(true);
  const [interactivity, setInteractivity] = useState<InteractivityOptions>(DEFAULT_INTERACTIVITY);
  const [fileName, setFileName] = useState<string | null>(null);
  const [docText, setDocText] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [created, setCreated] = useState<{ title: string; href: string } | null>(null);

  const [showNewClass, setShowNewClass] = useState(false);
  const [newClass, setNewClass] = useState({ title: "", tagline: "", description: "", outcome: "" });
  const [creatingClass, setCreatingClass] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);

  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ title: "", description: "" });
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  const loadPaths = useCallback(async () => {
    const res = await fetch("/api/learning-paths");
    if (res.ok) {
      const data = await res.json();
      setPaths(data.paths || []);
    }
  }, []);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  const loadCourses = useCallback(
    async (forPathId: string) => {
      if (!forPathId) {
        setCourses([]);
        return;
      }
      const params = new URLSearchParams({ pathId: forPathId });
      if (!canManageAll) params.set("filter", "teaching");
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const list: CourseOption[] = (data.classes || [])
          .filter((c: { canManage: boolean }) => c.canManage)
          .map((c: { id: string; title: string; lessonCount: number; canManage: boolean }) => ({
            id: c.id,
            title: c.title,
            lessonCount: c.lessonCount,
            canManage: c.canManage,
          }));
        setCourses(list);
      }
    },
    [canManageAll]
  );

  const loadProjects = useCallback(async (forPathId: string) => {
    const params = new URLSearchParams();
    if (forPathId) params.set("pathId", forPathId);
    const res = await fetch(`/api/projects?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects || []);
    }
  }, []);

  const skipNextReset = useRef(!!searchParams.get("project") || !!searchParams.get("course"));

  useEffect(() => {
    if (skipNextReset.current) {
      skipNextReset.current = false;
    } else {
      setCourseId("");
      setProjectSlug("");
    }
    if (mode === "course") loadCourses(pathId);
    else loadProjects(pathId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId, mode, loadCourses, loadProjects]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read that document");
      setDocText(String(data.text).slice(0, MAX_DOCUMENT_CHARS));
      setFileName(file.name);
    } catch (err) {
      setError((err as Error).message);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function createClass() {
    setCreatingClass(true);
    setClassError(null);
    try {
      const res = await fetch("/api/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClass),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create that class");
      await loadPaths();
      setPathId(data.path.id);
      setShowNewClass(false);
      setNewClass({ title: "", tagline: "", description: "", outcome: "" });
    } catch (err) {
      setClassError((err as Error).message);
    } finally {
      setCreatingClass(false);
    }
  }

  async function createSubject() {
    setCreatingSubject(true);
    setSubjectError(null);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubject.title,
          description: newSubject.description,
          schedule: new Date().toISOString(),
          pathId: pathId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create that subject");
      await loadCourses(pathId);
      setCourseId(data.course.id);
      setShowNewSubject(false);
      setNewSubject({ title: "", description: "" });
    } catch (err) {
      setSubjectError((err as Error).message);
    } finally {
      setCreatingSubject(false);
    }
  }

  async function generate() {
    if (!topic.trim()) return;
    if (mode === "course" && !courseId) {
      setError("Choose a subject to add this lesson to first.");
      return;
    }
    if (mode === "project" && !projectSlug) {
      setError("Choose a project first.");
      return;
    }
    setGenerating(true);
    setError(null);
    setNeedsSetup(false);
    setCreated(null);
    try {
      const endpoint =
        mode === "course"
          ? `/api/courses/${courseId}/lessons/generate`
          : `/api/projects/${projectSlug}/modules/${stage}/lesson/generate`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          documentText: docText || undefined,
          customTitle: customTitle.trim() || undefined,
          showAuthor,
          interactivity: interactive ? interactivity : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === AI_NOT_CONFIGURED_CODE) setNeedsSetup(true);
        throw new Error(data.error || "Couldn't generate a lesson");
      }
      if (mode === "course") {
        setCreated({ title: data.lesson.title, href: `/courses/${courseId}/lessons/${data.lesson.id}` });
        loadCourses(pathId);
      } else {
        const moduleSlug = STAGE_MODULES.find((m) => m.stage === stage)?.slug ?? "";
        setCreated({ title: STAGE_MODULES.find((m) => m.stage === stage)?.title ?? "Lesson", href: `/projects/${projectSlug}/${moduleSlug}` });
      }
      setTopic("");
      setCustomTitle("");
      setDocText(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cream/25 bg-cream/[0.08] text-[11px] font-semibold uppercase tracking-widest text-text">
          <Sparkles className="w-3 h-3" /> AI Lesson Engine
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink">Generate an Interactive Lesson</h1>
        <p className="text-sm text-text-muted leading-relaxed">
          Turn a topic, technical notes, or an uploaded document into a structured, interactive standalone lesson — complete with
          diagrams and quizzes.
        </p>
      </div>

      <div className="inline-flex p-1 rounded-full border border-white/10 bg-black/40">
        {(["course", "project"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`min-h-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              mode === m ? "bg-cream text-[#0C0B0A]" : "text-text-muted hover:text-gold"
            }`}
          >
            {m === "course" ? "Course lesson" : "Project stage"}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${labelClass} mb-0`}>Target class</label>
              {canManageAll && (
                <button
                  type="button"
                  onClick={() => setShowNewClass((v) => !v)}
                  className="min-h-0 inline-flex items-center gap-1 text-[11px] font-semibold text-gold hover:underline"
                >
                  <Plus className="w-3 h-3" /> New class
                </button>
              )}
            </div>
            <select value={pathId} onChange={(e) => setPathId(e.target.value)} className={fieldClass}>
              <option value="">All classes</option>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            {pathId && canManageAll && (
              <div className="mt-1.5">
                <InlineAiContextEditor
                  label="Class"
                  getUrl={`/api/learning-paths/${pathId}`}
                  patchUrl={`/api/learning-paths/${pathId}`}
                  unwrapKey="path"
                />
              </div>
            )}
          </div>

          {mode === "course" ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${labelClass} mb-0`}>Subject</label>
                <button
                  type="button"
                  onClick={() => setShowNewSubject((v) => !v)}
                  className="min-h-0 inline-flex items-center gap-1 text-[11px] font-semibold text-gold hover:underline"
                >
                  <Plus className="w-3 h-3" /> New subject
                </button>
              </div>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={fieldClass}>
                <option value="">Select a subject…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.lessonCount} lesson{c.lessonCount === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
              {courseId && (
                <div className="mt-1.5">
                  <InlineAiContextEditor
                    label="Subject"
                    getUrl={`/api/courses/${courseId}`}
                    patchUrl={`/api/courses/${courseId}`}
                    unwrapKey="course"
                    method="PUT"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className={labelClass}>Project</label>
              <select value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)} className={fieldClass}>
                <option value="">Select a project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
              {projectSlug && isInstructorRole(session?.user?.role) && (
                <div className="mt-1.5">
                  <InlineAiContextEditor
                    label="Project"
                    getUrl={`/api/projects/${projectSlug}`}
                    patchUrl={`/api/projects/${projectSlug}`}
                    unwrapKey="project"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {showNewClass && canManageAll && (
          <div className="p-4 rounded-2xl border border-cream/15 bg-cream/5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text uppercase tracking-wider">New class</p>
              <button onClick={() => setShowNewClass(false)} className="text-text-muted hover:text-gold" aria-label="Close">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              placeholder="Title"
              value={newClass.title}
              onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
              className={fieldClass}
            />
            <input
              placeholder="Tagline (short)"
              value={newClass.tagline}
              onChange={(e) => setNewClass({ ...newClass, tagline: e.target.value })}
              className={fieldClass}
            />
            <textarea
              placeholder="Description"
              rows={2}
              value={newClass.description}
              onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
              className={fieldClass}
            />
            <textarea
              placeholder="What the learner can do at the end"
              rows={2}
              value={newClass.outcome}
              onChange={(e) => setNewClass({ ...newClass, outcome: e.target.value })}
              className={fieldClass}
            />
            {classError && <p className="text-xs text-text-muted">{classError}</p>}
            <button
              onClick={createClass}
              disabled={creatingClass || !newClass.title.trim() || !newClass.tagline.trim() || !newClass.description.trim() || !newClass.outcome.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {creatingClass && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create class
            </button>
          </div>
        )}

        {showNewSubject && mode === "course" && (
          <div className="p-4 rounded-2xl border border-cream/15 bg-cream/5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text uppercase tracking-wider">New subject</p>
              <button onClick={() => setShowNewSubject(false)} className="text-text-muted hover:text-gold" aria-label="Close">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              placeholder="Title"
              value={newSubject.title}
              onChange={(e) => setNewSubject({ ...newSubject, title: e.target.value })}
              className={fieldClass}
            />
            <textarea
              placeholder="Description"
              rows={2}
              value={newSubject.description}
              onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
              className={fieldClass}
            />
            {subjectError && <p className="text-xs text-text-muted">{subjectError}</p>}
            <button
              onClick={createSubject}
              disabled={creatingSubject || newSubject.title.trim().length < 3 || newSubject.description.trim().length < 10}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {creatingSubject && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create subject
            </button>
          </div>
        )}

        {mode === "project" && (
          <div>
            <label className={labelClass}>Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value as typeof stage)} className={fieldClass}>
              {STAGE_MODULES.map((m) => (
                <option key={m.stage} value={m.stage}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Topic or learning material</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={6}
            placeholder={`e.g. CAP Theorem, Consistent Hashing, Vision Transformers, Raft Consensus, or paste full documentation/notes…`}
            className={`${fieldClass} leading-relaxed`}
          />
        </div>

        {fileName && (
          <p className="text-xs text-text-muted">
            Attached: {fileName} ({docText?.length.toLocaleString()} chars)
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                setDocText(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="ml-2 min-h-0 text-text-muted hover:text-gold underline"
            >
              Remove
            </button>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-text-muted hover:text-gold transition-colors">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload document (PDF / Text / MD / Word)
            <input ref={fileInputRef} type="file" accept=".txt,.md,.markdown,.mdx,.pdf,.docx" onChange={handleFileUpload} className="hidden" />
          </label>
          <span className="hidden sm:inline text-[11px] text-text-muted">Supports PDF, Markdown, Text, or Word</span>
        </div>

        <div>
          <label className={labelClass}>Custom title (optional)</label>
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Leave blank to let AI synthesize a polished title"
            className={fieldClass}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 p-4">
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-xs font-semibold text-text">
            <input
              type="checkbox"
              checked={interactive}
              onChange={(e) => setInteractive(e.target.checked)}
              className="w-3.5 h-3.5 min-h-0 accent-[#F97316]"
            />
            Make it an interactive experience (exercises, simulations, scenarios)
          </label>
          {interactive && <InteractivityPicker value={interactivity} onChange={setInteractivity} compact />}
        </div>

        <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showAuthor}
            onChange={(e) => setShowAuthor(e.target.checked)}
            className="w-3.5 h-3.5 min-h-0 accent-[#F97316]"
          />
          Show my name as this lesson&apos;s author
        </label>

        {needsSetup ? (
          <AiSetupNotice />
        ) : error ? (
          <p className="text-xs text-text-muted">{error}</p>
        ) : created ? (
          <p className="text-xs text-text-muted">
            &ldquo;{created.title}&rdquo; created.{" "}
            <Link href={created.href} className="text-gold hover:underline">
              View it →
            </Link>
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            onClick={generate}
            disabled={generating || !topic.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating…" : "Generate Lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GenerateLessonPage() {
  return (
    <Suspense fallback={null}>
      <GenerateLessonForm />
    </Suspense>
  );
}
