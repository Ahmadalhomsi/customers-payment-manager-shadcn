import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * External API endpoint for creating trial services
 * 
 * @route POST /api/external/new
 * @description Creates a 15-day trial service for external applications
 * @param {string} deviceToken - The device token for the service
 * @param {string} serviceName - The name of the service to create
 * @param {string} companyName - Optional company name for the service
 * 
 * @returns {Object} Response object containing:
 * - success: boolean indicating if the operation was successful
 * - service: object containing service details (id, name, dates, deviceToken, trialDaysRemaining)
 * 
 * @example
 * POST /api/external/new
 * Body: {
 *   "deviceToken": "abc123xyz",
 *   "serviceName": "My Mobile App",
 *   "companyName": "My Company Inc."
 * }
 * 
 * Response: {
 *   "success": true,
 *   "service": {
 *     "id": "clxxxxx",
 *     "name": "My Mobile App",
 *     "startingDate": "2025-07-15T10:00:00.000Z",
 *     "endingDate": "2025-07-30T10:00:00.000Z",
 *     "deviceToken": "abc123xyz",
 *     "trialDaysRemaining": 15
 *   }
 * }
 */
export async function POST(req) {
    try {
        const data = await req.json();
        const { deviceToken, serviceName, companyName } = data;

        // Validate required fields
        if (!deviceToken || !serviceName) {
            return NextResponse.json(
                { error: 'Missing required fields: deviceToken and serviceName are required' },
                { status: 400 }
            );
        }

        // Validate input lengths
        if (deviceToken.length > 255) {
            return NextResponse.json(
                { error: 'Device token is too long (maximum 255 characters)' },
                { status: 400 }
            );
        }

        if (serviceName.length > 100) {
            return NextResponse.json(
                { error: 'Service name is too long (maximum 100 characters)' },
                { status: 400 }
            );
        }

        // Validate company name length if provided
        if (companyName && companyName.length > 100) {
            return NextResponse.json(
                { error: 'Company name is too long (maximum 100 characters)' },
                { status: 400 }
            );
        }

        // Check if a service with the same name and device token already exists
        const existingService = await prisma.service.findFirst({
            where: {
                name: serviceName,
                deviceToken: deviceToken
            }
        });

        if (existingService) {
            // Check if the existing service is still active
            const now = new Date();
            const endDate = new Date(existingService.endingDate);

            if (endDate > now) {
                // Service is still active
                const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return NextResponse.json({
                    error: 'Service already exists and is still active',
                    existingService: {
                        id: existingService.id,
                        name: existingService.name,
                        endingDate: existingService.endingDate,
                        daysRemaining: daysRemaining
                    }
                }, { status: 409 });
            }
        }

        // Find or create a trial customer
        let trialCustomer = await prisma.customer.findFirst({
            where: {
                name: 'Trial Customer'
            }
        });

        // If no trial customer exists, create one
        if (!trialCustomer) {
            trialCustomer = await prisma.customer.create({
                data: {
                    name: 'Trial Customer',
                    email: 'trial@example.com',
                    phone: '000-000-0000',
                    password: 'trial123456'
                }
            });
        }

        // Calculate dates for 15-day trial
        const startingDate = new Date();
        const endingDate = new Date();
        endingDate.setDate(startingDate.getDate() + 15); // Add 15 days

        // Create the trial service
        const service = await prisma.service.create({
            data: {
                name: serviceName,
                description: `Trial service - 15 days from ${startingDate.toDateString()}`,
                companyName: companyName || null,
                paymentType: 'custom',
                periodPrice: 0.0, // Free trial
                currency: 'TL',
                active: true,
                startingDate: startingDate,
                endingDate: endingDate,
                deviceToken: deviceToken,
                customerID: trialCustomer.id
            }
        });

        // Create a reminder for 2 days before trial expires
        const reminderDate = new Date(endingDate);
        reminderDate.setDate(reminderDate.getDate() - 2); // 2 days before expiry

        await prisma.reminder.create({
            data: {
                scheduledAt: reminderDate,
                status: 'SCHEDULED',
                message: `Your trial service "${serviceName}" will expire in 2 days. Please upgrade to continue using the service.`,
                serviceID: service.id
            }
        });

        return NextResponse.json({
            success: true,
            service: {
                id: service.id,
                name: service.name,
                companyName: service.companyName,
                startingDate: service.startingDate,
                endingDate: service.endingDate,
                deviceToken: service.deviceToken,
                trialDaysRemaining: 15
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Trial service creation error:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A service with this name already exists for this customer' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create trial service', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET method to check existing trial services by device token
 * 
 * @route GET /api/external/new?deviceToken=abc123
 * @description Retrieves existing trial services for a device token
 * @param {string} deviceToken - Query parameter for the device token
 * 
 * @returns {Object} Response object containing existing services for the device
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceToken = searchParams.get('deviceToken');

        if (!deviceToken) {
            return NextResponse.json(
                { error: 'Missing deviceToken query parameter' },
                { status: 400 }
            );
        }

        // Find all services with this device token
        const existingServices = await prisma.service.findMany({
            where: {
                deviceToken: deviceToken
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate remaining trial days for each service
        const servicesWithTrialInfo = existingServices.map(service => {
            const now = new Date();
            const endDate = new Date(service.endingDate);
            const startDate = new Date(service.startingDate);

            const totalTrialDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            const isActive = now >= startDate && now <= endDate;
            const isExpired = now > endDate;

            return {
                id: service.id,
                name: service.name,
                description: service.description,
                companyName: service.companyName,
                startingDate: service.startingDate,
                endingDate: service.endingDate,
                deviceToken: service.deviceToken,
                customer: service.customer,
                totalTrialDays,
                daysRemaining,
                isActive,
                isExpired,
                status: isExpired ? 'expired' : isActive ? 'active' : 'upcoming'
            };
        });

        return NextResponse.json({
            success: true,
            deviceToken,
            services: servicesWithTrialInfo,
            totalServices: existingServices.length
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching trial services:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trial services', details: error.message },
            { status: 500 }
        );
    }
}
