import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function GET(req) {
    try {
        // Optional: Add authorization check here
        // const authHeader = req.headers.get('authorization');
        // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const TIMEZONE = 'Europe/Istanbul';

        // 1. Get Current Time in Istanbul
        const now = new Date();
        const todayInIstanbul = toZonedTime(now, TIMEZONE);
        
        // Normalize today to start of day (00:00:00) in Istanbul time
        // We create a new date using the year, month, day from the zoned time
        const today = new Date(todayInIstanbul.getFullYear(), todayInIstanbul.getMonth(), todayInIstanbul.getDate());

        const services = await prisma.service.findMany({
            where: {
                active: true,
                paymentType: {
                    not: 'unlimited' // Skip unlimited services
                },
                // Keep explicit exclusions for safety
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
            // 2. Convert Service End Date to Istanbul Time
            // The service.endingDate is stored as UTC in DB (e.g. 2026-02-27T00:00:00.000Z)
            // We need to treat this date as if it's in Istanbul time or convert it properly.
            // Assuming the date stored in DB is meant to be the end date at 00:00 UTC, 
            // we should compare calendar days to avoid timezone shift issues.
            
            const serviceEndDate = new Date(service.endingDate);
            const endDateInIstanbul = toZonedTime(serviceEndDate, TIMEZONE);
            
            // Normalize end date to start of day (00:00:00) in local time
            const endDate = new Date(endDateInIstanbul.getFullYear(), endDateInIstanbul.getMonth(), endDateInIstanbul.getDate());

            // 3. Calculate Days Remaining using Calendar Days
            // differenceInCalendarDays calculates the number of full days between two dates,
            // ignoring the time component, which is exactly what we want for "Due Date" logic.
            const daysRemaining = differenceInCalendarDays(endDate, today);

            let status = 'active';
            let action = 'none';

            // 1. Check for Services Ending TODAY
            if (daysRemaining === 0) {
                status = 'expires_today';
                
                // Check if we already notified TODAY about this
                // We must look for ANY notification for this service created today
                const existingNotification = await prisma.notifications.findFirst({
                    where: {
                        OR: [
                            { title: { contains: `Bugün Sona Eriyor` } },
                            { title: { contains: `Hizmet Süresi Doldu` } }
                        ],
                        message: {
                            contains: service.name
                        },
                        createdAt: {
                            gte: today // Created today (in local time logic)
                        }
                    }
                });

                if (!existingNotification) {
                    await prisma.notifications.create({
                        data: {
                            title: `Bugün Sona Eriyor: ${service.name}`,
                            message: `${service.customer.name} müşterisine ait ${service.name} hizmetinin süresi BUGÜN doluyor.`,
                            type: 'error', // High priority (Red)
                        }
                    });
                    newNotifications++;
                    action = 'created_today_notification';
                } else {
                    action = 'skipped_already_notified_today';
                }
            }
            // 2. Check for Services Ending TOMORROW (1 Day Left)
            else if (daysRemaining === 1) {
                status = 'expires_tomorrow';
                
                const existingNotification = await prisma.notifications.findFirst({
                    where: {
                        title: {
                            contains: `Yarın Sona Eriyor`
                        },
                        message: {
                            contains: service.name
                        },
                        createdAt: {
                            gte: today // Created today
                        }
                    }
                });

                if (!existingNotification) {
                    await prisma.notifications.create({
                        data: {
                            title: `Yarın Sona Eriyor: ${service.name}`,
                            message: `${service.customer.name} müşterisine ait ${service.name} hizmetinin süresi YARIN doluyor.`,
                            type: 'warning', // High priority warning
                        }
                    });
                    newNotifications++;
                    action = 'created_tomorrow_notification';
                } else {
                    action = 'skipped_already_notified_today';
                }
            }
            // 3. Check for Upcoming Services (Exactly 16 days left)
            else if (daysRemaining === 16) {
                status = 'upcoming_16_days';
                
                const existingNotification = await prisma.notifications.findFirst({
                    where: {
                        title: {
                            contains: `Yaklaşan Hizmet`
                        },
                        message: {
                            contains: service.name
                        },
                        createdAt: {
                            gte: today // Created today
                        }
                    }
                });

                if (!existingNotification) {
                    await prisma.notifications.create({
                        data: {
                            title: `Yaklaşan Hizmet: ${service.name}`,
                            message: `${service.customer.name} müşterisine ait ${service.name} hizmetinin süresi 16 gün içinde dolacaktır.`,
                            type: 'warning',
                        }
                    });
                    newNotifications++;
                    action = 'created_upcoming_notification';
                } else {
                    action = 'skipped_already_notified_today';
                }
            }

            // Log details for debugging/verification if something happened or it matched our criteria
            if (status !== 'active' || daysRemaining <= 16) {
                results.push({
                    service: service.name,
                    customer: service.customer.name,
                    endDateRaw: service.endingDate,
                    endDateLocal: endDate.toLocaleDateString('tr-TR'),
                    todayLocal: today.toLocaleDateString('tr-TR'),
                    daysRemaining,
                    status,
                    action
                });
            }
        }

        return NextResponse.json({
            success: true,
            timezone: TIMEZONE,
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
