import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to edit physical products
        if (!decoded.permissions.canEditPhysicalProducts) {
            return NextResponse.json({ error: 'Yasak: Fiziksel ürün oluşturma izniniz yok' }, { status: 403 });
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
            category,
            brand,
            model,
            serialNumber,
            purchasePrice,
            purchaseDate,
            supplier,
            status,
            condition,
            specifications,
            warranty,
            notes,
            location,
            customerID
        } = data;

        // Validate required fields - category and customer are required now
        if (!category) {
            return NextResponse.json(
                { error: 'Product category is required' },
                { status: 400 }
            );
        }

        if (!customerID) {
            return NextResponse.json(
                { error: 'Customer selection is required' },
                { status: 400 }
            );
        }

        // Generate a default name if not provided
        const productName = name?.trim() || `${category} - ${brand || 'Bilinmeyen'} ${model || ''}`.trim();

        // Create the product
        const product = await prisma.physicalProduct.create({
            data: {
                name: productName,
                description: description?.trim() || null,
                category: category || "Bilgisayar",
                brand: brand?.trim() || null,
                model: model?.trim() || null,
                serialNumber: serialNumber?.trim() || null, // Convert empty string to null
                purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                supplier: supplier?.trim() || null,
                status: status || "AVAILABLE",
                condition: condition || "Yeni",
                specifications: specifications?.trim() || null,
                warranty: warranty?.trim() || null,
                notes: notes?.trim() || null,
                location: location?.trim() || null,
                customerID: customerID || null,
            },
            include: {
                customer: true
            }
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('Product creation error:', error.message);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            if (error.meta?.target?.includes('serialNumber')) {
                return NextResponse.json(
                    { error: 'A product with this serial number already exists' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: 'A product with this data already exists' },
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
            { error: 'Failed to create product', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        let includeCustomer = false;
        // Check if the user has permission to view physical products
        if (!decoded.permissions.canViewPhysicalProducts) {
            return NextResponse.json({ error: 'Yasak: Fiziksel ürün görüntüleme izniniz yok' }, { status: 403 });
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
        const brandFilter = searchParams.get('brand') || 'all';

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Build where clause for search and filtering
        const whereClause = {};
        
        // Add search conditions
        if (search) {
            // Check if search term looks like an ID (starts with 'c' for cuid)
            const isIdSearch = search.match(/^c[a-z0-9]+$/i);
            
            if (isIdSearch) {
                // If it looks like an ID, search by exact ID match first, then fallback to text search
                whereClause.OR = [
                    { id: { equals: search } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { brand: { contains: search, mode: 'insensitive' } },
                    { model: { contains: search, mode: 'insensitive' } },
                    { serialNumber: { contains: search, mode: 'insensitive' } },
                    { category: { contains: search, mode: 'insensitive' } },
                    { supplier: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                    ...(includeCustomer ? [
                        { customer: { id: { equals: search } } },
                        { customer: { name: { contains: search, mode: 'insensitive' } } }
                    ] : [])
                ];
            } else {
                // Regular text search
                whereClause.OR = [
                    { id: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { brand: { contains: search, mode: 'insensitive' } },
                    { model: { contains: search, mode: 'insensitive' } },
                    { serialNumber: { contains: search, mode: 'insensitive' } },
                    { category: { contains: search, mode: 'insensitive' } },
                    { supplier: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                    ...(includeCustomer ? [
                        { customer: { id: { contains: search, mode: 'insensitive' } } },
                        { customer: { name: { contains: search, mode: 'insensitive' } } }
                    ] : [])
                ];
            }
        }

        // Add status filtering
        if (statusFilter !== 'all') {
            whereClause.status = statusFilter.toUpperCase();
        }

        // Add category filtering
        if (categoryFilter !== 'all') {
            whereClause.category = categoryFilter;
        }

        // Add brand filtering
        if (brandFilter !== 'all') {
            whereClause.brand = brandFilter;
        }

        // Get total count for pagination
        const totalCount = await prisma.physicalProduct.count({
            where: whereClause
        });

        // Get products with pagination
        const products = await prisma.physicalProduct.findMany({
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
            products: products,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages
            }
        };

        return NextResponse.json(responseData, { status: 200 });
    } catch (error) {
        console.error('Product fetch error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch products', details: error.message },
            { status: 500 }
        );
    }
}
