import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    const { customerId } = await params;

    const token = req.cookies.get("token")?.value;
    const decoded = await verifyJWT(token);

    // Check if the user has permission to view services
    if (!decoded.permissions.canViewServices) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to view services' }, { status: 403 });
    }

    try {
        const services = await prisma.service.findMany({
            where: { customerID: customerId }, // Use customerId instead of id
            orderBy: {
                createdAt: 'desc', // Sort by creation date, newest first
            },
        });
        return NextResponse.json(services, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }
}
