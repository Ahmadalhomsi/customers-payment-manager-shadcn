import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addYears, subWeeks } from 'date-fns';

// Password validation function
const validatePassword = (password) => {
    const errors = [];

    if (!password) {
        errors.push("Password cannot be empty");
        return errors;
    }

    if (password.length < 8) {
        errors.push("Must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("Must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("Must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
        errors.push("Must contain at least one number");
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("Must contain at least one special character");
    }

    return errors;
};

export async function POST(request) {
    const data = await request.json();
    const { token, customerName, email, password, phone } = data;

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        return NextResponse.json({
            error: 'Password validation failed',
            details: passwordErrors
        }, { status: 400 });
    }

    // Check for existing email
    const existingCustomer = await prisma.customer.findUnique({
        where: { email }
    });

    if (existingCustomer) {
        return NextResponse.json({
            error: 'This email address is already in use'
        }, { status: 409 });
    }

    try {
        const customer = await prisma.customer.create({
            data: {
                name: customerName,
                email,
                password: password,
                phone
            },
        });

        // Rest of the existing code remains the same...
        const startingDate = new Date();
        const endingDate = addYears(startingDate, 1);

        const newService = await prisma.service.create({
            data: {
                id: token,
                customerID: customer.id,
                name: 'Default Service',
                description: 'Service automatically created via API',
                periodPrice: 0.0,
                startingDate: startingDate,
                endingDate: endingDate,
                currency: 'TL',
            },
        });

        const reminderDate = subWeeks(endingDate, 1);

        await prisma.reminder.create({
            data: {
                scheduledAt: reminderDate,
                status: "SCHEDULED",
                message: "Your service will expire in one week! Please renew to avoid interruption.",
                serviceID: newService.id,
            },
        });

        await prisma.notifications.create({
            data: {
                title: 'New Customer Created via API',
                message: `New customer ${customerName} created with email ${email}`,
                type: 'success',
                read: false,
            },
        });

        return NextResponse.json({ token: newService.id, endingDate }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}