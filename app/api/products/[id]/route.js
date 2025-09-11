import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to edit physical products
        if (!decoded.permissions.canEditPhysicalProducts) {
            return NextResponse.json({ error: 'Yasak: Fiziksel ürün düzenleme izniniz yok' }, { status: 403 });
        }

        const { id } = params;
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

        // Update the product
        const product = await prisma.physicalProduct.update({
            where: { id },
            data: {
                name: productName,
                description: description?.trim() || null,
                category,
                brand: brand?.trim() || null,
                model: model?.trim() || null,
                serialNumber: serialNumber?.trim() || null, // Convert empty string to null
                purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                supplier: supplier?.trim() || null,
                status,
                condition,
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

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error('Product update error:', error.message);

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

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: 'Invalid customer ID' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update product', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to edit physical products
        if (!decoded.permissions.canEditPhysicalProducts) {
            return NextResponse.json({ error: 'Yasak: Fiziksel ürün silme izniniz yok' }, { status: 403 });
        }

        const { id } = params;

        // Delete the product
        await prisma.physicalProduct.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Product deletion error:', error.message);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete product', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req, { params }) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = await verifyJWT(token);

        // Check if the user has permission to view physical products
        if (!decoded.permissions.canViewPhysicalProducts) {
            return NextResponse.json({ error: 'Yasak: Fiziksel ürün görüntüleme izniniz yok' }, { status: 403 });
        }

        const { id } = params;

        const includeCustomer = decoded.permissions.canViewCustomers;

        // Get the product
        const product = await prisma.physicalProduct.findUnique({
            where: { id },
            include: {
                customer: includeCustomer
            }
        });

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error('Product fetch error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch product', details: error.message },
            { status: 500 }
        );
    }
}
