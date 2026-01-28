# Railway Deployment Guide

This guide will walk you through deploying Mine Dine to Railway, a modern platform that makes deployment seamless with automatic PostgreSQL provisioning.

## Prerequisites

- Railway account ([sign up here](https://railway.app))
- GitHub account (for connecting your repository)
- Stripe account (for payments)
- Umami instance (self-hosted or hosted) for analytics
- AWS S3 account (for file storage)

## Step 1: Create a Railway Project

1. Go to [Railway](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your Mine Dine repository
5. Railway will automatically detect it's a Next.js project

## Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL service
4. **Important**: Railway automatically provides `DATABASE_URL` - you don't need to set it manually

## Step 3: Configure Environment Variables

In your Railway project, go to your service → Variables tab and add the following:

### Required Variables

```env
# Better Auth
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=https://your-app.up.railway.app
# Or use your custom domain: https://yourdomain.com

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
# Or use your custom domain: https://yourdomain.com

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Session Management
NEXTAUTH_SECRET=<generate a random string>

# Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_website_id
NEXT_PUBLIC_UMAMI_URL=https://umami.example.com

# OpenAI (for AI dinner planning)
OPENAI_API_KEY=sk-...
```

### Storage Configuration

**Railway Native Bucket (Recommended)**

Railway provides native S3-compatible storage. To use it:

1. In your Railway project, click "+ New" → "Storage" → "Add Bucket"
2. Create a bucket (e.g., `versatile-toolchest-ukdghz`)
3. In your service, click "Variables" → "Add Variable Reference"
4. Connect your service to the bucket - Railway will automatically add:
   - `AWS_ENDPOINT_URL` - Automatically set by Railway
   - `AWS_S3_BUCKET_NAME` - Automatically set by Railway
   - `AWS_DEFAULT_REGION` - Automatically set by Railway (usually "auto")
   - `AWS_ACCESS_KEY_ID` - Automatically set by Railway
   - `AWS_SECRET_ACCESS_KEY` - Automatically set by Railway

**External AWS S3 (Alternative)**

If using external AWS S3 instead of Railway's native bucket:
```env
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_ENDPOINT=https://s3.us-east-1.amazonaws.com  # Optional, for custom endpoints
```

### Optional: OAuth Providers

If you want to enable Google or GitHub OAuth:

```env
BETTER_AUTH_GOOGLE_CLIENT_ID=your_google_client_id
BETTER_AUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret

BETTER_AUTH_GITHUB_CLIENT_ID=your_github_client_id
BETTER_AUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Step 4: Get Your Railway Domain

1. In your Railway project, go to your service
2. Click "Settings" → "Domains"
3. Railway provides a default domain: `your-app.up.railway.app`
4. Copy this domain and update:
   - `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_APP_URL`

## Step 5: Deploy

Railway will automatically:
1. Build your application (`npm run build`)
2. Run Prisma migrations (`prisma migrate deploy` via postinstall script)
3. Start your application (`npm start`)

You can monitor the deployment in the Railway dashboard under "Deployments".

## Step 6: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.up.railway.app/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook secret and add it to Railway as `STRIPE_WEBHOOK_SECRET`

## Step 7: Set Up Custom Domain (Optional)

1. In Railway, go to your service → Settings → Domains
2. Click "Custom Domain"
3. Add your domain (e.g., `minedine.com`)
4. Railway will provide DNS records to add to your domain provider
5. Update environment variables to use your custom domain:
   - `BETTER_AUTH_URL=https://yourdomain.com`
   - `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

## Step 8: Verify Deployment

1. Visit your Railway domain or custom domain
2. Test user registration/login
3. Verify Stripe payments work
4. Check Umami analytics are tracking
5. Test file uploads (if storage is configured)

## Database Migrations

Railway automatically runs migrations on each deployment via the `postinstall` script in `package.json`:

```json
"postinstall": "prisma generate && prisma migrate deploy"
```

If you need to run migrations manually:

1. Open Railway CLI: `railway link`
2. Run: `railway run npx prisma migrate deploy`

## Environment Variables Reference

### Automatically Provided by Railway

- `DATABASE_URL` - Automatically injected when PostgreSQL service is added
- `PORT` - Automatically set (Next.js uses this)
- `RAILWAY_PUBLIC_DOMAIN` - Available for custom domain configuration

### Required in Railway Dashboard

See Step 3 above for the complete list.

## Troubleshooting

### Build Fails

- Check Railway logs for error messages
- Ensure all environment variables are set
- Verify `package.json` has correct build scripts

### Database Connection Errors

- Verify PostgreSQL service is running in Railway
- Check that `DATABASE_URL` is not manually set (Railway provides it automatically)
- Ensure migrations ran successfully (check deployment logs)

### Application Won't Start

- Check that `PORT` environment variable is available (Railway provides this)
- Verify `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` match your Railway domain
- Check Railway logs for runtime errors

### Migrations Not Running

- Verify `postinstall` script exists in `package.json`
- Check deployment logs for migration errors
- Run migrations manually if needed: `railway run npx prisma migrate deploy`

### Stripe Webhooks Not Working

- Verify webhook URL matches your Railway domain
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly
- Ensure webhook events are selected in Stripe dashboard

## Monitoring

Railway provides built-in monitoring:
- View logs in real-time in the Railway dashboard
- Monitor resource usage (CPU, memory)
- Set up alerts for deployment failures

## Backup Strategy

- Railway PostgreSQL includes automatic backups
- Configure additional backups if needed via Railway dashboard
- Export environment variables regularly

## Cost Optimization

- Railway offers a free tier with usage limits
- Monitor resource usage in the dashboard
- Consider upgrading if you exceed free tier limits

## Next Steps

- Set up monitoring and alerts
- Configure custom domain
- Set up CI/CD for automatic deployments
- Review [Deployment Guide](DEPLOYMENT.md) for additional deployment options

## Support

For Railway-specific issues:
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

For application issues:
- Check [Troubleshooting](#troubleshooting) section above
- Review application logs in Railway dashboard
