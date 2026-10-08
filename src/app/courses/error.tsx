"use client";

import { RouteError } from "@/components/ui/RouteFallback";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="Could not load classes"
      message="The class catalogue failed to load. You can try again."
    />
  );
}
