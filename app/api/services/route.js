import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { subWeeks } from 'date-fns';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to view customers
        if (!decoded.permissions.canEditServices) {
            return NextResponse.json({ error: 'Yasak: Hizmet oluşturma izniniz yok' }, { status: 403 });
        }

        const data = await req.json();

        if (!data) {
            return NextResponse.json(
                { error: 'Request body is empty after parsing' },
                { status: 400 }
            );
        }

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
        } = data;

        // Validate required fields
        if (!name || !customerID) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Handle unlimited service type (100 years into the future)
        let serviceEndDate = new Date(endingDate);
        
        // Create the service with direct date strings
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
                // customerID,
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
                    message: "Hizmetiniz bir hafta içinde sona eriyor! Kesintiyi önlemek için lütfen yenileyin.",  // Özel mesaj
                    serviceID: service.id,
                },
            });
        }

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

export async function GET(req) {
    try {

        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        let includeCustomer = false;
        // Check if the user has permission to view customers
        if (!decoded.permissions.canViewServices) {
            return NextResponse.json({ error: 'Yasak: Hizmet görüntüleme izniniz yok' }, { status: 403 });
        }
        else if (decoded.permissions.canViewCustomers) {
            includeCustomer = true;
        }

        // Get pagination parameters from URL
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Build where clause for search
        const whereClause = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
                ...(includeCustomer ? [{ customer: { name: { contains: search, mode: 'insensitive' } } }] : [])
            ]
        } : {};

        // Get total count for pagination
        const totalCount = await prisma.service.count({
            where: whereClause
        });

        // Get services from database with pagination
        const services = await prisma.service.findMany({
            where: whereClause,
            include: {
                customer: includeCustomer,
            },
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip,
            take: limit,
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limit);

        // Prepare response data
        const responseData = {
            services: services,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages
            }
        };

        return NextResponse.json(responseData, { status: 200 });
    } catch (error) {
        console.error('Service fetch error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch services', details: error.message },
            { status: 500 }
        );
    }
}