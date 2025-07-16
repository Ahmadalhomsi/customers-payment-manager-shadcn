import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Creates a trial service for external applications
 */
async function createTrialService(deviceToken, serviceName, companyName, category, logData = null) {
    // Validate required fields
    if (!deviceToken || !serviceName) {
        const response = NextResponse.json(
            { error: 'Missing required fields: deviceToken and serviceName are required' },
            { status: 400 }
        );
        
        // Log the request if logData is provided
        if (logData) {
            try {
                await prisma.apiLog.create({
                    data: {
                        ...logData,
                        responseStatus: 400,
                        responseBody: JSON.stringify({ error: 'Missing required fields: deviceToken and serviceName are required' })
                    }
                });
            } catch (logError) {
                console.error("Error logging request:", logError);
            }
        }
        
        return response;
    }

    // Validate input lengths
    if (deviceToken.length > 255) {
        const response = NextResponse.json(
            { error: 'Device token is too long (maximum 255 characters)' },
            { status: 400 }
        );
        
        // Log the request if logData is provided
        if (logData) {
            try {
                await prisma.apiLog.create({
                    data: {
                        ...logData,
                        responseStatus: 400,
                        responseBody: JSON.stringify({ error: 'Device token is too long (maximum 255 characters)' })
                    }
                });
            } catch (logError) {
                console.error("Error logging request:", logError);
            }
        }
        
        return response;
    }

    if (serviceName.length > 100) {
        const response = NextResponse.json(
            { error: 'Service name is too long (maximum 100 characters)' },
            { status: 400 }
        );
        
        // Log the request if logData is provided
        if (logData) {
            try {
                await prisma.apiLog.create({
                    data: {
                        ...logData,
                        responseStatus: 400,
                        responseBody: JSON.stringify({ error: 'Service name is too long (maximum 100 characters)' })
                    }
                });
            } catch (logError) {
                console.error("Error logging request:", logError);
            }
        }
        
        return response;
    }

    // Validate company name length if provided
    if (companyName && companyName.length > 100) {
        const response = NextResponse.json(
            { error: 'Company name is too long (maximum 100 characters)' },
            { status: 400 }
        );
        
        // Log the request if logData is provided
        if (logData) {
            try {
                await prisma.apiLog.create({
                    data: {
                        ...logData,
                        responseStatus: 400,
                        responseBody: JSON.stringify({ error: 'Company name is too long (maximum 100 characters)' })
                    }
                });
            } catch (logError) {
                console.error("Error logging request:", logError);
            }
        }
        
        return response;
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
        const response = NextResponse.json(
            { error: 'Invalid category. Must be one of: ' + validCategories.join(', ') },
            { status: 400 }
        );
        
        // Log the request if logData is provided
        if (logData) {
            try {
                await prisma.apiLog.create({
                    data: {
                        ...logData,
                        responseStatus: 400,
                        responseBody: JSON.stringify({ error: 'Invalid category. Must be one of: ' + validCategories.join(', ') })
                    }
                });
            } catch (logError) {
                console.error("Error logging request:", logError);
            }
        }
        
        return response;
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
            const response = NextResponse.json({
                valid: true,
                existingService: true,
                service: {
                    id: existingService.id,
                    name: existingService.name,
                    endingDate: existingService.endingDate,
                    daysRemaining: daysRemaining
                }
            }, { status: 200 });
            
            // Log the request if logData is provided
            if (logData) {
                try {
                    await prisma.apiLog.create({
                        data: {
                            ...logData,
                            responseStatus: 200,
                            responseBody: JSON.stringify({
                                valid: true,
                                existingService: true,
                                service: {
                                    id: existingService.id,
                                    name: existingService.name,
                                    endingDate: existingService.endingDate,
                                    daysRemaining: daysRemaining
                                }
                            })
                        }
                    });
                } catch (logError) {
                    console.error("Error logging request:", logError);
                }
            }
            
            return response;
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

    const response = NextResponse.json({
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
    
    // Log the request if logData is provided
    if (logData) {
        try {
            await prisma.apiLog.create({
                data: {
                    ...logData,
                    responseStatus: 201,
                    responseBody: JSON.stringify({
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
                    })
                }
            });
        } catch (logError) {
            console.error("Error logging request:", logError);
        }
    }
    
    return response;
}

export async function POST(request) {
    const data = await request.json();
    const { token, deviceToken, serviceName, companyName, category } = data;

    // Get client IP address
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get("x-real-ip") || 'unknown';
    const userAgent = request.headers.get("user-agent") || '';

    let logData = {
        endpoint: '/api/external/validation',
        method: 'POST',
        ipAddress,
        userAgent,
        requestBody: JSON.stringify(data),
        serviceName: serviceName || null,
        deviceToken: deviceToken || null
    };

    try {
        // If no token is provided, create a trial service
        if (!token) {
            return await createTrialService(deviceToken, serviceName, companyName, category, logData);
        }

        const service = await prisma.service.findUnique({
            where: { id: token },
        });

        if (!service) {
            console.log("Service not found");
            const response = NextResponse.json({ valid: false, message: "Service not found" });
            
            // Log the request
            await prisma.apiLog.create({
                data: {
                    ...logData,
                    responseStatus: 200,
                    responseBody: JSON.stringify({ valid: false, message: "Service not found" })
                }
            });
            
            return response;
        }

        // Check if service is active first
        if (!service.active) {
            const response = NextResponse.json({
                valid: false,
                message: "Service is inactive",
            }, { status: 403 });
            
            // Log the request
            await prisma.apiLog.create({
                data: {
                    ...logData,
                    responseStatus: 403,
                    responseBody: JSON.stringify({ valid: false, message: "Service is inactive" })
                }
            });
            
            return response;
        }

        const today = new Date();
        const endDate = new Date(service.endingDate);

        if (endDate <= today) {
            const response = NextResponse.json({
                valid: false,
                message: "Service has expired",
                endingDate: service.endingDate,
            }, { status: 400 });
            
            // Log the request
            await prisma.apiLog.create({
                data: {
                    ...logData,
                    responseStatus: 400,
                    responseBody: JSON.stringify({ valid: false, message: "Service has expired", endingDate: service.endingDate })
                }
            });
            
            return response;
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

            const response = NextResponse.json({
                valid: true,
                newDeviceTokenSet: true,
                endingDate: service.endingDate,
            }, { status: 200 });
            
            // Log the request
            await prisma.apiLog.create({
                data: {
                    ...logData,
                    responseStatus: 200,
                    responseBody: JSON.stringify({ valid: true, newDeviceTokenSet: true, endingDate: service.endingDate })
                }
            });
            
            return response;
        } else if (service.deviceToken !== deviceToken) {
            const response = NextResponse.json({
                valid: false,
                message: "Device token mismatch",
            }, { status: 403 });
            
            // Log the request
            await prisma.apiLog.create({
                data: {
                    ...logData,
                    responseStatus: 403,
                    responseBody: JSON.stringify({ valid: false, message: "Device token mismatch" })
                }
            });
            
            return response;
        } else {
            const response = NextResponse.json({
                valid: true,
                endingDate: service.endingDate,
            }, { status: 200 });
            
            // Log the request
            await prisma.apiLog.create({
                data: {
                    ...logData,
                    responseStatus: 200,
                    responseBody: JSON.stringify({ valid: true, endingDate: service.endingDate })
                }
            });
            
            return response;
        }

    } catch (error) {
        console.error("Error during validation:", error);
        
        // Handle specific Prisma errors for trial service creation
        if (error.code === 'P2002') {
            const response = NextResponse.json(
                { error: 'A service with this name already exists for this customer' },
                { status: 409 }
            );
            
            // Log the request
            try {
                await prisma.apiLog.create({
                    data: {
                        ...logData,
                        responseStatus: 409,
                        responseBody: JSON.stringify({ error: 'A service with this name already exists for this customer' })
                    }
                });
            } catch (logError) {
                console.error("Error logging request:", logError);
            }
            
            return response;
        }

        const response = NextResponse.json({ 
            error: "Internal Server Error", 
            details: error.message 
        }, { status: 500 });
        
        // Log the request
        try {
            await prisma.apiLog.create({
                data: {
                    ...logData,
                    responseStatus: 500,
                    responseBody: JSON.stringify({ error: "Internal Server Error", details: error.message })
                }
            });
        } catch (logError) {
            console.error("Error logging request:", logError);
        }
        
        return response;
    }
}
