# Architecture Overview

## System Architecture

Mine Dine is built as a Next.js 14+ application using the App Router pattern. The application follows a modern full-stack architecture with clear separation of concerns.

## Technology Stack

### Frontend
- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Swipeable**: Swipe gesture handling
- **Framer Motion**: Animations

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Database access layer
- **PostgreSQL**: Relational database

### Services
- **UTXOS**: Wallet-as-a-Service for authentication
- **Stripe**: Payment processing
- **PostHog**: Analytics and user tracking
- **Cloudinary/AWS S3**: File storage (optional)

## Database Schema

### Core Models

- **User**: User accounts with profiles
- **HostApplication**: Host application submissions
- **Tag**: Tags for matching
- **UserTag**: User-tag relationships
- **Dinner**: Dinner event listings
- **DinnerTag**: Dinner-tag relationships
- **DinnerAddOn**: Optional add-ons (wine, beer, etc.)
- **GroceryBill**: Grocery bill uploads
- **Booking**: Dinner reservations
- **SwipeAction**: Swipe interactions
- **Review**: Reviews and ratings
- **Message**: Direct messages

See [Database Documentation](DATABASE.md) for detailed schema.

## Authentication Flow

1. User connects wallet via UTXOS SDK
2. UTXOS returns user identifier
3. App creates/updates user in database
4. Session cookie is set
5. Subsequent requests use session for authentication

## Payment Flow

1. User creates booking
2. Server creates Stripe payment intent
3. Client confirms payment with Stripe
4. Stripe webhook updates booking status
5. Booking is confirmed

## Matching Algorithm

The tag-based matching algorithm calculates similarity between users based on shared tags:

```
matchScore = sharedTags / totalUniqueTags
```

Users with higher match scores are recommended to each other.

## File Upload Flow

1. Client uploads file to `/api/uploads`
2. Server processes file (Cloudinary/S3)
3. Server returns public URL
4. URL is stored in database

## Security

- Authentication required for protected routes
- Role-based access control (USER, HOST, ADMIN)
- Input validation with Zod
- Rate limiting on API routes
- Secure session management
- Environment variable protection

## Deployment

The application is designed to be deployed on:
- **Vercel** (recommended for Next.js)
- **AWS** (with appropriate configuration)
- **Any Node.js hosting** (with environment setup)

See [Deployment Guide](DEPLOYMENT.md) for details.
