import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {

    const { id } = await params

    // Implement your Prisma query here
    const history = await prisma.renewHistory.findMany({
        where: { serviceId: id },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(history)
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    console.log('IDaaaaaaa:', id);

    try {
        // Implement your Prisma delete here
        const deleted = await prisma.renewHistory.delete({
            where: { id }
        })

        console.log('Deletedxxxxxxx:', deleted);


        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message })
    }
}
