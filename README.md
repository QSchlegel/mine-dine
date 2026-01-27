# Mine Dine

A Next.js supper club facilitator platform that connects guests with hosts for unique dining experiences.

## Features

- 🔐 **UTXOS Authentication** - Secure wallet-based authentication
- 👥 **User Profiles** - Create profiles with photos, bios, and tags
- 🎯 **Tag-Based Matching** - Comprehensive tag system for matching guests and hosts
- 👆 **Swipe Interface** - Tinder-like interface for discovering hosts
- 🍽️ **Dinner Listings** - Hosts can create and manage dinner events
- 💰 **Flexible Pricing** - Base price (50€ per person) + optional add-ons
- 🧾 **Grocery Bill Transparency** - Hosts can upload grocery bills
- 💳 **Stripe Payments** - Secure payment processing with Apple Pay/Google Pay
- ⭐ **Reviews & Ratings** - Guests can review their dining experiences
- 💬 **Messaging** - Direct messaging between guests and hosts
- 📊 **PostHog Analytics** - User behavior tracking and insights

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- UTXOS project ID (get from [utxos.dev](https://utxos.dev))
- Stripe account (for payments)
- PostHog account (for analytics)

### Installation

#### Quick Start with Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd mine-dine
```

2. Run the setup script:
```bash
./scripts/setup-local.sh
```

3. Edit `.env.local` with your API keys (UTXOS, Stripe, PostHog)

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Manual Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd mine-dine
```

2. Start PostgreSQL in Docker:
```bash
docker-compose up -d postgres
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

5. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

6. Run the development server:
```bash
npm run dev
```

For detailed local setup instructions, see [Local Setup Guide](docs/LOCAL_SETUP.md).

## Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Architecture](docs/ARCHITECTURE.md) - System architecture overview
- [API Documentation](docs/API.md) - API endpoints and usage
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Contributing](docs/CONTRIBUTING.md) - Contributing guidelines
- [User Guide](docs/USER_GUIDE.md) - User documentation
- [Database Schema](docs/DATABASE.md) - Database documentation

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: UTXOS Wallet-as-a-Service
- **Payments**: Stripe
- **Analytics**: PostHog
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Project Structure

```
mine-dine/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   └── dinners/           # Public dinner pages
├── components/            # React components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and helpers
├── prisma/                # Database schema
└── docs/                  # Documentation
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT

## Support

For support, please open an issue in the repository.
