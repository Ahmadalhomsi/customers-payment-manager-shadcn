// app\api\notifications\[id]\route.js

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file

export async function GET(req, { params }) {
    const { id } = await params;

    try {
        const notification = await prisma.notifications.findUnique({
            where: { id: id },
        });
        return NextResponse.json(notification, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 });
    }
}


export async function PUT(request, { params }) {
    try {
        const data = await request.json()
        const updatedNotification = await prisma.notifications.update({
            where: { id: params.id },
            data: {
                ...data,
                scheduledAt: new Date(data.scheduledAt),
            },
            include: { service: true }
        })
        return NextResponse.json(updatedNotification, { status: 200 })
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