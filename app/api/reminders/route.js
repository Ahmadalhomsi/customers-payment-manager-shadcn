import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';


export async function POST(request) {
    try {
        const token = request.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to view customers
        if (!decoded.permissions.canEditReminders) {
            return NextResponse.json({ error: 'Yasak: Hatırlatıcı oluşturma izniniz yok' }, { status: 403 });
        }

        const data = await request.json()
        const { message, scheduledAt, serviceID, status } = data;
        const newReminder = await prisma.reminder.create({
            data: {
                message,
                scheduledAt: new Date(scheduledAt),
                serviceID,
                status,
            }
        })
        return NextResponse.json(newReminder)
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: 'Error creating reminder' },
            { status: 500 }
        )
    }
}

export async function GET() {

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyJWT(token);

    // Check if the user has permission to view customers
    if (!decoded.permissions.canViewReminders) {
        return NextResponse.json({ error: 'Yasak: Hatırlatıcı görüntüleme izniniz yok' }, { status: 403 });
    }

    try {
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


