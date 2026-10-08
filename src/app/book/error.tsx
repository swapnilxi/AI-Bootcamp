"use client";

import { RouteError } from "@/components/ui/RouteFallback";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="Could not load booking"
      message="The booking flow failed to load. You can try again."
    />
  );
}
