import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addYears, subWeeks } from 'date-fns';

// Password validation function
const validatePassword = (password) => {
    const errors = [];

    if (!password) {
        errors.push("Şifre boş olamaz");
        return errors;
    }

    if (password.length < 8) {
        errors.push("En az 8 karakter olmalıdır");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("En az bir büyük harf");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("En az bir küçük harf");
    }

    if (!/[0-9]/.test(password)) {
        errors.push("En az bir rakam");
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("En az bir özel karakter");
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
            error: 'Şifre doğrulaması başarısız oldu',
            details: passwordErrors
        }, { status: 400 });
    }

    // Check for existing email
    const existingCustomer = await prisma.customer.findUnique({
        where: { email }
    });

    if (existingCustomer) {
        return NextResponse.json({
            error: 'Bu e-posta adresi zaten kullanımda'
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
                name: 'Default Hizmet',
                description: 'API ile otomatik oluşturulan hizmet',
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
                message: "Hizmetinizin bitmesine bir hafta kaldı! Kesinti yaşamamak için lütfen yenileyin.",
                serviceID: newService.id,
            },
        });

        await prisma.notifications.create({
            data: {
                title: 'API ile Yeni Müşteri Oluşturuldu',
                message: `Yeni müşteri ${customerName} e-posta ${email} ile oluşturuldu`,
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