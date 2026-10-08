"use client";

import React, { useId, useState } from "react";
import { Lock, KeyRound, AlertCircle, CheckCircle, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface PasswordUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  classTitle: string;
  onUnlocked: (content: string) => void;
}

export function PasswordUnlockModal({
  isOpen,
  onClose,
  courseId,
  classTitle,
  onUnlocked,
}: PasswordUnlockModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const titleId = useId();

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the class access key");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Incorrect class password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onUnlocked(data.content);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to verify access key. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={titleId} className="w-full max-w-md">
      <div className="editorial-card glow-tl relative w-full p-7 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-ink/50 hover:text-ink hover:bg-mist/50 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-cream/8 border border-cream/20 flex items-center justify-center text-text-muted">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 id={titleId} className="font-serif text-xl font-bold text-ink">Private Course</h3>
            <p className="text-xs text-ink/60 truncate max-w-[260px]">{classTitle}</p>
          </div>
        </div>

        <p className="text-sm text-ink/70 mb-6 leading-relaxed">
          This exclusive study session is protected by an invitation access key. Please enter the password provided to access curriculum notes and live links.
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-cream/8 border border-cream/20 text-text text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Access verified! Unlocking curriculum...</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink/80 uppercase tracking-wider mb-2">
              Class Access Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-mist focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-ivory/50"
                disabled={loading || success}
                autoFocus
              />
              <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-ink/40" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-ink/60 hover:text-ink hover:bg-mist/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Unlock Class"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
