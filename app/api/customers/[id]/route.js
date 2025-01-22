import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file


export async function GET(req, { params }) {
    const { id } = await params;

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: id },
        });
        return NextResponse.json(customer, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    const { id } = await params;
    const { name, email, password } = await req.json();
    try {
        const customer = await prisma.customer.update({
            where: { id: id },
            data: { name, email, password },
        });
        return NextResponse.json(customer, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = await params;
    try {
        await prisma.customer.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'customer deleted' }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
}