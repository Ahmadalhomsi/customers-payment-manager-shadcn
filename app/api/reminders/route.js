import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';


export async function POST(req) {
    const { scheduledAt, message, serviceID } = await req.json();
    
    try {
        const reminder = await prisma.reminder.create({
            data: {
                scheduledAt,
                message,
                serviceID
            },
        });
        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
    }
}

export async function GET() {
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


