import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { subWeeks } from 'date-fns';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to create services
        if (!decoded.permissions.canEditServices) {
            return NextResponse.json({ error: 'Yasak: Hizmet oluşturma izniniz yok' }, { status: 403 });
        }

        const { services } = await req.json();

        if (!services || !Array.isArray(services) || services.length === 0) {
            return NextResponse.json(
                { error: 'Services array is required and must not be empty' },
                { status: 400 }
            );
        }

        // Validate each service in the array
        for (let i = 0; i < services.length; i++) {
            const service = services[i];
            const { name, customerID } = service;

            if (!name || !customerID) {
                return NextResponse.json(
                    { error: `Missing required fields for service at index ${i}` },
                    { status: 400 }
                );
            }
        }

        // Create all services in a transaction for data consistency
        const createdServices = await prisma.$transaction(async (prisma) => {
            const results = [];
            
            for (const serviceData of services) {
                const {
                    name,
                    description,
                    companyName,
                    category,
                    paymentType,
                    periodPrice,
                    currency,
                    customerID,
                    startingDate,
                    endingDate,
                    active = true
                } = serviceData;

                // Handle unlimited service type (100 years into the future)
                let serviceEndDate = new Date(endingDate);
                
                // Create the service
                const service = await prisma.service.create({
                    data: {
                        name,
                        description,
                        companyName,
                        category: category || "Adisyon Programı",
                        paymentType,
                        periodPrice: parseFloat(periodPrice), // Ensure periodPrice is a float
                        currency,
                        active,
                        startingDate: new Date(startingDate),
                        endingDate: serviceEndDate,
                        customer: {
                            connect: { id: customerID }
                        }
                    }
                });

                // Only create a reminder if the service is not unlimited
                if (paymentType !== "unlimited") {
                    // Calculate the reminder date (one week before the service ends)
                    const reminderDate = subWeeks(serviceEndDate, 1);

                    // Create a reminder for one week before the service ends
                    await prisma.reminder.create({
                        data: {
                            scheduledAt: reminderDate,
                            status: "SCHEDULED",
                            message: "Hizmetiniz bir hafta içinde sona eriyor! Kesintiyi önlemek için lütfen yenileyin.",
                            serviceID: service.id,
                        },
                    });
                }

                results.push(service);
            }

            return results;
        });

        return NextResponse.json({ 
            message: `${createdServices.length} services created successfully`,
            services: createdServices 
        }, { status: 201 });
        
    } catch (error) {
        console.error('Bulk service creation error:', error.message);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'One or more services with the same name already exist' },
                { status: 409 }
            );
        }

        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: 'Invalid customer ID in one or more services' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create services', details: error.message },
            { status: 500 }
        );
    }
}
