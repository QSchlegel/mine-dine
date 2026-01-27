# Local Development Setup with Docker

This guide will help you run Mine Dine locally with a PostgreSQL database in Docker.

## Prerequisites

- **Docker Desktop** installed and running
- **Node.js** 18+ and npm
- **Git**

## Quick Start

### Option 1: Automated Setup (Recommended)

1. Run the setup script:
```bash
./scripts/setup-local.sh
```

This script will:
- Start PostgreSQL in Docker
- Create `.env.local` from the example
- Install dependencies
- Generate Prisma Client
- Run database migrations

2. Edit `.env.local` with your API keys (UTXOS, Stripe, PostHog)

3. Start the development server:
```bash
./scripts/start-local.sh
```

Or manually:
```bash
npm run dev
```

### Option 2: Manual Setup

1. **Start PostgreSQL in Docker:**
```bash
docker-compose up -d postgres
```

2. **Wait for PostgreSQL to be ready:**
```bash
docker-compose exec postgres pg_isready -U minedine
```

3. **Create `.env.local` file:**
```bash
cp .env.local.example .env.local
```

4. **Edit `.env.local`** with your configuration:
   - Set `DATABASE_URL="postgresql://minedine:minedine@localhost:5432/minedine?schema=public"`
   - Add your UTXOS Project ID
   - Add your Stripe keys (test keys are fine)
   - Add your PostHog key (optional)

5. **Install dependencies:**
```bash
npm install
```

6. **Generate Prisma Client:**
```bash
npx prisma generate
```

7. **Run database migrations:**
```bash
npx prisma migrate dev
```

8. **Start the development server:**
```bash
npm run dev
```

## Accessing the Application

- **Application**: http://localhost:3000
- **PostgreSQL**: localhost:5433 (using port 5433 to avoid conflicts)
  - Username: `minedine`
  - Password: `minedine`
  - Database: `minedine`

## Useful Commands

### Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop PostgreSQL
docker-compose down

# View PostgreSQL logs
docker-compose logs postgres

# Access PostgreSQL CLI
docker-compose exec postgres psql -U minedine -d minedine

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d postgres
npx prisma migrate dev
```

### Database Commands

```bash
# Run migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate Prisma Client (after schema changes)
npx prisma generate
```

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Troubleshooting

### PostgreSQL won't start

1. Check if port 5433 is already in use:
```bash
lsof -i :5433
```

2. If port 5433 is also in use, change the port in `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"  # Use 5434 instead
```

And update `DATABASE_URL` in `.env.local` accordingly to use the new port.

### Database connection errors

1. Verify PostgreSQL is running:
```bash
docker-compose ps
```

2. Check PostgreSQL logs:
```bash
docker-compose logs postgres
```

3. Verify connection string in `.env.local`

### Prisma migration errors

If migrations fail:

1. Reset the database:
```bash
npx prisma migrate reset
```

2. Or manually drop and recreate:
```bash
docker-compose down -v
docker-compose up -d postgres
npx prisma migrate dev
```

### Environment variables not loading

- Make sure you're using `.env.local` (not `.env`)
- Restart the dev server after changing environment variables
- Check that variable names match exactly (case-sensitive)

## Next Steps

- Read the [Setup Guide](SETUP.md) for detailed configuration
- Check the [API Documentation](API.md) to understand the API
- Review the [Architecture Guide](ARCHITECTURE.md) for system overview
