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
        const statusFilter = searchParams.get('status') || 'all';
        const categoryFilter = searchParams.get('category') || 'all';
        const startDateFrom = searchParams.get('startDateFrom');
        const startDateTo = searchParams.get('startDateTo');
        const endDateFrom = searchParams.get('endDateFrom');
        const endDateTo = searchParams.get('endDateTo');

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Build where clause for search and filtering
        const whereClause = {};
        
        // Add search conditions
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
                ...(includeCustomer ? [{ customer: { name: { contains: search, mode: 'insensitive' } } }] : [])
            ];
        }

        // Add category filtering
        if (categoryFilter !== 'all') {
            whereClause.category = categoryFilter;
        }

        // Add start date range filtering
        if (startDateFrom || startDateTo) {
            whereClause.startingDate = {};
            if (startDateFrom) {
                whereClause.startingDate.gte = new Date(startDateFrom);
            }
            if (startDateTo) {
                whereClause.startingDate.lte = new Date(startDateTo);
            }
        }

        // Add end date range filtering
        if (endDateFrom || endDateTo) {
            whereClause.endingDate = {};
            if (endDateFrom) {
                whereClause.endingDate.gte = new Date(endDateFrom);
            }
            if (endDateTo) {
                whereClause.endingDate.lte = new Date(endDateTo);
            }
        }

        // For status filtering, we need to get all services first and then filter
        // because status is calculated based on service dates
        let allServices;
        let totalCount;

        if (statusFilter !== 'all') {
            // First, get all services matching other criteria
            allServices = await prisma.service.findMany({
                where: whereClause,
                include: {
                    customer: includeCustomer,
                },
                orderBy: {
                    [sortBy]: sortOrder,
                }
            });

            // Apply status filtering
            const today = new Date();
            
            const filteredServices = allServices.filter(service => {
                // First check if the service is explicitly set as inactive
                if (service.active === false) {
                    return statusFilter === 'inactive';
                }
                
                const startDate = new Date(service.startingDate);
                const endDate = new Date(service.endingDate);

                let status;
                // If service hasn't started yet, it's not started
                if (today < startDate) {
                    status = 'notStarted';
                }
                // If service has already expired, it's expired
                else if (today > endDate) {
                    status = 'expired';
                }
                else {
                    // Check if service is expiring within 1 month (30 days)
                    const oneMonthFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
                    
                    if (endDate <= oneMonthFromNow) {
                        status = 'upcoming';
                    } else {
                        status = 'active';
                    }
                }

                return status === statusFilter;
            });

            // Apply pagination to filtered results
            totalCount = filteredServices.length;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            allServices = filteredServices.slice(startIndex, endIndex);
        } else {
            // No status filter, use regular pagination
            totalCount = await prisma.service.count({
                where: whereClause
            });

            allServices = await prisma.service.findMany({
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
        }

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limit);

        // Prepare response data
        const responseData = {
            services: allServices,
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