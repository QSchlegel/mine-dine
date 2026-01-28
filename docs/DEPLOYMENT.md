# Deployment Guide

## Prerequisites

- Production database (PostgreSQL)
- Environment variables configured
- Domain name (optional but recommended)

## Deployment Steps

### 1. Build the Application

```bash
npm run build
```

### 2. Set Up Environment Variables

Configure all production environment variables in your hosting platform.

### 3. Database Migrations

Run migrations on production database:

```bash
npx prisma migrate deploy
```

### 4. Deploy to Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

Vercel will automatically:
- Build the application
- Run migrations
- Deploy to production

### 5. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to environment variables

### 6. Configure Umami Analytics

1. Set up your Umami instance (self-hosted or hosted)
2. Create a website in Umami dashboard
3. Add `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and `NEXT_PUBLIC_UMAMI_URL` to environment variables

## Deployment Options

### Railway (Recommended)

Railway provides a seamless deployment experience with automatic PostgreSQL provisioning. See [Railway Deployment Guide](RAILWAY_DEPLOYMENT.md) for detailed instructions.

### Vercel

Vercel is optimized for Next.js applications and provides excellent developer experience.

## Monitoring

- Set up error tracking (Sentry, etc.)
- Monitor Umami analytics
- Set up database backups
- Monitor Stripe webhook deliveries

## Backup Strategy

- Regular database backups
- Environment variable backups
- Code repository backups

## Security Checklist

- [ ] All environment variables set
- [ ] HTTPS enabled
- [ ] Database credentials secure
- [ ] API rate limiting configured
- [ ] CORS configured properly
- [ ] Security headers set
