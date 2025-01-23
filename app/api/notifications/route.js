// app\api\notifications\route.js

import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const notifications = await prisma.notifications.findMany();

        return NextResponse.json(notifications, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}


