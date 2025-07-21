import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt'; // You'll need to create this helper
import { addYears, subWeeks } from 'date-fns';  // Use date-fns to handle date calculations

export async function POST(req) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to create customers
        if (!decoded.permissions.canEditCustomers) {
            return NextResponse.json({ error: 'Yasak: Müşteri oluşturma izniniz yok' }, { status: 403 });
        }

        // Extract request body
        const { name, tableName, email, phone, password } = await req.json();

        // Create the customer
        const customer = await prisma.customer.create({
            data: { name, tableName, email, phone, password },
        });

        // Calculate service dates
        // const startingDate = new Date();
        // const endingDate = addYears(startingDate, 1);
        const reminderDate = subWeeks(endingDate, 1);

        // // Create a default service
        // const service = await prisma.service.create({
        //     data: {
        //         name: "Default Hizmet",
        //         description: "Otomatik oluşturulan hizmet",
        //         paymentType: "1year",
        //         periodPrice: 0.0,
        //         currency: "TL",
        //         startingDate,
        //         endingDate,
        //         customerID: customer.id,
        //     },
        // });

        // Create a reminder
        await prisma.reminder.create({
            data: {
                scheduledAt: reminderDate,
                status: "SCHEDULED",
                message: "Hizmetinizin bitmesine bir hafta kaldı! Kesinti yaşamamak için lütfen yenileyin.",
                serviceID: service.id,
            },
        });

        return NextResponse.json(customer, { status: 201 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to create customer and associated service' }, { status: 500 });
    }
}


export async function GET(req) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        let includeService = true;
        // Check if the user has permission to view customers
        if (!decoded.permissions.canViewCustomers) {
            return NextResponse.json({ error: 'Yasak: Müşterileri görüntüleme izniniz yok' }, { status: 403 });
        }

        // Check if the user has permission to view customers
        if (!decoded.permissions.canViewServices) {
            includeService = false;
        }

        // Get customers from database
        const customers = await prisma.customer.findMany({
            include: {
                services: includeService,
            },
            orderBy: {
                createdAt: 'desc', // Sort by creation date, newest first
            },
        });

        // If user can't see passwords, remove them from the response
        if (!decoded.permissions.canSeePasswords) {
            return NextResponse.json(
                customers.map(customer => {
                    return {
                        ...customer,
                        password: "", // Set password to empty string
                    };
                }),
                { status: 206 }
            );
        }

        // If user has permission, return full data including passwords
        return NextResponse.json(customers, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

