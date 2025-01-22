import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';

export async function POST(req) {
    const { name, email, phone, password } = await req.json();
    try {
        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                phone,
                password
            },
        });
        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                services: true,
            },
        });
        return NextResponse.json(customers, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}


