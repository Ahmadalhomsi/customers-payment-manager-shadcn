import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const endpoint = searchParams.get('endpoint');
    const validationType = searchParams.get('validationType');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    if (endpoint) {
      where.endpoint = {
        contains: endpoint,
        mode: 'insensitive'
      };
    }
    if (validationType) {
      where.validationType = validationType;
    }
    
    // Get logs with pagination
    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
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
