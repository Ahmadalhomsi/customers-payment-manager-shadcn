// app\api\admins\route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

// Add this to your existing route.js file
export async function GET() {
    try {
        const admins = await prisma.admin.findMany();
        return NextResponse.json(admins);
    } catch (error) {
        console.error("Error fetching admins:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// Create Admin (POST)
export async function POST(req) {
    try {
        const { username, name, password, active, permissions } = await req.json();

        // Check if username already exists
        const existingAdmin = await prisma.admin.findUnique({ where: { username } });
        if (existingAdmin) {
            return NextResponse.json({ message: "Username already exists" }, { status: 400 });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Default permissions (if not provided)
        const defaultPermissions = {
            canViewCustomers: false,
            canEditCustomers: false,
            canViewServices: false,
            canEditServices: false,
            canViewReminders: false,
            canEditReminders: false,
            canViewAdmins: false,
            canEditAdmins: false,
            canSendEmails: false,
            canSeePasswords: false,
        };

        // Merge default permissions with provided ones
        const finalPermissions = { ...defaultPermissions, ...permissions };

        // Create new admin
        const newAdmin = await prisma.admin.create({
            data: {
                username,
                name,
                password: hashedPassword,
                active: active ?? true,
                ...finalPermissions, // Spread permissions into model fields
            },
        });

        return NextResponse.json(
            { message: "Admin created successfully", admin: newAdmin },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating admin:", error);
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
        console.error("Error updating admin:", error);
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
