import { verifyJWT } from "@/lib/jwt";

export async function GET(req) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const decoded = await verifyJWT(token);

        console.log(decoded);
        
        return new Response(JSON.stringify({ name: decoded.name }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid Token" }), { status: 403 });
    }
}
