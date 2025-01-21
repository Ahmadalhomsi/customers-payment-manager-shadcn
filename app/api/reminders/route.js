import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';


export async function POST(request) {
    try {
        const data = await request.json()
        const reminder = await prisma.reminder.create({
            data: {
                ...data,
                scheduledAt: new Date(data.scheduledAt),
            },
            include: { service: true }
        })
        return NextResponse.json(reminder)
    } catch (error) {
        return NextResponse.json(
            { error: 'Error creating reminder' },
            { status: 500 }
        )
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


