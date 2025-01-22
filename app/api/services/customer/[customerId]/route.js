import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';


export async function GET(req, { params }) {
    const { customerId } = params; // Changed from 'id' to 'customerId'

    try {
        const services = await prisma.service.findMany({
            where: { customerID: customerId }, // Use customerId instead of id
            include: {
                reminders: true,
            },
        });
        return NextResponse.json(services, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }
}
