"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import type { Stage, Task } from "@/app/projects/[slug]/modules";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-ink focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";
const labelClass = "block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5";

interface Props {
  slug: string;
  stage: Stage;
  isInstructor: boolean;
  requirements?: string[];
  architecture?: string;
  techStack?: string[];
  starterRepoUrl?: string | null;
  datasetUrl?: string | null;
  /** Every stage's tasks — this component edits only the slice belonging to `stage`. */
  tasks: Task[];
  /** The stage's existing read-only content block (requirements list, architecture prose, etc). */
  children?: ReactNode;
}

function TasksList({ tasks }: { tasks: Task[] }) {
  return (
    <section className="space-y-5">
      <h2 className="font-serif text-2xl text-text">Tasks</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-text-muted">No tasks are staged for this module yet.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task, i) => (
            <li key={`${i}-${task.title}`} className="editorial-card glow-tl rounded-2xl p-5">
              <p className="text-sm font-semibold text-text">{task.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{task.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Wraps a stage's read-only content with an instructor-only Preview/Edit toggle.
 * Students (and every other viewer) see exactly `children` plus the task list — no
 * toggle, no edit path. Instructors additionally get a content-creation form that
 * saves straight to the project row.
 */
export function StageEditor({
  slug,
  stage,
  isInstructor,
  requirements,
  architecture,
  techStack,
  starterRepoUrl,
  datasetUrl,
  tasks,
  children,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [requirementsText, setRequirementsText] = useState((requirements ?? []).join("\n"));
  const [architectureText, setArchitectureText] = useState(architecture ?? "");
  const [techStackText, setTechStackText] = useState((techStack ?? []).join("\n"));
  const [starterRepoUrlText, setStarterRepoUrlText] = useState(starterRepoUrl ?? "");
  const [datasetUrlText, setDatasetUrlText] = useState(datasetUrl ?? "");

  const otherTasks = tasks.filter((t) => t.stage !== stage);
  const [stageTasks, setStageTasks] = useState<Task[]>(tasks.filter((t) => t.stage === stage));

  const updateTask = (i: number, field: "title" | "detail", value: string) =>
    setStageTasks((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  const addTask = () => setStageTasks((prev) => [...prev, { title: "", detail: "", stage }]);
  const removeTask = (i: number) => setStageTasks((prev) => prev.filter((_, idx) => idx !== i));

  async function save() {
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {
      tasks: [...otherTasks, ...stageTasks.filter((t) => t.title.trim() && t.detail.trim())],
    };
    if (stage === "REQUIREMENTS") {
      body.requirements = requirementsText.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    if (stage === "ARCHITECTURE") {
      body.architecture = architectureText.trim();
    }
    if (stage === "IMPLEMENTATION") {
      body.techStack = techStackText.split("\n").map((s) => s.trim()).filter(Boolean);
      body.starterRepoUrl = starterRepoUrlText.trim();
    }
    if (stage === "DEPLOYMENT") {
      body.datasetUrl = datasetUrlText.trim();
    }

    try {
      const res = await fetch(`/api/projects/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save those changes");
      setMode("preview");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!isInstructor) {
    return (
      <>
        {children}
        <TasksList tasks={stageTasks} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-white/10 p-1">
          {(
            [
              ["preview", "Preview as student", Eye],
              ["edit", "Edit content", Pencil],
            ] as const
          ).map(([key, label, TabIcon]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`inline-flex min-h-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                mode === key ? "bg-gold text-[#0C0B0A]" : "text-text-muted hover:text-gold"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        {mode === "edit" && (
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex min-h-0 items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-xs font-semibold text-[#0C0B0A] transition-colors hover:bg-cream/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {mode === "preview" ? (
        <>
          {children}
          <TasksList tasks={stageTasks} />
        </>
      ) : (
        <div className="space-y-6">
          {stage === "REQUIREMENTS" && (
            <div>
              <label className={labelClass}>Requirements (one per line)</label>
              <textarea
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                rows={6}
                className={`${fieldClass} resize-none`}
              />
            </div>
          )}

          {stage === "ARCHITECTURE" && (
            <div>
              <label className={labelClass}>Architecture</label>
              <textarea
                value={architectureText}
                onChange={(e) => setArchitectureText(e.target.value)}
                rows={10}
                className={`${fieldClass} resize-none`}
              />
            </div>
          )}

          {stage === "IMPLEMENTATION" && (
            <>
              <div>
                <label className={labelClass}>Tech stack (one per line)</label>
                <textarea
                  value={techStackText}
                  onChange={(e) => setTechStackText(e.target.value)}
                  rows={5}
                  className={`${fieldClass} resize-none`}
                />
              </div>
              <div>
                <label className={labelClass}>Starter repository URL</label>
                <input
                  value={starterRepoUrlText}
                  onChange={(e) => setStarterRepoUrlText(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </>
          )}

          {stage === "DEPLOYMENT" && (
            <div>
              <label className={labelClass}>Dataset URL</label>
              <input
                value={datasetUrlText}
                onChange={(e) => setDatasetUrlText(e.target.value)}
                className={fieldClass}
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={labelClass}>Tasks for this stage</h3>
              <button
                onClick={addTask}
                className="inline-flex min-h-0 items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-gold"
              >
                <Plus className="h-3.5 w-3.5" /> Add task
              </button>
            </div>
            {stageTasks.map((task, i) => (
              <div key={i} className="editorial-card flex gap-3 rounded-2xl p-4">
                <div className="flex-1 space-y-2">
                  <input
                    value={task.title}
                    onChange={(e) => updateTask(i, "title", e.target.value)}
                    placeholder="Task title"
                    className={fieldClass}
                  />
                  <textarea
                    value={task.detail}
                    onChange={(e) => updateTask(i, "detail", e.target.value)}
                    placeholder="Detail"
                    rows={2}
                    className={`${fieldClass} resize-none`}
                  />
                </div>
                <button
                  onClick={() => removeTask(i)}
                  className="h-fit rounded-lg p-2 text-text-muted transition-colors hover:text-red-400"
                  aria-label="Remove task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
