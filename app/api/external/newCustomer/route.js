import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { addYears, subWeeks } from 'date-fns';

export async function POST() {
    const data = await request.json()
    const { customerName, password } = data;

    try {
        const customer = await prisma.customer.findUnique({
            where: { customerName: customerName, password: password },
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        } else {
            // Calculate the starting and ending dates for the service
            const startingDate = new Date();
            const endingDate = addYears(startingDate, 1);  // Service ends one year from now

            const newService = await prisma.service.create({
                data: {
                    customerID: customer.id,
                    name: 'Default Service',
                    description: 'Automatic service fom API',
                    periodPrice: 0.0,
                    startingDate: startingDate,
                    endingDate: endingDate, // 1 year later
                    currency: 'TL',
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
                    serviceID: newService.id,
                },
            });
        }
        return NextResponse.json(customer, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }
}
