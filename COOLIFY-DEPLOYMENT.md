# Coolify Deployment Guide

This guide will help you deploy the MAPOS Customer Services Manager to Coolify with a separate PostgreSQL database.

## Prerequisites

- Coolify instance running
- Access to Coolify dashboard
- Domain name (optional but recommended)

## Deployment Steps

### 1. PostgreSQL Database Setup

1. In Coolify dashboard, go to **Resources** → **Databases**
2. Click **+ New Database** → **PostgreSQL**
3. Configure:
   - **Name**: `mp-customers-db`
   - **Database Name**: `mp_customers`
   - **Username**: `postgres`
   - **Password**: Generate a strong password
   - **Version**: `15` (recommended)
4. Deploy the database
5. Note the internal connection details (usually `postgresql://postgres:password@service-name:5432/mp_customers`)

### 2. Application Deployment

1. In Coolify dashboard, go to **Projects** → **+ New Resource** → **Application**
2. Configure Git Repository:
   - **Repository**: Your GitHub repository URL
   - **Branch**: `master` or your deployment branch
   - **Build Pack**: Docker
3. Configure Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@mp-customers-db:5432/mp_customers?schema=public
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_admin_password
   JWT_SECRET=your-very-strong-secret-key-minimum-32-characters
   MAIL_HOST=smtp.sendgrid.net
   MAIL_USERNAME=apikey
   MAIL_PASSWORD=your_sendgrid_api_key
   MAIL_FROM_ADDRESS=your-email@yourdomain.com
   TO_EMAIL=notifications@yourdomain.com
   renewPassword=your_master_renew_password
   NEXT_TELEMETRY_DISABLED=1
   PORT=3000
   ```
4. Configure Domains (if needed):
   - Add your domain or use the generated Coolify domain
5. Configure Build Settings:
   - **Dockerfile Location**: `./Dockerfile`
   - **Build Context**: Root directory
6. Deploy the application

### 3. Database Migration

After the first deployment, you need to run the database migrations:

1. Go to your application in Coolify
2. Open **Terminal/Console**
3. Run the migration command:
   ```bash
   npx prisma migrate deploy
   ```

Alternatively, you can add this to your Dockerfile as a startup script.

### 4. Health Check Setup

The application includes a health check endpoint at `/api/health`. You can configure Coolify to use this for monitoring:

- **Health Check URL**: `http://your-domain/api/external/health`
- **Expected Status Code**: `200`

## Environment Variables Explanation

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@db:5432/mp_customers?schema=public` |
| `ADMIN_USERNAME` | Admin panel username | `admin` |
| `ADMIN_PASSWORD` | Admin panel password | `SecurePassword123` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-very-strong-secret-key-minimum-32-characters` |
| `MAIL_HOST` | SMTP server host | `smtp.sendgrid.net` |
| `MAIL_USERNAME` | SMTP username | `apikey` |
| `MAIL_PASSWORD` | SMTP password/API key | `SG.xxx...` |
| `MAIL_FROM_ADDRESS` | Sender email address | `noreply@yourdomain.com` |
| `TO_EMAIL` | Default recipient email | `admin@yourdomain.com` |
| `renewPassword` | Master renewal password | `masterRenewPass` |

## SSL/TLS Configuration

Coolify automatically handles SSL certificates. Make sure to:
1. Configure your domain properly
2. Enable **Force HTTPS** in Coolify settings
3. Wait for certificate generation (usually automatic)

## Backup Strategy

### Database Backups
1. Use Coolify's built-in backup feature for PostgreSQL
2. Configure automated backups (daily recommended)
3. Store backups in external storage (S3, etc.)

### Application Backups
- Your application is stateless, so Git repository serves as backup
- Ensure all configuration is in environment variables
- Document any manual configuration steps

## Monitoring

### Application Monitoring
- Use the `/api/health` endpoint for uptime monitoring
- Monitor application logs in Coolify dashboard
- Set up alerts for failed deployments

### Database Monitoring
- Monitor database performance in Coolify
- Watch for connection limits and storage usage
- Set up alerts for database issues

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database service is running
   - Check network connectivity between services

2. **Build Failures**
   - Check Dockerfile syntax
   - Verify all dependencies are listed in package.json
   - Check for missing environment variables during build

3. **Prisma Issues**
   - Ensure Prisma is properly generated during build
   - Run migrations manually if needed
   - Check database schema compatibility

### Logs
- Application logs: Available in Coolify application dashboard
- Database logs: Available in Coolify database dashboard
- Build logs: Available during deployment process

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **Database Security**: Use strong passwords and restrict access
3. **JWT Secret**: Use a long, random secret key
4. **Admin Credentials**: Use strong, unique passwords
5. **HTTPS**: Always use HTTPS in production
6. **Firewall**: Restrict database access to application only

## Performance Optimization

1. **Database**: 
   - Configure appropriate connection pooling
   - Monitor query performance
   - Set up proper indexes

2. **Application**:
   - Enable Next.js optimizations (already configured)
   - Use CDN for static assets if needed
   - Monitor memory usage

3. **Caching**:
   - Consider Redis for session storage
   - Implement application-level caching where appropriate

## Updates and Maintenance

1. **Application Updates**: 
   - Push to Git repository
   - Coolify will auto-deploy (if configured)
   - Monitor deployment logs

2. **Database Migrations**:
   - Test migrations in staging first
   - Run migrations during low-traffic periods
   - Always backup before major migrations

3. **Dependencies**:
   - Regularly update npm packages
   - Monitor security advisories
   - Test thoroughly before deploying updates
