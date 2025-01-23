import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file


export async function GET(req, { params }) {
    const { id } = await params;

    try {
        const notifications = await prisma.notifications.findMany({
            where: { serviceID: id },
        });
        return NextResponse.json(notifications, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 });
    }
}


export async function PUT(request, { params }) {
    try {
        const data = await request.json()
        const updatedNotifications = await prisma.notifications.update({
            where: { id: params.id },
            data: {
                ...data,
                scheduledAt: new Date(data.scheduledAt),
            },
            include: { service: true }
        })
        return NextResponse.json(updatedNotifications)
    } catch (error) {
        return NextResponse.json(
            { error: 'Error updating notification' },
            { status: 500 }
        )
    }
}

export async function DELETE(req, { params }) {
    const { id } = await params;
    try {
        await prisma.notifications.delete({
            where: { id: id },
        });
        return NextResponse.json({ message: 'notification deleted' }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}