import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';


export async function GET(req, { params }) {
    const { id } = await params;
    try {
        const services = await prisma.service.findMany({
            where: { customerID: id },
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

export async function PUT(req, { params }) {
    const { id } = await params;
    const data = await req.json();

    try {
        const service = await prisma.service.update({
            where: { id: id },
            data: {
                name: data.name,
                description: data.description,
                paymentType: data.paymentType,
                periodPrice: data.periodPrice,
                currency: data.currency,
                startingDate: data.startingDate,
                endingDate: data.endingDate,
                customerID: data.customerID
            },
        });
        return NextResponse.json(service, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = await params;
    try {
        await prisma.service.delete({
            where: { id: id },
        });
        return NextResponse.json({ message: 'service deleted' }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }
}