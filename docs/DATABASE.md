# Database Documentation

## Schema Overview

The database uses PostgreSQL with Prisma ORM. All models are defined in `prisma/schema.prisma`.

## Entity Relationship Diagram

```
User ──┬── HostApplication
       ├── UserTag ── Tag
       ├── Dinner (as host)
       ├── Booking
       ├── Review
       ├── Message (as sender/recipient)
       └── SwipeAction

Dinner ──┬── DinnerTag ── Tag
         ├── DinnerAddOn
         ├── GroceryBill
         ├── Booking
         └── Review
```

## Models

### User
- Stores user account information
- Links to UTXOS authentication
- Has role: USER, HOST, or ADMIN

### Tag
- Categories: CUISINE, DIETARY, INTEREST, LIFESTYLE, SKILL, OTHER
- Used for matching users

### Dinner
- Created by hosts
- Has status: DRAFT, PUBLISHED, CANCELLED, COMPLETED
- Base price per person (default 50€)

### Booking
- Links user to dinner
- Tracks payment via Stripe
- Status: PENDING, CONFIRMED, CANCELLED, COMPLETED

### SwipeAction
- Tracks like/pass actions
- Used for match detection

## Indexes

Key indexes for performance:
- `User.utxosUserId` (unique)
- `User.email` (unique)
- `Booking.stripePaymentIntentId` (unique)
- `SwipeAction.userId_targetUserId` (unique composite)

## Migrations

Run migrations:
```bash
npx prisma migrate dev  # Development
npx prisma migrate deploy  # Production
```

## Seed Data

Create seed script in `prisma/seed.ts` to populate initial tags and admin user.
