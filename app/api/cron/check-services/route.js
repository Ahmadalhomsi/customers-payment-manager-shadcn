import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { differenceInDays, startOfDay, isSameDay } from 'date-fns';

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
            // Normalize service end date to start of day
            const endDate = startOfDay(new Date(service.endingDate));
            const daysRemaining = differenceInDays(endDate, today);

            let status = 'active';
            let action = 'none';

            // 1. Check for Services Ending TODAY
            if (isSameDay(endDate, today)) {
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
            // 2. Check for Services Ending TOMORROW (1 Day Left)
            else if (daysRemaining === 1) {
                status = 'expires_tomorrow';
                
                // Check if we already notified TODAY about this
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
                
                // Check if we already notified TODAY about this
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
            if (status !== 'active') {
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
