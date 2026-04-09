import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req) {
    try {
        const token = req.cookies.get('token')?.value;
        const decoded = await verifyJWT(token);

        if (!decoded.permissions.canEditServices) {
            return NextResponse.json({ error: 'Yasak: Hizmet güncelleme izniniz yok' }, { status: 403 });
        }

        const data = await req.json();
        const serviceIds = Array.isArray(data?.serviceIds) ? data.serviceIds.filter(Boolean) : [];
        const archived = Boolean(data?.archived);

        if (serviceIds.length === 0) {
            return NextResponse.json({ error: 'serviceIds alanı zorunludur' }, { status: 400 });
        }

        const archiveDate = archived ? new Date() : null;

        const result = await prisma.service.updateMany({
            where: {
                id: { in: serviceIds }
            },
            data: {
                archived,
                archivedAt: archiveDate
            }
        });

        return NextResponse.json({
            message: archived ? 'Hizmetler arşive taşındı' : 'Hizmetler arşivden çıkarıldı',
            updatedCount: result.count,
            archived
        }, { status: 200 });
    } catch (error) {
        console.error('Bulk archive update error:', error);
        return NextResponse.json({ error: 'Hizmet arşiv güncellemesi başarısız' }, { status: 500 });
    }
}
