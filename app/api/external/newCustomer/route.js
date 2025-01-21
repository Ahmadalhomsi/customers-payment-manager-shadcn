import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file


export async function GET(req, { params }) {
    const { customerName, password } = await params;

    try {
        const customer = await prisma.customer.findUnique({
            where: { customerName: customerName, password: password },
        });
        return NextResponse.json(customer, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }
}
