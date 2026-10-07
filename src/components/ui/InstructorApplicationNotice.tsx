"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Clock } from "lucide-react";

/** Shown to a regular user whose instructor application is awaiting (or failed) admin verification. */
export function InstructorApplicationNotice({
  role,
  approvalStatus,
  rejectionReason,
}: {
  role?: string | null;
  approvalStatus?: string | null;
  rejectionReason?: string | null;
}) {
  if (role !== "USER" && role !== "SUBSCRIBER") return null;

  if (approvalStatus === "PENDING") {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-sm">
        <Clock className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-amber-300">Profile under verification</p>
          <p className="text-xs text-text-muted mt-0.5">
            Your instructor application is being reviewed by academy administration. You keep full access as a
            learner meanwhile, and the Instructor Studio unlocks once you are approved.
          </p>
        </div>
      </div>
    );
  }

  if (approvalStatus === "REJECTED") {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-sm">
        <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-red-300">Instructor application not approved</p>
          <p className="text-xs text-text-muted mt-0.5">
            {rejectionReason || "Your application did not meet the requirements."} Update your{" "}
            <Link href="/profile" className="underline text-gold">profile</Link> and apply again.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
