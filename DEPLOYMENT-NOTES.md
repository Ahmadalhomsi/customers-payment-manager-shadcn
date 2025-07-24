# Coolify Deployment Notes

## Environment Variables for Your Application

Based on your Coolify setup, use these environment variables:


### Application Settings
```
NODE_ENV=production
JWT_SECRET=your-very-strong-secret-key-min-32-characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
renewPassword=masterRenewPass
```

### Email Configuration (if using SendGrid)
```
MAIL_HOST=smtp.sendgrid.net
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_FROM_ADDRESS=your-email@yourdomain.com
TO_EMAIL=notifications@yourdomain.com
```

### Next.js Configuration
```
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

## Post-Deployment Steps

After the container is running successfully:

1. **Run Database Migrations**
   - Go to Coolify → Your Application → Terminal
   - Run: `npx prisma migrate deploy`

2. **Verify Health**
   - Check: `https://your-domain/api/external/health`

## Important Notes

- The new Dockerfile has **no health checks** - Coolify will handle monitoring
- Database migrations need to be run manually after deployment
- The application uses Coolify's PostgreSQL service format
- Password in URL is URL-encoded (`%2A` = `*`)
