import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        
        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            service: 'customers-payment-manager'
        }, { status: 200 });
    } catch (error) {
        console.error('Health check failed:', error);
        
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            service: 'customers-payment-manager',
            error: error.message
        }, { status: 503 });
    }
}
