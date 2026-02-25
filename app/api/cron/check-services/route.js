import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isBefore, differenceInDays, subDays, startOfDay, isSameDay } from 'date-fns';

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function GET(req) {
    try {
        // Optional: Add authorization check here
        // const authHeader = req.headers.get('authorization');
        // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // Normalize today to start of day (00:00:00) for consistent comparison
        const today = startOfDay(new Date());
        
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
            // Normalize service end date to start of day
            const endDate = startOfDay(new Date(service.endingDate));
            const daysRemaining = differenceInDays(endDate, today);

            let status = 'active';
            let action = 'none';

            // 1. Check for Expired Services (Yesterday or before)
            if (isBefore(endDate, today)) {
                status = 'expired';
                
                // Check if we already notified about expiration recently (last 30 days)
                // Reduced from 60 to 30 to be more responsive if needed, but still prevent spam
                const existingNotification = await prisma.notifications.findFirst({
                    where: {
                        title: {
                            contains: `Hizmet Süresi Doldu`
                        },
                        message: {
                            contains: service.name
                        },
                        createdAt: {
                            gte: subDays(today, 30)
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
                    action = 'created_expired_notification';
                } else {
                    action = 'skipped_already_notified_expired';
                }
            }
            // 2. Check for Services Ending TODAY (Priority)
            else if (isSameDay(endDate, today)) {
                status = 'expires_today';
                
                // Check if we already notified TODAY about this
                const existingNotification = await prisma.notifications.findFirst({
                    where: {
                        title: {
                            contains: `Bugün Sona Eriyor`
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
            // 3. Check for Upcoming Services (Tomorrow to 7 days)
            else if (daysRemaining <= 7 && daysRemaining > 0) {
                status = 'upcoming';
                
                // Check if we notified about this recently (in the last 5 days)
                // This ensures we notify roughly once a week, but resets if we enter the "today" zone
                const existingNotification = await prisma.notifications.findFirst({
                    where: {
                        title: {
                            contains: `Yaklaşan Hizmet`
                        },
                        message: {
                            contains: service.name
                        },
                        createdAt: {
                            gte: subDays(today, 5)
                        }
                    }
                });

                if (!existingNotification) {
                    await prisma.notifications.create({
                        data: {
                            title: `Yaklaşan Hizmet: ${service.name}`,
                            message: `${service.customer.name} müşterisine ait ${service.name} hizmetinin süresi ${daysRemaining} gün içinde dolacaktır.`,
                            type: 'warning',
                        }
                    });
                    newNotifications++;
                    action = 'created_upcoming_notification';
                } else {
                    action = 'skipped_already_notified_upcoming';
                }
            }

            // Log details for debugging/verification
            if (status !== 'active' || action !== 'none') {
                results.push({
                    service: service.name,
                    customer: service.customer.name,
                    endDate: endDate.toISOString().split('T')[0],
                    daysRemaining,
                    status,
                    action
                });
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
