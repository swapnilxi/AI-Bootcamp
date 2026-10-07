import React from "react";

interface TrustBadgeProps {
  icon?: React.ReactNode;
  label: string;
  detail?: string;
  className?: string;
}

export function TrustBadge({
  icon,
  label,
  detail,
  className = "",
}: TrustBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black-raised border border-black-line text-text-muted text-sm ${className}`}
    >
      {icon && <span className="text-text-muted shrink-0">{icon}</span>}
      <span className="font-medium text-text">{label}</span>
      {detail && <span className="text-xs text-text-muted">({detail})</span>}
    </div>
  );
}
