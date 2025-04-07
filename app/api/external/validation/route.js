import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    const data = await request.json();
    const { token, deviceToken, serviceName } = data;

    try {
        const service = await prisma.service.findUnique({
            where: { id: token },
        });

        if (!service) {
            console.log("Service not found");
            return NextResponse.json({ valid: false, message: "Service not found" }, { status: 404 });
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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
