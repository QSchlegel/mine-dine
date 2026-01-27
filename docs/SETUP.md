# Setup Guide

This guide will walk you through setting up Mine Dine on your local machine.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **PostgreSQL**: Version 14 or higher
- **Git**: For cloning the repository

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd mine-dine
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in the following:

### Database

```env
DATABASE_URL="postgresql://user:password@localhost:5432/minedine?schema=public"
```

### UTXOS Authentication

1. Create an account at [utxos.dev](https://utxos.dev)
2. Create a new project
3. Copy your Project ID

```env
NEXT_PUBLIC_UTXOS_PROJECT_ID="your_project_id"
NEXT_PUBLIC_NETWORK_ID="0"  # 0 for preprod, 1 for mainnet
```

### Stripe Payments

1. Create an account at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard
3. Set up a webhook endpoint

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### PostHog Analytics

1. Create an account at [posthog.com](https://posthog.com)
2. Get your project API key

```env
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### File Upload (Optional)

Choose either Cloudinary or AWS S3:

**Cloudinary:**
```env
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

**AWS S3:**
```env
AWS_S3_BUCKET_NAME="your_bucket_name"
AWS_S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
```

## Step 4: Set Up Database

1. Create a PostgreSQL database:

```bash
createdb minedine
```

2. Run migrations:

```bash
npx prisma migrate dev
```

3. Generate Prisma Client:

```bash
npx prisma generate
```

## Step 5: Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check your DATABASE_URL format
- Ensure the database exists

### UTXOS Authentication Issues

- Verify your Project ID is correct
- Check that your domain is whitelisted in UTXOS dashboard
- Ensure NEXT_PUBLIC_NETWORK_ID matches your environment

### Stripe Issues

- Use test keys for development
- Verify webhook endpoint is configured
- Check webhook secret matches

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm run dev
```

## Next Steps

- Read the [Architecture Guide](ARCHITECTURE.md)
- Check the [API Documentation](API.md)
- Review the [User Guide](USER_GUIDE.md)
