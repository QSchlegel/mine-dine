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

### 6. Configure UTXOS

1. Add your production domain to UTXOS whitelist
2. Update `NEXT_PUBLIC_APP_URL` in environment variables

## Monitoring

- Set up error tracking (Sentry, etc.)
- Monitor PostHog analytics
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
