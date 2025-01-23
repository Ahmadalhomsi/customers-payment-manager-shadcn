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

const port = process.env.PORT || 3000;



app.prepare().then(() => {
    const server = express();
    const prisma = new PrismaClient();
    // Define custom Express routes
    //   server.get('/api/custom-endpoint', (req, res) => {
    //     res.json({ message: 'This is a custom API route' });
    //   });

    cron.schedule('* * * * *', async () => {
        console.log('running a task every minute');
        const reminders = await prisma.reminder.findMany({
            where: {
                status: "SCHEDULED"
            }
        });
        const today = new Date();
        console.log('payments', reminders);
        console.log("today", today);
        console.log(isSameDay(reminders[0].scheduledAt, today) ? 'Dates are on the same day' : 'Dates are on different days');
    });

    // Use custom middleware if needed (e.g., logging, authentication)
    server.use((req, res, next) => {
        console.log('Request received:', req.url);
        next();
    });

    // Fallback to Next.js request handler for any other routes
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`Server is running on http://localhost:${port}`);
    });
});
