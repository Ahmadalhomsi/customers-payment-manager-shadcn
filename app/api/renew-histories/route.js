import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';

// app/api/renew-history/route.js
export async function GET(request) {

    // Implement your Prisma query here
    const histories = await prisma.renewHistory.findMany()

    return NextResponse.json(histories)
}

