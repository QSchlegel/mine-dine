# Quick Start Guide

Get Mine Dine running locally in minutes!

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed

## Steps

1. **Start PostgreSQL:**
```bash
docker compose up -d postgres
```

2. **Create environment file:**
```bash
cp .env.local.example .env.local
```

3. **Edit `.env.local`** - At minimum, you need:
   - `NEXT_PUBLIC_UTXOS_PROJECT_ID` (get from https://utxos.dev)
   - `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test keys from https://stripe.com)

4. **Install dependencies:**
```bash
npm install
```

5. **Set up database:**
```bash
npx prisma generate
npx prisma migrate dev
```

6. **Start the app:**
```bash
npm run dev
```

7. **Open your browser:**
   - App: http://localhost:3000
   - Database: localhost:5436 (username: `minedine`, password: `minedine`)

## Troubleshooting

**Port conflicts?** If port 5436 is in use, edit `docker-compose.yml` and change the port mapping, then update `DATABASE_URL` in `.env.local`.

**Database connection errors?** Make sure PostgreSQL container is running:
```bash
docker compose ps
```

For more details, see [Local Setup Guide](docs/LOCAL_SETUP.md).
