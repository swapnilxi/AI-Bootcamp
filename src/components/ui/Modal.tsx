"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";

/**
 * One accessible modal shell for every overlay in the app — booking, AI
 * chat, password unlock, and anything that follows. Centralises what used
 * to be re-implemented per modal: a backdrop + Escape handler with no
 * `role="dialog"`, no focus trap, and no focus restore.
 *
 * Handles: portal to <body>, role="dialog"/aria-modal, Escape to close,
 * backdrop click to close, focus trap (Tab cycles inside), focus restore to
 * the trigger on close, page-scroll lock (pausing Lenis, matching
 * EditorialHeader's mobile menu), and `inert` on the rest of the page for
 * assistive tech.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** id of the element that labels the dialog (usually its heading). */
  labelledBy?: string;
  className?: string;
  closeOnBackdrop?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  labelledBy,
  className = "",
  closeOnBackdrop = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const { pause, resume } = useSmoothScroll();

  useEffect(() => setMounted(true), []);

  // Scroll lock + Escape, mirroring EditorialHeader's mobile-menu handling.
  useEffect(() => {
    if (!isOpen) return;
    pause();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      resume();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, pause, resume]);

  // Focus: move in on open, trap Tab inside the panel, restore on close.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const focusFirst = () => {
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? panel)?.focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  // Hide the rest of the page from assistive tech while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const root = rootRef.current;
    const siblings = Array.from(document.body.children).filter((el) => el !== root);
    siblings.forEach((el) => el.setAttribute("inert", ""));
    return () => siblings.forEach((el) => el.removeAttribute("inert"));
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={rootRef}
      data-lenis-prevent
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative outline-none ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
