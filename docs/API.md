# API Documentation

## Authentication

All API routes (except public endpoints) require authentication via UTXOS. The user ID is stored in a session cookie after authentication.

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Authentication

#### `GET /api/auth/callback`
UTXOS authentication callback. Creates or updates user in database.

**Query Parameters:**
- `address` (string): Wallet address
- `utxosUserId` (string, optional): UTXOS user ID

**Response:**
- Redirects to `/dashboard` on success

### Profiles

#### `GET /api/profiles`
Get current user's profile.

**Response:**
```json
{
  "profile": {
    "id": "string",
    "name": "string",
    "email": "string",
    "bio": "string",
    "profileImageUrl": "string",
    "coverImageUrl": "string",
    "userTags": [...]
  }
}
```

#### `PATCH /api/profiles`
Update current user's profile.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "bio": "string",
  "profileImageUrl": "string",
  "coverImageUrl": "string"
}
```

### Tags

#### `GET /api/tags`
Get all tags.

**Query Parameters:**
- `category` (string, optional): Filter by category

**Response:**
```json
{
  "tags": [
    {
      "id": "string",
      "name": "string",
      "category": "CUISINE | DIETARY | INTEREST | LIFESTYLE | SKILL | OTHER"
    }
  ]
}
```

#### `POST /api/tags` (Admin only)
Create a new tag.

**Request Body:**
```json
{
  "name": "string",
  "category": "CUISINE | DIETARY | INTEREST | LIFESTYLE | SKILL | OTHER"
}
```

### Dinners

#### `GET /api/dinners`
Get all published dinners.

**Query Parameters:**
- `status` (string): Filter by status (default: PUBLISHED)
- `tagId` (string): Filter by tag
- `limit` (number): Results limit (default: 20)
- `offset` (number): Results offset (default: 0)

#### `POST /api/dinners` (Host only)
Create a new dinner listing.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "cuisine": "string",
  "maxGuests": 10,
  "basePricePerPerson": 50.0,
  "location": "string",
  "dateTime": "ISO 8601 datetime",
  "imageUrl": "string",
  "tagIds": ["string"]
}
```

#### `GET /api/dinners/[id]`
Get a single dinner by ID.

#### `PATCH /api/dinners/[id]` (Host/Admin)
Update a dinner listing.

#### `DELETE /api/dinners/[id]` (Host/Admin)
Delete a dinner listing.

### Bookings

#### `GET /api/bookings`
Get current user's bookings.

#### `POST /api/bookings`
Create a new booking.

**Request Body:**
```json
{
  "dinnerId": "string",
  "numberOfGuests": 2,
  "selectedAddOns": [
    {
      "addOnId": "string",
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "booking": {...},
  "clientSecret": "string" // Stripe payment intent client secret
}
```

### Reviews

#### `GET /api/reviews?dinnerId=...`
Get reviews for a dinner.

#### `POST /api/reviews`
Create a review.

**Request Body:**
```json
{
  "bookingId": "string",
  "rating": 5,
  "comment": "string"
}
```

### Messages

#### `GET /api/messages?userId=...`
Get messages/conversations.

#### `POST /api/messages`
Send a message.

**Request Body:**
```json
{
  "recipientId": "string",
  "bookingId": "string", // optional
  "content": "string"
}
```

### Swipe

#### `GET /api/swipe`
Get hosts to swipe on.

#### `POST /api/swipe`
Perform a swipe action.

**Request Body:**
```json
{
  "targetUserId": "string",
  "action": "LIKE | PASS"
}
```

**Response:**
```json
{
  "swipeAction": {...},
  "match": true // if both users liked each other
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": {...} // optional, for validation errors
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
