"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

export default function DashboardHub() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    if (status === "authenticated" && session?.user?.role) {
      switch (session.user.role) {
        case "SUPER_ADMIN":
          router.replace("/dashboard/super-admin");
          break;
        case "ADMIN":
          router.replace("/dashboard/admin");
          break;
        case "INSTRUCTOR":
          router.replace("/dashboard/instructor");
          break;
        case "SUBSCRIBER":
          router.replace("/dashboard/subscriber");
          break;
        case "USER":
        default:
          router.replace("/dashboard/user");
          break;
      }
    }
  }, [session, status, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Sparkles className="w-10 h-10 text-gold animate-spin" />
      <p className="text-sm text-text-muted">Directing to your AI dashboard...</p>
    </div>
  );
}
