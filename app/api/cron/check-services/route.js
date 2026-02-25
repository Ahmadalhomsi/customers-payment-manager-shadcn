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
            const serviceEndDate = new Date(service.endingDate);
            
            // Adjust for the specific case where dates are stored as T21:00:00.000Z (previous day in UTC)
            // If a date is stored as 2026-02-26T21:00:00.000Z, it effectively means "End of 2026-02-26" in Turkey (UTC+3 -> 00:00 next day)
            // But usually, humans mean "The night of Feb 26th".
            // However, mathematically, 21:00 UTC IS 00:00 Istanbul (next day).
            
            // Fix: We should check if the time is close to midnight (e.g. > 20:00 UTC) and treat it as the "intended" day if needed.
            // BUT, looking at your data: 
            // "endDateRaw":"2026-02-26T21:00:00.000Z" -> "endDateLocal":"27.02.2026"
            // "todayLocal":"25.02.2026"
            // Days remaining: 2 (27 - 25 = 2)
            
            // If you WANT 2026-02-26T21:00:00.000Z to be treated as Feb 26th:
            // We can subtract a few hours before converting to timezone to ensure it falls back to the previous day.
            // OR we can just use the UTC date parts directly if your system treats dates as "Universal Date" regardless of time.
            
            // ADJUSTMENT: Subtract 3 hours from the date before converting to ensure 21:00 UTC (00:00 TRT) falls back to the previous day?
            // actually, if the database stores 21:00 UTC, it means it was likely saved as "00:00 TRT" by a system that compensated for timezone.
            // If the intention is that it expires "At the end of Feb 26th", then 00:00 Feb 27th is technically correct.
            // BUT for notification purposes, if today is Feb 26th, and it expires at 00:00 Feb 27th, it expires "Today".
            
            // Let's stick to strict timezone conversion but ensure we handle "expires today" logic correctly.
            // If today is 25th, and it expires 27th (00:00), that is indeed 2 days.
            // If today is 26th, and it expires 27th (00:00), that is 1 day remaining (expires tomorrow at midnight).
            // Wait, if it expires at 00:00:00 on the 27th, that effectively means it is valid for the ENTIRE 26th, and expires the moment 27th starts.
            // So on the 26th, it should say "Expires Today" (meaning expires tonight).
            
            // LOGIC CHANGE:
            // If the time is exactly 00:00:00 in Istanbul (which is 21:00 UTC previous day), 
            // we should treat the "Effective End Date" as the PREVIOUS day for notification purposes.
            // i.e., Expiring at Start of Feb 27 = Expiring at End of Feb 26.
            
            const endDateInIstanbul = toZonedTime(serviceEndDate, TIMEZONE);
            
            // Check if it's exactly midnight (00:00:00)
            const isMidnight = endDateInIstanbul.getHours() === 0 && endDateInIstanbul.getMinutes() === 0;
            
            let effectiveEndDate;
            if (isMidnight) {
                // If it ends at 00:00:00, subtract 1 millisecond to treat it as the previous day's end
                const adjustedDate = new Date(endDateInIstanbul.getTime() - 1);
                effectiveEndDate = new Date(adjustedDate.getFullYear(), adjustedDate.getMonth(), adjustedDate.getDate());
            } else {
                effectiveEndDate = new Date(endDateInIstanbul.getFullYear(), endDateInIstanbul.getMonth(), endDateInIstanbul.getDate());
            }

            // 3. Calculate Days Remaining using Calendar Days
            const daysRemaining = differenceInCalendarDays(effectiveEndDate, today);

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
                    endDateLocal: effectiveEndDate.toLocaleDateString('tr-TR'),
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
