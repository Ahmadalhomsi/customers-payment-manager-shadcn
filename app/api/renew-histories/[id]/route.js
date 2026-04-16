import prisma from '@/lib/prisma';  // Import the prisma instance from the file
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request, { params }) {
    const token = request.cookies.get('token')?.value;
    const decoded = await verifyJWT(token);

    if (!decoded.permissions.canViewServices) {
        return NextResponse.json({ error: 'Yasak: Yenileme geçmişi görüntüleme izniniz yok' }, { status: 403 });
    }

    const { id } = await params

    // Implement your Prisma query here
    const history = await prisma.renewHistory.findMany({
        where: { serviceId: id },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(history)
}

export async function DELETE(request, { params }) {
    const token = request.cookies.get('token')?.value;
    const decoded = await verifyJWT(token);

    if (!decoded.permissions.canEditServices) {
        return NextResponse.json({ error: 'Yasak: Yenileme geçmişi silme izniniz yok' }, { status: 403 });
    }

    const { id } = await params;
    try {
        // Implement your Prisma delete here
        const deleted = await prisma.renewHistory.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message })
    }
}
