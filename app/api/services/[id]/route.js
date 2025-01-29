import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        let includeReminder = true;
        // Check if the user has permission to view customers
        if (!decoded.permissions.canViewServices) {
            return NextResponse.json({ error: 'Yasak: Hizmet görüntüleme izniniz yok' }, { status: 403 });
        }
        else if (!decoded.permissions.canViewReminders) {
            includeReminder = false;
        }

        const { id } = await params;

        const service = await prisma.service.findUnique({
            where: { id: id },
            include: { reminders: includeReminder },
        });
        return NextResponse.json(service, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {


    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to view customers
        if (!decoded.permissions.canEditServices) {
            return NextResponse.json({ error: 'Yasak: Hizmet güncelleme izniniz yok' }, { status: 403 });
        }

        const { id } = await params;
        const data = await req.json();
        // Fetch the existing service to check current end date and payment type
        const existingService = await prisma.service.findUnique({
            where: { id: id },
        });

        if (!existingService) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        let renewHistoryData = null;
        let shouldUpdateReminders = false;

        // Check if the request includes a new endingDate that extends the current period
        if (data.endingDate) {
            const newEndingDate = new Date(data.endingDate);
            const currentEndingDate = new Date(existingService.endingDate);

            if (newEndingDate > currentEndingDate) {
                // Determine the renewal type (use new paymentType or keep existing)
                const renewalType = data.paymentType !== undefined ? data.paymentType : existingService.paymentType;

                renewHistoryData = {
                    name: `${existingService.name} için Yenileme`,
                    type: renewalType,
                    previousEndDate: currentEndingDate,
                    newEndDate: newEndingDate,
                    serviceId: id,
                };

                shouldUpdateReminders = true;
            }
        }

        // Prepare database operations
        const updateService = prisma.service.update({
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

        const operations = [updateService];

        if (renewHistoryData) {
            operations.push(prisma.renewHistory.create({ data: renewHistoryData }));
        }

        if (shouldUpdateReminders) {
            // Delete existing reminders
            operations.push(
                prisma.reminder.deleteMany({
                    where: { serviceID: id }
                })
            );

            // Calculate new reminder date (1 week before new end date)
            const newEndDate = new Date(data.endingDate);
            const reminderDate = new Date(newEndDate);
            reminderDate.setDate(reminderDate.getDate() - 7);

            // Create new reminder
            operations.push(
                prisma.reminder.create({
                    data: {
                        scheduledAt: reminderDate,
                        status: "SCHEDULED",
                        message: "Hizmetiniz bir hafta içinde sona eriyor! Kesintiyi önlemek için lütfen yenileyin.",
                        serviceID: id,
                    },
                })
            );
        }

        // Execute all operations in a transaction
        const results = await prisma.$transaction(operations);
        const updatedService = results[0];

        return NextResponse.json(updatedService, { status: 200 });
    } catch (error) {
        console.error(error);
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