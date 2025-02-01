import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { verifyJWT } from "@/lib/jwt";

export async function PUT(req, { params }) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        if (!decoded.permissions.canEditAdmins) {
            return NextResponse.json({ error: 'Forbidden: You do not have permission to update admins' }, { status: 403 });
        }

        const { id } = await params;
        const { username, name, password, active, permissions } = await req.json();

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
        console.log("AAAAA");

        console.log(updatedData);

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