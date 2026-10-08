"use client";

import { RouteError } from "@/components/ui/RouteFallback";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="Could not load mentors"
      message="The faculty directory failed to load. You can try again."
    />
  );
}
