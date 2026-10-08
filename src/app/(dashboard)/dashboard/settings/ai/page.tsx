import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { listUserCredentials } from "@/lib/ai/credentials";
import { PageHeader } from "@/components/learning/primitives";
import { AiSettingsForm } from "@/components/settings/AiSettingsForm";

export const metadata = {
  title: "AI Settings | AI Bootcamp",
  description: "Bring your own Anthropic, Gemini, DeepSeek or Ollama key for the AI Tutor and study tools.",
};

export default async function AiSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ missing?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/settings/ai");

  const [{ missing }, data] = await Promise.all([searchParams, listUserCredentials(session.user.id)]);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow="Settings"
        title="AI access"
        lede="Every AI feature here — the Tutor, lesson assistants, quizzes, instructor AI twins — needs a key. Bring your own for Anthropic, Gemini, DeepSeek or a self-hosted Ollama, or rely on whichever one an admin has already set up on the server."
      />
      <AiSettingsForm initialData={data} redirected={missing === "1"} />
    </div>
  );
}
