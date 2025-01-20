import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file


export async function GET(req, { params }) {
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

export async function PUT(req, { params }) {
    const { id, scheduledAt, status, message } = params;

    try {
        const reminder = await prisma.reminder.update({
            where: { id: id },
            data: {
                scheduledAt,
                status,
                message
            },
        });
        return NextResponse.json(reminder, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = await params;
    try {
        await prisma.reminder.delete({
            where: { id: id },
        });
        return NextResponse.json({ message: 'reminder deleted' }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
    }
}