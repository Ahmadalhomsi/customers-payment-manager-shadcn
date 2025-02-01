import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file

export async function GET(req, { params }) {
    const token = req.cookies.get("token")?.value;
    const decoded = await verifyJWT(token);

    // Check if the user has permission to view reminders
    if (!decoded.permissions.canViewReminders) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to view reminders' }, { status: 403 });
    }
    const { id } = await params;

    try {
        const reminder = await prisma.reminder.findMany({
            where: { serviceID: id },
        });
        return NextResponse.json(reminder, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch reminder' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyJWT(token);

    // Check if the user has permission to edit reminders
    if (!decoded.permissions.canEditReminders) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to update reminders' }, { status: 403 });
    }

    try {
        const data = await request.json()
        const updatedReminder = await prisma.reminder.update({
            where: { id: params.id },
            data: {
                ...data,
                scheduledAt: new Date(data.scheduledAt),
            },
            include: { service: true }
        })
        return NextResponse.json(updatedReminder)
    } catch (error) {
        return NextResponse.json(
            { error: 'Error updating reminder' },
            { status: 500 }
        )
    }
}

export async function DELETE(req, { params }) {
    const token = req.cookies.get("token")?.value;
    const decoded = await verifyJWT(token);

    // Check if the user has permission to delete reminders
    if (!decoded.permissions.canEditReminders) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to delete reminders' }, { status: 403 });
    }

    const { id } = await params;
    try {
        await prisma.reminder.delete({
            where: { id: id },
        });
        return NextResponse.json({ message: 'Reminder deleted' }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
    }
}
