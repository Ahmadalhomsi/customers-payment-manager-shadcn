import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isBefore, differenceInDays, subDays } from 'date-fns';

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function GET(req) {
    try {
        // Optional: Add authorization check here
        // const authHeader = req.headers.get('authorization');
        // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const today = new Date();
        const services = await prisma.service.findMany({
            where: {
                active: true,
                paymentType: {
                    not: 'unlimited' // Skip unlimited services
                },
                // Exclude "Demo" / "Trial" services as requested
                customer: {
                    name: {
                        not: 'Trial Customer'
                    }
                },
                description: {
                    not: {
                        startsWith: 'Trial service'
                    }
                }
            },
            include: {
                customer: {
                    select: {
                        name: true
                    }
                }
            }
        });

        let newNotifications = 0;
        const results = [];

        for (const service of services) {
            const endDate = new Date(service.endingDate);
            const daysRemaining = differenceInDays(endDate, today);

            // 1. Check for Expired Services
            // Logic: Service is expired AND we haven't created a "Süresi Doldu" notification in the last 60 days.
            // This 60-day window ensures that if a service is renewed and expires again next year, we get a new notification.
            // It also prevents spamming if the cron runs multiple times.
            if (isBefore(endDate, today)) {
                const existingNotification = await prisma.notifications.findFirst({
                    where: {
                        title: {
                            contains: `Hizmet Süresi Doldu`
                        },
                        message: {
                            contains: service.name
                        },
                        createdAt: {
                            gte: subDays(today, 60)
                        }
                    }
                });

                if (!existingNotification) {
                    await prisma.notifications.create({
                        data: {
                            title: `Hizmet Süresi Doldu: ${service.name}`,
                            message: `${service.customer.name} müşterisine ait ${service.name} hizmetinin süresi dolmuştur. Lütfen yenileyiniz.`,
                            type: 'error',
                        }
                    });
                    newNotifications++;
                    results.push({ service: service.name, status: 'expired' });
                }
            }
            // 2. Check for Upcoming Services (Ending in 7 days or less, but not expired)
            else if (daysRemaining <= 7 && daysRemaining >= 0) {
                // Check if we notified about this recently (in the last 6 days)
                // This ensures we notify roughly once a week for upcoming services
                const existingNotification = await prisma.notifications.findFirst({
                    where: {
                        title: {
                            contains: `Yaklaşan Hizmet`
                        },
                        message: {
                            contains: service.name
                        },
                        createdAt: {
                            gte: subDays(today, 6)
                        }
                    }
                });

                if (!existingNotification) {
                    await prisma.notifications.create({
                        data: {
                            title: `Yaklaşan Hizmet: ${service.name}`,
                            message: `${service.customer.name} müşterisine ait ${service.name} hizmetinin süresi ${daysRemaining === 0 ? 'bugün' : daysRemaining + ' gün içinde'} dolacaktır.`,
                            type: 'warning',
                        }
                    });
                    newNotifications++;
                    results.push({ service: service.name, status: 'upcoming', days: daysRemaining });
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: services.length,
            newNotifications,
            details: results
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
