import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { appUrl } from "@/features/booking/server/access";
import { sendEmail } from "@/lib/notify/channels";
import { renderEmailHtml } from "@/lib/notify/templates";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limiter = await rateLimit(`forgot-password:${ip}`, {
      limit: 3,
      windowMs: 10 * 60 * 1000, // 3 requests per 10 minutes
    });

    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const email = result.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // To prevent email enumeration attacks, always respond with success
    if (!user) {
      return NextResponse.json({
        message: "If an account with that email exists, password reset instructions have been generated.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Email the reset link (in-app inbox is skipped: the user isn't signed in).
    const resetUrl = `${appUrl()}/reset-password?token=${resetToken}`;
    const first = (user.name || "").split(" ")[0] || "there";
    const text = `Hi ${first},\n\nUse this link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't ask for this, you can ignore this email.`;
    const sent = await sendEmail(
      user.email,
      "Reset your AI Bootcamp password",
      text,
      renderEmailHtml("Reset your password", [`Hi ${first},`, "Use the button below to choose a new password. The link is valid for 1 hour. If you didn't ask for this, you can ignore this email."], {
        label: "Reset password",
        url: resetUrl,
      })
    );
    if (sent.status === "FAILED") console.error("Password reset email failed:", sent.error);

    return NextResponse.json({
      message: "If an account with that email exists, password reset instructions have been generated.",
      // Return resetToken in non-production for easy demo/testing flow
      demoResetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
