import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Creates a trial service for external applications
 */
async function createTrialService(deviceToken, serviceName, companyName, category) {
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

    // Validate category if provided
    const validCategories = [
        "Adisyon Programı",
        "QR Menu", 
        "Kurye Uygulaması",
        "Patron Uygulaması",
        "Yemek Sepeti",
        "Migros Yemek",
        "Trendyol Yemek",
        "Getir Yemek"
    ];
    
    if (category && !validCategories.includes(category)) {
        return NextResponse.json(
            { error: 'Invalid category. Must be one of: ' + validCategories.join(', ') },
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
                valid: true,
                existingService: true,
                service: {
                    id: existingService.id,
                    name: existingService.name,
                    endingDate: existingService.endingDate,
                    daysRemaining: daysRemaining
                }
            }, { status: 200 });
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
            category: category || "Adisyon Programı",
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
        valid: true,
        newTrialService: true,
        service: {
            id: service.id,
            name: service.name,
            companyName: service.companyName,
            category: service.category,
            startingDate: service.startingDate,
            endingDate: service.endingDate,
            deviceToken: service.deviceToken,
            trialDaysRemaining: 15
        }
    }, { status: 201 });
}

export async function POST(request) {
    const data = await request.json();
    const { token, deviceToken, serviceName, companyName, category } = data;

    try {
        // If no token is provided, create a trial service
        if (!token) {
            return await createTrialService(deviceToken, serviceName, companyName, category);
        }

        const service = await prisma.service.findUnique({
            where: { id: token },
        });

        if (!service) {
            console.log("Service not found");
            return NextResponse.json({ valid: false, message: "Service not found" });
        }

        // Check if service is active first
        if (!service.active) {
            return NextResponse.json({
                valid: false,
                message: "Service is inactive",
            }, { status: 403 });
        }

        const today = new Date();
        const endDate = new Date(service.endingDate);

        if (endDate <= today) {
            return NextResponse.json({
                valid: false,
                message: "Service has expired",
                endingDate: service.endingDate,
            }, { status: 400 });
        }

        if (!service.deviceToken) {
            // Set the device token
            await prisma.service.update({
                where: { id: token },
                data: {
                    deviceToken,
                    name: serviceName,
                },
            });

            return NextResponse.json({
                valid: true,
                newDeviceTokenSet: true,
                endingDate: service.endingDate,
            }, { status: 200 });
        } else if (service.deviceToken !== deviceToken) {
            return NextResponse.json({
                valid: false,
                message: "Device token mismatch",
            }, { status: 403 });
        } else {
            return NextResponse.json({
                valid: true,
                endingDate: service.endingDate,
            }, { status: 200 });
        }

    } catch (error) {
        console.error("Error during validation:", error);
        
        // Handle specific Prisma errors for trial service creation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A service with this name already exists for this customer' },
                { status: 409 }
            );
        }

        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error.message 
        }, { status: 500 });
    }
}
