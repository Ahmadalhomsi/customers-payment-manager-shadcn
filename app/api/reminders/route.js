import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const token = request.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to create reminders
        if (!decoded.permissions.canEditReminders) {
            return NextResponse.json({ error: 'Forbidden: You do not have permission to create reminders' }, { status: 403 });
        }

        const data = await request.json();
        const { message, scheduledAt, serviceID, status } = data;
        const newReminder = await prisma.reminder.create({
            data: {
                message,
                scheduledAt: new Date(scheduledAt),
                serviceID,
                status,
            }
        });
        return NextResponse.json(newReminder);
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: 'Error creating reminder' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const token = request.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to view reminders
        if (!decoded.permissions.canViewReminders) {
            return NextResponse.json({ error: 'Forbidden: You do not have permission to view reminders' }, { status: 403 });
        }

        const reminders = await prisma.reminder.findMany({
            include: {
                services: true,
            },
        });
        return NextResponse.json(reminders, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }
}
