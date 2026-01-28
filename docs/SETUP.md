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

### Stripe Payments

1. Create an account at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard
3. Set up a webhook endpoint

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Umami Analytics

1. Set up Umami (self-hosted or use a hosted instance)
2. Create a website in your Umami dashboard
3. Copy your website ID and Umami instance URL

```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID="your_website_id"
NEXT_PUBLIC_UMAMI_URL="https://umami.example.com"
```

Note: Umami is privacy-focused and open-source. You can self-host it or use a hosted instance.

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
