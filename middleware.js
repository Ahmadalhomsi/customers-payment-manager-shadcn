import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow public routes without requiring JWT
  const publicRoutes = ["/login", "/api/login", "/api/external"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  let token = req.cookies.get("token")?.value;
  const authHeader = req.headers.get("Authorization");

  // Check the token in both cookie and Authorization header
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // If no token, redirect to login (but not if already on the login page)
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // Verify the JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    req.nextUrl.searchParams.set("user", JSON.stringify(payload));

    // Prevent redirect loop on the login page
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    // Clear cookies on verification failure and redirect to login
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: ["/api/:path*", "/", "/login", "/services"],
};
