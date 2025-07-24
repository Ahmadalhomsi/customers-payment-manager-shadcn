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

1. **Set Environment Variables in Coolify**
   - Add DATABASE_URL in Coolify's environment variables
   - Format: `postgresql://user:password@host:port/database?schema=public`

2. **Restart Container After Env Changes**
   - **IMPORTANT**: After changing environment variables in Coolify, you MUST restart the container
   - Go to Coolify → Your Application → Click "Restart" or "Redeploy"
   - Environment variables only take effect after container restart

3. **Verify Environment Variables**
   - Go to Coolify → Your Application → Terminal
   - Run: `env | grep DATABASE` to verify the DATABASE_URL is correct

4. **Run Database Migrations**
   - In terminal, run: `npx prisma db push`
   - Or use the convenience script: `./migrate.sh`

5. **Verify Health**
   - Check: `https://your-domain/api/external/health`

## Important Notes

- **Environment Variables**: After changing env vars in Coolify, ALWAYS restart the container
- **Database Connection**: Use Coolify's PostgreSQL service connection string
- **Container Restart**: Required for env changes to take effect
- **Migrations**: Run automatically on startup, but can be run manually if needed
- The application uses Coolify's PostgreSQL service format
- Password in URL should be URL-encoded if it contains special characters
