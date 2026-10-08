"use client";

import { RouteError } from "@/components/ui/RouteFallback";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="Could not load your dashboard"
      message="Something went wrong loading this dashboard. You can try again."
    />
  );
}
