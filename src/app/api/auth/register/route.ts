import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, role, bio } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Instructor sign-ups start as regular users with a pending application; an admin promotes them on approval
    const wantsInstructor = role === "INSTRUCTOR";
    const assignedRole = Role.USER;

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
        approvalStatus: wantsInstructor ? "PENDING" : "APPROVED",
        bio: bio || (wantsInstructor ? "AI instructor & mentor" : undefined),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        bio: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "Registration successful", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
