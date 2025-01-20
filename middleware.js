import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }


  let token = req.cookies.get("token")?.value;
  const authHeader = req.headers.get("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    if (!pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    req.nextUrl.searchParams.set("user", JSON.stringify(payload));

    if (pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.redirect(new URL("/login", req.url));
    // return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}

// Exclude certain routes (e.g., login, signup, public pages) from requiring JWT authentication
export const config = {
  matcher: [
    "/api/:path*",  // Apply to all API routes
    "/",            // Apply to the root route
    "/login",     // Apply to the profile route
  ],
};
