import { NextResponse } from 'next/server';

export async function POST(req) {
    const nodemailer = require('nodemailer');
    const smtpHost = process.env.MAIL_HOST;
    const smtpUser = process.env.MAIL_USERNAME;
    const smtpPass = process.env.MAIL_PASSWORD;
    const fromEmail = process.env.MAIL_FROM_ADDRESS;
    const toEmail = process.env.TO_EMAIL


    console.log(smtpHost, smtpUser, smtpPass, fromEmail, toEmail);


    const config = { port: 587, secure: false };

    try {
        console.log(`Attempting connection with port ${config.port} (secure: ${config.secure})`);

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: config.port,
            secure: config.secure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                rejectUnauthorized: false,
            },
            // connectionTimeout: 10000, // 10 seconds
            // debug: true,
            // logger: true
        });

        // Verify SMTP connection
        await transporter.verify();
        console.log('SMTP connection verified');

        // Define email options
        const mailOptions = {
            from: fromEmail,
            to: toEmail,
            subject: 'SMTP Test EmailX',
            text: 'This is a test email sent from Next.js using SMTP.X',
            html: '<p>This is a test email sent from Next.js using SMTPZ.</p>',
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info);

        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to send email:`, error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}