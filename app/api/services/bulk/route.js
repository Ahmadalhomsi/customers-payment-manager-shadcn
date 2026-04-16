import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

const UNLIMITED_END_DATE = new Date('9999-12-31T00:00:00.000Z');

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
                    { error: `Missing required fields for service at index ${i}. Name: ${name}, CustomerID: ${customerID}` },
                    { status: 400 }
                );
            }

            // Check if customer exists
            const customerExists = await prisma.customer.findUnique({
                where: { id: customerID }
            });

            if (!customerExists) {
                return NextResponse.json(
                    { error: `Customer with ID ${customerID} not found for service at index ${i}` },
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

                const normalizedPeriodPrice = Number.parseFloat(periodPrice);

                const serviceEndDate = paymentType === 'unlimited'
                    ? new Date(UNLIMITED_END_DATE)
                    : new Date(endingDate);
                
                // Create the service
                const service = await prisma.service.create({
                    data: {
                        name,
                        description,
                        companyName,
                        category: category || "Adisyon Programı",
                        paymentType,
                        periodPrice: Number.isFinite(normalizedPeriodPrice) ? normalizedPeriodPrice : 0,
                        currency,
                        active,
                        startingDate: new Date(startingDate),
                        endingDate: serviceEndDate,
                        customer: {
                            connect: { id: customerID }
                        }
                    }
                });

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
