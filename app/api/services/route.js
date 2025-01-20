import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const data = await req.json();
        console.log('Received data:', data);

        if (!data) {
            return NextResponse.json(
                { error: 'Request body is empty after parsing' },
                { status: 400 }
            );
        }

        // Destructure the fields
        const { 
            name, 
            description, 
            paymentType, 
            periodPrice, 
            currency, 
            customerID,
            startingDate,
            endingDate 
        } = data;

        // Validate required fields
        if (!name || !customerID) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create the service with direct date strings
        const service = await prisma.service.create({
            data: {
                name,
                description,
                paymentType,
                periodPrice: parseFloat(periodPrice), // Ensure periodPrice is a float
                currency,
                startingDate: new Date(startingDate),
                endingDate: new Date(endingDate),
                customerID
            }
        });

        return NextResponse.json(service, { status: 201 });
    } catch (error) {
        console.error('Service creation error:', error.message);
        
        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A service with this name already exists' },
                { status: 409 }
            );
        }
        
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: 'Invalid customer ID' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create service', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const services = await prisma.service.findMany({
            include: {
                customer: true,
            },
        });
        return NextResponse.json(services, { status: 200 });
    } catch (error) {
        console.error('Service fetch error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch services', details: error.message },
            { status: 500 }
        );
    }
}