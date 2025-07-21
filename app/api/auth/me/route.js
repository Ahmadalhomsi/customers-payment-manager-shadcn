// In /app/api/auth/me/route.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    // Get the token directly from cookies
    const cookies = request.cookies;
    const token = cookies.get("token")?.value;
    
    if (!token) {
      console.log("No token found in cookies");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Verify and decode the token directly
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    // Log the payload to see its structure
    console.log("JWT payload:", payload);
    
    // Return the user data - adapt these fields to match your actual JWT structure
    return NextResponse.json({
      // Try to find user information in common places in JWT structure
      name: payload.name || payload.username || payload.sub || "User",
      permissions: payload.permissions || payload.roles || {},
      // Add the full payload for debugging
      _debug_payload: payload
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    
    // Check if it's a token expiration error
    if (error.code === 'ERR_JWT_EXPIRED' || error.message.includes('expired')) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    
    // For invalid token or other JWT errors
    if (error.code?.startsWith('ERR_JWT_') || error.message.includes('JWT')) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 });
  }
}