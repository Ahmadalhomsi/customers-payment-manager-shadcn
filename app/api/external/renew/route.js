import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file

export async function POST(request) {
    const data = await request.json();
    const { token, renewPassword, endingDate } = data;

    try {
        if (renewPassword !== process.env.renewPassword) {
            return NextResponse.json({ error: "Invalid renew password" }, { status: 401 });
        }

        const existingService = await prisma.service.findUnique({
            where: { id: token },
        });

        if (!existingService) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        // Calculate new end date
        let newEndDate;
        if (endingDate) {
            newEndDate = new Date(endingDate);
        } else {
            const currentEndDate = new Date(existingService.endingDate);
            const today = new Date();

            newEndDate = currentEndDate > today
                ? new Date(currentEndDate.setFullYear(currentEndDate.getFullYear() + 1))
                : new Date(today.setFullYear(today.getFullYear() + 1));
        }

        // Validate new end date
        if (newEndDate <= existingService.endingDate) {
            await prisma.notifications.create({
                data: {
                    title: 'Renewal Failed',
                    message: endingDate
                        ? `Invalid end date for ${existingService.name}`
                        : `Automatic renewal failed for ${existingService.name}`,
                    type: 'error',
                    read: false,
                },
            });
            return NextResponse.json({
                error: endingDate
                    ? "The new end date must be after the current end date"
                    : "Automatic renewal failed"
            }, { status: 400 });
        }

        // Update service and create history
        const [updatedService] = await prisma.$transaction([
            prisma.service.update({
                where: { id: token },
                data: { endingDate: newEndDate },
            }),
            prisma.renewHistory.create({
                data: {
                    name: `Renewal - ${existingService.name}`,
                    type: existingService.paymentType,
                    previousEndDate: existingService.endingDate,
                    newEndDate: newEndDate,
                    serviceId: token,
                },
            }),
            prisma.notifications.create({
                data: {
                    title: 'Service Renewed',
                    message: `Service ${existingService.name} has been renewed until ${newEndDate.toISOString().split('T')[0]}`,
                    type: 'success',
                    read: false,
                },
            })
        ]);

        return NextResponse.json({
            success: true,
            newEndDate: updatedService.endingDate,
            message: "Service successfully renewed"
        }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 });
    }
}
