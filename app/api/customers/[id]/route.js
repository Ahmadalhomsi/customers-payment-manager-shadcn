import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { verifyJWT } from '@/lib/jwt';

export async function PUT(req, { params }) {
    const { id } = await params;
    const { name, tableName, email, phone, password } = await req.json();

    const token = req.cookies.get("token")?.value;
    const decoded = await verifyJWT(token);

    if (!decoded.permissions.canEditCustomers) {
        return NextResponse.json({ error: 'Yasak: Müşteri güncelleme izniniz yok' }, { status: 403 });
    }

    try {
        const customer = await prisma.customer.update({
            where: { id: id },
            data: { name, tableName, email, phone, password },
        });
        return NextResponse.json(customer, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = await params;

    const token = req.cookies.get("token")?.value;
    const decoded = await verifyJWT(token);

    if (!decoded.permissions.canEditCustomers) {
        return NextResponse.json({ error: 'Yasak: Müşteri silme izniniz yok' }, { status: 403 });
    }

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