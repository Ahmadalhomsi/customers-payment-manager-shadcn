import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    const { customerId } = await params;

    const token = req.cookies.get("token")?.value;
    const decoded = await verifyJWT(token);


    let includeReminders = true;
    // Check if the user has permission to view customers
    if (!decoded.permissions.canViewServices) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to view services' }, { status: 403 });
    }
    else if (!decoded.permissions.canViewReminders) {
        includeReminders = false;
    }

    try {
        const services = await prisma.service.findMany({
            where: { customerID: customerId }, // Use customerId instead of id
            include: {
                reminders: includeReminders,
            },
        });
        return NextResponse.json(services, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }
}
