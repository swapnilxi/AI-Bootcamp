import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import { ROLE_HIERARCHY, RoleName as RoleType } from "@/lib/roles";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const userRole = (token?.role as RoleType) || "USER";

    // Super Admin routes
    if (pathname.startsWith("/dashboard/super-admin")) {
      if (userRole !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
      }
    }

    // Admin routes
    if (pathname.startsWith("/dashboard/admin")) {
      if ((ROLE_HIERARCHY[userRole] || 1) < ROLE_HIERARCHY.ADMIN) {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
      }
    }

    // Instructor routes: class authoring (per-class ownership is enforced by the API)
    if (
      pathname.startsWith("/dashboard/instructor") ||
      pathname.startsWith("/courses/new") ||
      /^\/classes\/[^/]+\/edit/.test(pathname)
    ) {
      if ((ROLE_HIERARCHY[userRole] || 1) < ROLE_HIERARCHY.INSTRUCTOR) {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
      }
    }

    // Subscriber routes
    if (pathname.startsWith("/dashboard/subscriber")) {
      if ((ROLE_HIERARCHY[userRole] || 1) < ROLE_HIERARCHY.SUBSCRIBER) {
        return NextResponse.redirect(new URL("/dashboard?error=subscriber_required", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Public pages
        if (
          pathname === "/" ||
          pathname.startsWith("/landing") ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/forgot-password") ||
          pathname.startsWith("/reset-password") ||
          (pathname === "/courses" && req.method === "GET")
        ) {
          return true;
        }

        // Classes detail is public to view description, only specific actions require auth
        if (pathname.match(/^\/classes\/[^/]+$/) && req.method === "GET") {
          return true;
        }

        // All other dashboard, profile, and creation routes require token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/courses/new",
    "/courses/:id/edit",
  ],
};
