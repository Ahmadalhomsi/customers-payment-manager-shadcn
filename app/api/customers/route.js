import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';
import { addYears, subWeeks } from 'date-fns';  // Use date-fns to handle date calculations

export async function POST(req) {
    const { name, email, phone, password } = await req.json();
    try {
        // First, create the customer
        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                phone,
                password
            },
        });

        // Calculate the starting and ending dates for the service
        const startingDate = new Date();
        const endingDate = addYears(startingDate, 1);  // Service ends one year from now

        // Create the default service for the customer
        const service = await prisma.service.create({
            data: {
                name: "Default Service",
                description: "Automatically created default service",
                paymentType: "Yearly",
                periodPrice: 0.0,  // Assuming no initial cost
                currency: "TL",
                startingDate: startingDate,
                endingDate: endingDate,
                customerID: customer.id,
            },
        });

        // Calculate the reminder date (one week before the service ends)
        const reminderDate = subWeeks(endingDate, 1);

        // Create a reminder for one week before the service ends
        await prisma.reminder.create({
            data: {
                scheduledAt: reminderDate,
                status: "SCHEDULED",
                message: "Your service is ending in one week! Please renew to avoid interruption.",  // Custom message
                serviceID: service.id,
            },
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to create customer and associated service' }, { status: 500 });
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


