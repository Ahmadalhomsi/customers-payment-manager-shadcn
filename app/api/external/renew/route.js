import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file

export async function POST(request) {
    const data = await request.json();
    const { email, password, token, renewPassword } = data;
    try {
        if (renewPassword != process.env.renewPassword)
            return NextResponse.json({ error: "Invalid renew password" }, { status: 401 });

        const customer = await prisma.customer.findUnique({
            where: { email: email, password: password },
        });

        if (!customer) {
            console.log("Customer not found");
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        } else {
            const newService = await prisma.service.findUnique({
                where: { id: token },
            });

            if (!newService) {
                console.log("Service not found");
                return NextResponse.json({ error: "Service not found" }, { status: 404 });
            } else {

                const today = new Date();
                const endDate = new Date(newService.endingDate);

                if (endDate <= today) { // Service end date is today or in the past
                    const today = new Date();
                    const newEndDate = new Date(today.setFullYear(today.getFullYear() + 1));

                    const updatedService = await prisma.service.update({
                        where: { id: token },
                        data: { endingDate: newEndDate },
                    });

                    return NextResponse.json({ token: token, newEndDate: updatedService.endingDate }, { status: 200 });
                }
                else {
                    console.log("Service already valid");
                    return NextResponse.json({ valid: true, endingDate: newService.endingDate }, { status: 200 });
                }

            }
        }
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
