import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file

export async function POST(request) {
    const data = await request.json();
    const { token } = data;
    try {

        const newService = await prisma.service.findUnique({
            where: { id: token },
        });

        if (!newService) {
            console.log("Service not found");
            return NextResponse.json({ valid: false }, { status: 404 });
        } else {
            const today = new Date();
            const endDate = new Date(newService.endingDate);

            if (endDate <= today) { // Service end date is today or in the past
                console.log("Service has already ended");
                return NextResponse.json({ valid: false, endingDate: newService.endingDate }, { status: 400 });
            }
            else {
                return NextResponse.json({ valid: true, endingDate: newService.endingDate }, { status: 200 });
            }
        }
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
