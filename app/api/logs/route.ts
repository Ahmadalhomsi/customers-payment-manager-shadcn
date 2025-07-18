import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const requestedLimit = parseInt(searchParams.get('limit') || '20');
    const limit = Math.min(100, Math.max(1, requestedLimit)); // Limit max to 100 for performance
    const search = searchParams.get('search');
    const validationType = searchParams.get('validationType');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    // Search across IP address, service name, and company name
    if (search) {
      where.OR = [
        {
          ipAddress: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          serviceName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          requestBody: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    if (validationType) {
      where.validationType = validationType;
    }
    
    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get logs with pagination
    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.apiLog.count({ where })
    ]);
    
    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Delete all logs from the database
    const deletedCount = await prisma.apiLog.deleteMany({});
    
    return NextResponse.json({
      message: 'All logs cleared successfully',
      deletedCount: deletedCount.count
    });
    
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    );
  }
}
