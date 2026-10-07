"use client";

import React, { useEffect, useState } from "react";

interface Instructor {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface InstructorSelectProps {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Admin-only picker of users who can teach (Instructor role or higher). */
export function InstructorSelect({ value, onChange, className = "" }: InstructorSelectProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/instructors")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setInstructors(data.instructors || []);
      })
      .catch(() => setError("Could not load instructors"));
  }, []);

  if (error) return <p className="text-xs text-text">{error}</p>;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60 ${className}`}
    >
      <option value="">Me (teach this class myself)</option>
      {instructors.map((i) => (
        <option key={i.id} value={i.id}>
          {i.name || i.email} · {i.role.replace("_", " ").toLowerCase()}
        </option>
      ))}
    </select>
  );
}
