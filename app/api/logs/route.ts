import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const requestedLimit = parseInt(searchParams.get('limit') || '20');
    const limit = Math.min(100, Math.max(1, requestedLimit)); // Normal pagination limit
    const skip = (page - 1) * limit;
    
    const search = searchParams.get('search');
    const validationType = searchParams.get('validationType');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where clause
    const where: any = {};
    
    // Search across IP address, service name, request body, and customer names
    if (search) {
      // First, find customer IDs that match the search term
      const matchingCustomers = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { tableName: { contains: search, mode: 'insensitive' } }
          ]
        },
        select: { id: true }
      });

      // Find services that belong to matching customers
      const matchingServices = await prisma.service.findMany({
        where: {
          customerID: { in: matchingCustomers.map(c => c.id) }
        },
        select: { name: true }
      });

      const serviceNames = matchingServices.map(s => s.name);

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
        },
        // Include logs for services that belong to matching customers
        ...(serviceNames.length > 0 ? [{
          serviceName: {
            in: serviceNames
          }
        }] : [])
      ];
    }
    
    if (validationType) {
      where.validationType = validationType;
    }
    
    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get logs with pagination and include related service/customer data
    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.apiLog.count({ where })
    ]);

    // Enhance logs with customer information
    const enhancedLogs = await Promise.all(
      logs.map(async (log) => {
        let customerInfo = null;
        
        // If we have a serviceName, try to find the corresponding service and customer
        if (log.serviceName) {
          try {
            // Build a more specific query using available information
            const whereClause: any = {
              name: log.serviceName
            };

            // If we have deviceToken in the log, use it for precise matching
            if (log.deviceToken) {
              whereClause.deviceToken = log.deviceToken;
            } else {
              // Fallback: try to extract deviceToken from the request body
              try {
                const requestData = JSON.parse(log.requestBody || '{}');
                if (requestData.deviceToken) {
                  whereClause.deviceToken = requestData.deviceToken;
                }
              } catch (e) {
                // Ignore JSON parse errors
              }
            }

            const service = await prisma.service.findFirst({
              where: whereClause,
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                    tableName: true,
                    email: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc' // Get the most recent service with these criteria
              }
            });

            if (service?.customer) {
              customerInfo = service.customer;
            }
          } catch (error) {
            console.error('Error fetching customer for log:', error);
          }
        }

        return {
          ...log,
          customer: customerInfo
        };
      })
    );
    
    return NextResponse.json({
      logs: enhancedLogs,
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
