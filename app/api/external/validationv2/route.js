import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Logs API request asynchronously without blocking response
 */
async function logApiRequest(logData, responseStatus, responseBody) {
    try {
        await prisma.apiLog.create({
            data: {
                ...logData,
                responseStatus,
                responseBody: JSON.stringify(responseBody)
            }
        });
    } catch (logError) {
        console.error("Error logging request:", logError);
    }
}

/**
 * Creates a standardized API response
 */
function createStandardResponse(success, valid = null, message, data = null, error = null, status = 200) {
    const responseBody = {
        success,
        message,
        ...(valid !== null && { valid }),
        ...(data && { data }),
        ...(error && { error })
    };
    
    return {
        body: responseBody,
        response: NextResponse.json(responseBody, { status })
    };
}

/**
 * Creates a trial service for external applications
 */
async function createTrialService(deviceToken, serviceName, companyName, terminal, logData = null) {
    // Validate required fields
    if (!deviceToken || !serviceName) {
        const { body, response } = createStandardResponse(
            false, 
            false, 
            'Missing required fields: deviceToken and serviceName are required', 
            null, 
            { code: 'MISSING_REQUIRED_FIELDS', fields: ['deviceToken', 'serviceName'] }, 
            400
        );
        
        // Log asynchronously without blocking
        if (logData) {
            logApiRequest(logData, 400, body);
        }
        
        return response;
    }

    // Validate input lengths
    if (deviceToken.length > 255) {
        const { body, response } = createStandardResponse(
            false, 
            false, 
            'Device token is too long (maximum 255 characters)', 
            null, 
            { code: 'VALIDATION_ERROR', field: 'deviceToken', maxLength: 255 }, 
            400
        );
        
        // Log asynchronously without blocking
        if (logData) {
            logApiRequest(logData, 400, body);
        }
        
        return response;
    }

    if (serviceName.length > 100) {
        const { body, response } = createStandardResponse(
            false, 
            false, 
            'Service name is too long (maximum 100 characters)', 
            null, 
            { code: 'VALIDATION_ERROR', field: 'serviceName', maxLength: 100 }, 
            400
        );
        
        // Log asynchronously without blocking
        if (logData) {
            logApiRequest(logData, 400, body);
        }
        
        return response;
    }

    // Validate company name length if provided
    if (companyName && companyName.length > 100) {
        const { body, response } = createStandardResponse(
            false, 
            false, 
            'Company name is too long (maximum 100 characters)', 
            null, 
            { code: 'VALIDATION_ERROR', field: 'companyName', maxLength: 100 }, 
            400
        );
        
        // Log asynchronously without blocking
        if (logData) {
            logApiRequest(logData, 400, body);
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
            const { body, response } = createStandardResponse(
                true, 
                true, 
                'Service found and is active', 
                {
                    service: {
                        id: existingService.id,
                        name: existingService.name,
                        companyName: existingService.companyName,
                        deviceToken: existingService.deviceToken,
                        startingDate: existingService.startingDate,
                        endingDate: existingService.endingDate,
                        daysRemaining: daysRemaining
                    },
                    serviceType: 'existing',
                    isTrialService: true
                }, 
                null, 
                200
            );
            
            // Update validation type for existing service
            if (logData) {
                logData.validationType = 'Sisteme Giriş';
                logApiRequest(logData, 200, body);
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
            category: "Adisyon Programı",
            paymentType: 'custom',
            periodPrice: 0.0, // Free trial
            currency: 'TL',
            active: true,
            startingDate: startingDate,
            endingDate: endingDate,
            deviceToken: deviceToken,
            terminal: terminal || null,
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

    const { body, response } = createStandardResponse(
        true, 
        true, 
        'Trial service created successfully', 
        {
            service: {
                id: service.id,
                name: service.name,
                companyName: service.companyName,
                deviceToken: service.deviceToken,
                startingDate: service.startingDate,
                endingDate: service.endingDate,
                daysRemaining: 15
            },
            serviceType: 'new',
            isTrialService: true
        }, 
        null, 
        201
    );
    
    // Log asynchronously without blocking
    if (logData) {
        logApiRequest(logData, 201, body);
    }
    
    return response;
}

export async function POST(request) {
    const data = await request.json();
    const { deviceToken, serviceName, companyName, terminal } = data;

    // Validate that deviceToken is provided
    if (!deviceToken) {
        const { body, response } = createStandardResponse(
            false, 
            false, 
            'Device token is required', 
            null, 
            { code: 'MISSING_REQUIRED_FIELD', field: 'deviceToken' }, 
            400
        );
        return response;
    }

    // Get client IP address
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get("x-real-ip") || 'unknown';
    const userAgent = request.headers.get("user-agent") || '';

    let logData = {
        endpoint: '/api/external/validationv2',
        method: 'POST',
        ipAddress,
        userAgent,
        requestBody: JSON.stringify(data),
        serviceName: serviceName || null,
        deviceToken: deviceToken || null,
        validationType: 'Device Token Based' // Will be updated based on response
    };

    try {
        // Look for existing service with this device token
        const service = await prisma.service.findFirst({
            where: { deviceToken: deviceToken },
        });

        if (!service) {
            // No service found with this device token, create a trial service
            logData.validationType = 'Trial';
            return await createTrialService(deviceToken, serviceName, companyName, terminal, logData);
        }

        // Service found, perform system login validation (Sisteme Giriş)
        logData.validationType = 'Sisteme Giriş';

        // Check if service is active first
        if (!service.active) {
            const { body, response } = createStandardResponse(
                true, 
                false, 
                'Service is inactive', 
                {
                    service: {
                        id: service.id,
                        name: service.name,
                        companyName: service.companyName,
                        deviceToken: service.deviceToken,
                        startingDate: service.startingDate,
                        endingDate: service.endingDate,
                        active: service.active
                    },
                    serviceType: 'existing',
                    isTrialService: false
                }, 
                { code: 'SERVICE_INACTIVE' }, 
                403
            );
            
            // Log asynchronously without blocking
            logApiRequest(logData, 403, body);
            
            return response;
        }

        const today = new Date();
        const endDate = new Date(service.endingDate);

        if (endDate <= today) {
            const { body, response } = createStandardResponse(
                true, 
                false, 
                'Service has expired', 
                {
                    service: {
                        id: service.id,
                        name: service.name,
                        companyName: service.companyName,
                        deviceToken: service.deviceToken,
                        startingDate: service.startingDate,
                        endingDate: service.endingDate,
                        daysRemaining: 0
                    },
                    serviceType: 'existing',
                    isTrialService: false
                }, 
                { code: 'SERVICE_EXPIRED', expiredDate: service.endingDate }, 
                400
            );
            
            // Log asynchronously without blocking
            logApiRequest(logData, 400, body);
            
            return response;
        }

        // Service is valid, update optional fields if provided
        const updateData = {};
        let needsUpdate = false;
        
        if (serviceName && service.name !== serviceName) {
            updateData.name = serviceName;
            needsUpdate = true;
        }
        
        if (companyName && service.companyName !== companyName) {
            updateData.companyName = companyName;
            needsUpdate = true;
        }
        
        if (terminal && service.terminal !== terminal) {
            updateData.terminal = terminal;
            needsUpdate = true;
        }
        
        // Update service if there are changes
        if (needsUpdate) {
            await prisma.service.update({
                where: { id: service.id },
                data: updateData,
            });
        }
        
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        const { body, response } = createStandardResponse(
            true, 
            true, 
            'Service is valid and active', 
            {
                service: {
                    id: service.id,
                    name: serviceName || service.name,
                    companyName: companyName || service.companyName,
                    deviceToken: service.deviceToken,
                    startingDate: service.startingDate,
                    endingDate: service.endingDate,
                    daysRemaining: daysRemaining
                },
                serviceType: 'existing',
                isTrialService: false,
                ...(needsUpdate && { updated: true })
            }, 
            null, 
            200
        );
        
        // Log asynchronously without blocking
        logApiRequest(logData, 200, body);
        
        return response;

    } catch (error) {
        console.error("Error during validation:", error);
        
        // Handle specific Prisma errors for trial service creation
        if (error.code === 'P2002') {
            const { body, response } = createStandardResponse(
                false, 
                false, 
                'A service with this device token already exists', 
                null, 
                { code: 'DUPLICATE_SERVICE', prismaCode: 'P2002' }, 
                409
            );
            
            // Log asynchronously without blocking
            logApiRequest(logData, 409, body);
            
            return response;
        }

        const { body, response } = createStandardResponse(
            false, 
            false, 
            'Internal Server Error', 
            null, 
            { code: 'INTERNAL_ERROR', details: error.message }, 
            500
        );
        
        // Log asynchronously without blocking
        logApiRequest(logData, 500, body);
        
        return response;
    }
}
