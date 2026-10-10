"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/** Permanently removes a custom project module (distinct from LessonViewer's "clear preview" — the module itself goes away). */
export function DeleteModuleButton({ projectSlug, moduleSlug }: { projectSlug: string; moduleSlug: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this module? This can't be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/projects/${projectSlug}/custom-modules/${moduleSlug}`, { method: "DELETE" });
      router.push(`/projects/${projectSlug}`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={deleting}
      className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-red-400 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" /> Delete module
    </button>
  );
}
