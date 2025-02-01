// app\api\admins\route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { verifyJWT } from "@/lib/jwt";

// Add this to your existing route.js file
export async function GET(req) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        if (!decoded.permissions.canViewAdmins) {
            return NextResponse.json({ error: 'Forbidden: You do not have permission to view admins' }, { status: 403 });
        }

        const admins = await prisma.admin.findMany();
        return NextResponse.json(admins);
    } catch (error) {
        console.error("Error fetching admins:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// Update Admin (PUT)
export async function PUT(req) {
    try {
        const { id, username, name, password, active, permissions } = await req.json();

        // Check if admin exists
        const existingAdmin = await prisma.admin.findUnique({ where: { id } });
        if (!existingAdmin) {
            return NextResponse.json({ message: "Admin not found" }, { status: 404 });
        }

        // Hash password if provided
        let updatedData = { username, name, active, ...permissions };
        if (password) {
            updatedData.password = await bcrypt.hash(password, 10);
        }

        // Update admin
        const updatedAdmin = await prisma.admin.update({
            where: { id },
            data: updatedData,
        });

        return NextResponse.json(
            { message: "Admin updated successfully", admin: updatedAdmin },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error updating admin:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// Delete Admin (DELETE)
export async function DELETE(req) {
    try {
        const { id } = await req.json();

        // Check if admin exists
        const existingAdmin = await prisma.admin.findUnique({ where: { id } });
        if (!existingAdmin) {
            return NextResponse.json({ message: "Admin not found" }, { status: 404 });
        }

        // Delete admin
        await prisma.admin.delete({ where: { id } });

        return NextResponse.json({ message: "Admin deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting admin:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
