import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt'; // You'll need to create this helper
import { addYears, subWeeks } from 'date-fns';  // Use date-fns to handle date calculations
import { generateSecurePassword } from '@/lib/utils';

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

        // Generate a secure password if none provided
        const finalPassword = password || generateSecurePassword(12, {
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSymbols: false, // Don't include symbols for easier typing
            excludeSimilar: true
        });

        // Create the customer
        const customer = await prisma.customer.create({
            data: { name, tableName, email, phone, password: finalPassword },
        });

        // Return customer data with the generated password (for display purposes)
        const responseData = {
            ...customer,
            generatedPassword: !password ? finalPassword : null // Only include generated password if we created one
        };

        return NextResponse.json(responseData, { status: 201 });

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

        // Get pagination parameters from URL
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const requestedLimit = parseInt(searchParams.get('limit')) || 20;
        
        // If requested limit is very high (10000+), fetch ALL records without pagination
        const fetchAll = requestedLimit >= 10000;
        let limit, skip;
        
        if (fetchAll) {
            limit = undefined; // No limit - fetch all records
            skip = 0; // No skip - start from beginning
        } else {
            limit = requestedLimit;
            skip = (page - 1) * limit;
        }
        
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build where clause for search
        const whereClause = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { tableName: { contains: search, mode: 'insensitive' } }
            ]
        } : {};

        // Get total count for pagination
        const totalCount = await prisma.customer.count({
            where: whereClause
        });

        // Get customers from database with conditional pagination
        const queryOptions = {
            where: whereClause,
            include: {
                services: includeService,
            },
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip,
        };
        
        // Only add 'take' if we're not fetching all records
        if (!fetchAll && limit !== undefined) {
            queryOptions.take = limit;
        }
        
        const customers = await prisma.customer.findMany(queryOptions);

        // Calculate pagination info
        const totalPages = fetchAll ? 1 : Math.ceil(totalCount / limit);

        // Prepare response data
        const responseData = {
            customers: customers,
            pagination: {
                page: fetchAll ? 1 : page,
                limit: fetchAll ? customers.length : limit,
                total: totalCount,
                totalPages
            }
        };

        // If user can't see passwords, remove them from the response
        if (!decoded.permissions.canSeePasswords) {
            responseData.customers = customers.map(customer => {
                return {
                    ...customer,
                    password: "", // Set password to empty string
                };
            });
            return NextResponse.json(responseData, { status: 206 });
        }

        // If user has permission, return full data including passwords
        return NextResponse.json(responseData, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

