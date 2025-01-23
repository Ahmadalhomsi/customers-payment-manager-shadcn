const { PrismaClient } = require('@prisma/client');
const express = require('express');
const next = require('next');
const cron = require('node-cron');
const { isSameDay } = require('date-fns');

// Determine whether you're in production or development mode
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });

// Handle Next.js requests using its built-in handler
const handle = app.getRequestHandler();

const port = process.env.PORT || 3001;



app.prepare().then(() => {
    const server = express();
    const prisma = new PrismaClient();

    // Function to check if two dates are the same day
    const isSameDay = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    };

    // Schedule daily check at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily reminder check...');
        try {
            const reminders = await prisma.reminder.findMany({
                where: { status: "SCHEDULED" }
            });

            const today = new Date();

            for (const reminder of reminders) {
                try {
                    const scheduledDate = new Date(reminder.scheduledAt);

                    if (isSameDay(scheduledDate, today)) {
                        console.log(`Processing reminder ${reminder.id}...`);

                        // Here you would add your actual reminder sending logic
                        // For example: sendEmail(reminder);
                        // Simulate processing
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Update reminder status after successful processing
                        await prisma.reminder.update({
                            where: { id: reminder.id },
                            data: { status: 'SENT' }
                        });
                    }
                } catch (reminderError) {
                    console.error(`Error processing reminder ${reminder.id}:`, reminderError);
                    await prisma.notifications.create({
                        data: {
                            title: 'Reminder Failed to send (Cron Job)',
                            message: `Failed to process reminder: ${reminder.message || 'No message'} (ID: ${reminder.id})`,
                            type: 'error',
                            read: false,
                        },
                    });
                }
            }
        } catch (error) {
            console.error('Cron job failed:', error);
            await prisma.notifications.create({
                data: {
                    title: 'Reminder Failed to send (Cron Job)',
                    message: `Cron job failed: ${error.message}`,
                    type: 'error',
                    read: false,
                },
            });
        }
    });

    // Rest of your Express server setup
    server.use((req, res, next) => {
        console.log('Request received:', req.url);
        next();
    });

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`Server is running on http://localhost:${port}`);
    });
});