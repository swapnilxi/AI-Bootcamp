import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { notifyRoles } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  roles: z.array(z.enum(["USER", "SUBSCRIBER", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"])).min(1, "Choose at least one audience"),
  title: z.string().trim().min(2, "Add a title").max(120),
  message: z.string().trim().min(2, "Write a message").max(2000),
  href: z.string().trim().max(300).regex(/^\/[^\s]*$/, "Link must start with /").optional().or(z.literal("")),
  email: z.boolean().default(false),
});

/** Admin: announce to every user in the chosen roles (in-app, optionally email too). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limiter = await rateLimit(`broadcast:${session.user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limiter.success) return NextResponse.json({ error: "Too many broadcasts. Try again later." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { roles, title, message, href, email } = parsed.data;
  const recipients = await notifyRoles(roles, { kind: "broadcast", title, body: message, href: href || undefined, email, sentById: session.user.id });
  return NextResponse.json({ recipients });
}
