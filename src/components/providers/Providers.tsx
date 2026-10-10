"use client";

import { SessionProvider, useSession } from "next-auth/react";
import React from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { ViewModeProvider } from "@/components/providers/ViewModeProvider";

/** Inner wrapper so we can call useSession (requires SessionProvider above). */
function InnerProviders({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  return (
    <ViewModeProvider session={session}>
      <ToastProvider>{children}</ToastProvider>
    </ViewModeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InnerProviders>{children}</InnerProviders>
    </SessionProvider>
  );
}
