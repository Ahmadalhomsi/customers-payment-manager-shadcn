// model Service {
//     id          String @id @default(cuid())
//     name        String
//     description String
//     paymentType String  @default("Yearly") // Monthly, Yearly
//     periodPrice Float
//     currency    String @default("TL")

//     startingDate DateTime
//     endingDate   DateTime

//     // Relations
//     customerID String
//     customer   Customer   @relation("CustomerToService", fields: [customerID], references: [id], onDelete: Cascade)
//     reminders  Reminder[]

//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt
//   }

//   model Reminder {
//     id          String         @id @default(cuid())
//     scheduledAt DateTime
//     status      ReminderStatus @default(SCHEDULED)
//     paid        Boolean        @default(false)
//     message     String?

//     // Relations
//     serviceID String
//     service   Service @relation(fields: [serviceID], references: [id])

//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt
//   }

//   enum ReminderStatus {
//     SCHEDULED
//     SENT
//     CANCELED
//     FAILED
//   }

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Import the prisma instance from the file

export async function POST() {
    const data = await request.json()
    const { customerName, password } = data;

    try {
        const customer = await prisma.customer.findUnique({
            where: { customerName: customerName, password: password },
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        } else {
            const endingDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // 1 year later

            const newService = await prisma.service.create({
                data: {
                    customerID: customer.id,
                    name: 'Default Service',
                    description: 'New Service Description',
                    periodPrice: 99,
                    startingDate: new Date(),
                    endingDate: endingDate, // 1 year later
                    currency: 'TL',
                },
            });

            const newReminder = await prisma.reminder.create({
                data: {
                    serviceID: newService.id,
                    scheduledAt: endingDate, // 1 year later
                    status: 'SCHEDULED',
                    paid: false,
                    message: 'Reminder for service renewal',
                },
            });
        }
        return NextResponse.json(customer, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }
}
