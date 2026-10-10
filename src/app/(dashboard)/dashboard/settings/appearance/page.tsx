import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/learning/primitives";
import { AppearanceSettingsForm } from "@/components/settings/AppearanceSettingsForm";
import { isAccentColor, DEFAULT_ACCENT } from "@/lib/accent";

export const metadata = {
  title: "Appearance | AI Bootcamp",
  description: "Pick the accent color used for buttons, links and glow effects across the app.",
};

export default async function AppearanceSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/settings/appearance");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { accentColor: true } });
  const initialAccent = isAccentColor(user?.accentColor) ? user.accentColor : DEFAULT_ACCENT;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow="Settings"
        title="Appearance"
        lede="Pick the accent color used for buttons, links, borders and glow effects across the app."
      />
      <AppearanceSettingsForm initialAccent={initialAccent} />
    </div>
  );
}
