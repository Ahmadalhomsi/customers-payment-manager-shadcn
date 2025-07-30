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
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { tableName: { contains: search, mode: 'insensitive' } }
            ]
        } : {};

        // Get total count for pagination
        const totalCount = await prisma.customer.count({
            where: whereClause
        });

        // Get customers from database with pagination
        const customers = await prisma.customer.findMany({
            where: whereClause,
            include: {
                services: includeService,
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
            customers: customers,
            pagination: {
                page,
                limit,
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

