"use client";

import { RouteError } from "@/components/ui/RouteFallback";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="Could not load your profile"
      message="Your profile failed to load. You can try again."
    />
  );
}
