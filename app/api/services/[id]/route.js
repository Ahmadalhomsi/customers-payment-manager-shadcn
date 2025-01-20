import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';


export async function GET(req, { params }) {
    const { id } = params;
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
    const { id } = params;
    const data = await req.json();
    let startingDate = data.startingDate;
    let endingDate = data.endingDate;

    startingDate = new Date(startingDate.year, startingDate.month - 1, startingDate.day + 1);
    endingDate = new Date(endingDate.year, endingDate.month - 1, endingDate.day + 1);
    startingDate.setUTCHours(0, 0, 0, 0);
    endingDate.setUTCHours(0, 0, 0, 0);

    try {
        const service = await prisma.service.update({
            where: { id: id },
            data: {
                name: data.name,
                description: data.description,
                paymentType: data.paymentType,
                periodPrice: data.periodPrice,
                currency: data.currency,
                startingDate: startingDate,
                endingDate: endingDate,
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
    const { id } = params;
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